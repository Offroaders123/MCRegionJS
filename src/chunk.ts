import { read, Int16, Int32, NBTData } from "nbtify";
import { decompress, runLengthDecode } from "./compression.js";

import type { ShortTag, IntTag, LongTag, StringTag } from "nbtify";
import type { Region, Entry } from "./region.js";

/* These types should eventually be derived from Region-Types. */

export type Chunk = AquaticChunkData;

interface ChunkData {
  Format: IntTag;
  X: IntTag;
  Y: IntTag;
  LastUpdate: LongTag;
  Inhabited: LongTag;
  Blocks: Uint16Array;
  Submerged: Uint16Array;
  DataGroupCount: number;
  SkyLight: Uint8Array;
  BlockLight: Uint8Array;
  // TileEntities: Entity[];
  // TileTicks: TileTick[];
}

export declare interface Entity {
  id: StringTag;
  x: IntTag;
  y: IntTag;
}

export declare interface TileTick {
  i: StringTag;
  p: IntTag;
  t: IntTag;
  x: IntTag;
  y: IntTag;
  z: IntTag;
}

export async function readChunks(region: Region): Promise<(Chunk | null)[]> {
  return Promise.all(region.map(readEntry));
}

export async function readEntry(entry: Entry | null): Promise<Chunk | null> {
  if (entry === null) return null;
  const { data, decompressedLength } = entry;

  const rleCompressedEntry = await decompress(data,"deflate-raw");
  const decompressedEntry = runLengthDecode(rleCompressedEntry,decompressedLength);

  const parser = new AquaticParser();
  return parser.ParseChunk(decompressedEntry);
}

class DataInputManager {
  declare data: Uint8Array;
  declare start_of_data: Uint8Array;
  declare size_of_data: number;
  declare errorAdvance: number;
  declare shouldFree: boolean;
  declare isLittle: boolean;

  constructor(data_in: Uint8Array, size: number, shouldFreeIn: boolean) {
    this.data = data_in;
    this.start_of_data = this.data;
    this.size_of_data = size;
    this.errorAdvance = 0;
    this.shouldFree = shouldFreeIn;
    this.isLittle = false;//start writing in big endian
  }

  // ~DataInputManager() {
  //   if (shouldFree) {
  //     free(start_of_data);
  //   }
  // }

  setLittleEndian(): void {
    this.isLittle = true;
  }

  setBigEndian(): void {
    this.isLittle = false;
  }

  seekStart(): void {
    this.data = this.start_of_data;
  }

  seekEnd(): void {
    this.data = this.start_of_data + this.size_of_data - 1;
  }

  getPosition(): number {
    return this.data - this.start_of_data;
  }

  isEndOfData(): boolean {
    return this.data === this.start_of_data + this.size_of_data - 1;
  }

  incrementPointer(amount: number): void {/*this huge function will be for debugging, not in the real thing, the real thing will only be
    this.data += amount or increamenting until reaches the end */
    if (this.data + amount < this.start_of_data + this.size_of_data && this.data + amount >= this.start_of_data) /*[[likely]]*/ {
      this.data += amount;
    } else {
      if (amount === 1){
        //if (errorAdvance != 0) {
          //printf("tried to advance pointer beyond the end or before the start\n");
          //only needed to prevent NBT reads from overflowing
        //}
        this.errorAdvance++;
      } else {
        if (this.data + amount >= this.start_of_data + this.size_of_data){
          //data += (size_of_data - getPosition());
          this.seekEnd();
          this.errorAdvance++;
        } else if (this.data + amount <= this.start_of_data){
          //data += (size_of_data - getPosition());
          this.seekStart();
          this.errorAdvance++;
        }
        //else {
          //for (int x = 0; x <= amount; x++) {
            /*if (data + x == start_of_data + size_of_data) {
              data += x - 1;
              if (errorAdvance != 0) {
                printf("tried to advance pointer beyond the end\n");
              }
              errorAdvance++;
            }
            else if (data + x == start_of_data) {
              data += x + 1;
              if (errorAdvance != 0) {
                printf("tried to advance pointer before the start\n");
              }
              errorAdvance++;
            }*/
          //}
        //}
      }
    }
  }

  seek(pos: number): void {
    this.data = this.start_of_data;
    this.incrementPointer(pos);
  }

  readByte(): number {
    const val: number = this.data[0]!;
    this.incrementPointer(1);
    return val;
  }

  readShort(): number {
    let val: number;
    if (this.isLittle) {
      val = ((this.data[1]! << 8) | (this.data[0]!));
    } else {
      val = ((this.data[0]! << 8) | (this.data[1]!));
    }
    this.incrementPointer(2);
    return val;
  }

  readInt24(): number {
    let val: number = this.readInt();
    if (this.isLittle){
      val = val & 0x00FFFFFF;
    } else {
      val = (val & 0xFFFFFF00) >> 8;
    }
    this.incrementPointer(-1);//3 = 4 - 1
    return val;
  }

  readInt24Le(isLittleIn: boolean): number {
    const originalEndianType: boolean = this.isLittle;
    this.isLittle = isLittleIn;
    let val: number = this.readInt();
    if (isLittleIn){
      val = val & 0x00FFFFFF;
    } else {
      val = (val & 0xFFFFFF00) >> 8;
    }
    this.incrementPointer(-1);//3 = 4 - 1
    this.isLittle = originalEndianType;
    return val;
  }

  readInt(): number {
    let val: number;
    if (this.isLittle) {
      val = ((this.data[3]! << 24) | (this.data[2]! << 16) | (this.data[1]! << 8) | (this.data[0]!));
    } else {
      val = ((this.data[0]! << 24) | (this.data[1]! << 16) | (this.data[2]! << 8) | (this.data[3]!));
    }
    this.incrementPointer(4);
    return val;
  }

  readLong(): bigint {
    let val: bigint;
    if (this.isLittle){
      val = BigInt((this.data[7]! << 56) | (this.data[6]! << 48) | (this.data[5]! << 40) | (this.data[4]! << 32) | (this.data[3]! << 24) | (this.data[2]! << 16) | (this.data[1]! << 8) | (this.data[0]!));
    } else {
      val = BigInt((this.data[0]! << 56) | (this.data[1]! << 48) | (this.data[2]! << 40) | (this.data[3]! << 32) | (this.data[4]! << 24) | (this.data[5]! << 16) | (this.data[6]! << 8) | (this.data[7]!));
    }
    this.incrementPointer(8);
    return val;
  }

  readBoolean(): boolean {
    const val: number = this.data[0]!;
    this.incrementPointer(1);
    return val !== 0;
  }

  readUTF(): string {
    const length: number = this.readShort();
    // std::string returnString((char*)data, length);
    this.incrementPointer(length);
    return returnString;
  }

  readString(): string {
    let returnString: string = "";
    let i: number = 1;
    let nextChar: number;
    while ((nextChar = this.readByte()) !== 0 && (i++ <= 0x7FFFFFFF)){
      returnString += nextChar;
    }
    return returnString;
  }

  readStringByAmount(amount: number): string {
    let returnString: string = "";
    let strVec: number[] = [];
    strVec.resize(amount + 1);
    let str = strVec.data();
    str[amount] = 0;

    this.readOntoData(amount, str);
    returnString = String(str);
    return returnString;
  }

  readWString(): string {
    let returnString: string = "";
    let nextChar: number;
    while ((nextChar = this.readShort()) !== 0){
      returnString += nextChar;
    }
    return returnString;
  }

  readWStringByAmount(amount: number): string {
    let returnString: string = "";
    for (let i = 0; i < amount; i++){
      let c: number = this.readShort();
      if (c !== 0){
        returnString += c;
      }
      //else {
        //break;
      //}
    }
    return returnString;
  }

  readFloat(): number {
    const val: number = this.readInt();
    return val;
  }

  readDouble(): number {
    const val: bigint = this.readLong();
    return Number(val);
  }

  readWithOffset(offset: number, amount: number): Uint8Array {
    const val = new Uint8Array(amount);
    this.incrementPointer(offset);
    // memcpy(val, data, amount);
    this.incrementPointer(amount);
    return val;
  }

  read(amount: number): Uint8Array {
    const val = new Uint8Array(amount);
    // memcpy(val, data, amount);
    this.incrementPointer(amount);
    return val;
  }

  readOntoData(amount: number, dataIn: Uint8Array): void {
    // memcpy(dataIn, data, amount);
    this.incrementPointer(amount);
  }

  readIntoVector(amount: number): Uint8Array {
    const returnVector = new Uint8Array(amount);
    for (let i = 0; i < amount; i++){
      // returnVector.push_back(*data);
      returnVector[i] = this.data[i]!;
      this.incrementPointer(1);
    }
    return returnVector;
  }

  readIntoVectorWithOffset(offset: number, amount: number): Uint8Array {
    this.incrementPointer(offset);
    const returnVector = new Uint8Array(amount);
    for (let i = 0; i < amount; i++) {
      // returnVector.push_back(*data);
      returnVector[i] = this.data[i]!;
      this.incrementPointer(1);
    }
    return returnVector;
  }
}

interface AquaticChunkData {
  version: ShortTag;
  chunkX: IntTag;
  chunkZ: IntTag;
  lastUpdate: LongTag;
  inhabitedTime: LongTag;
  blocks: Uint16Array;
  submerged: Uint16Array;
  DataGroupCount: IntTag;
  skyLight: Uint8Array;
  blockLight: Uint8Array;
  heightMap: Uint8Array;
  terrainPopulated: ShortTag;
  biomes: Uint8Array;
  NBTData: NBTData;
}

/**
 * Temporary alias/placeholder from UtterEvergreen1's examples.
 * 
 * @deprecated
*/
type UniversalChunkFormat = Chunk;

/**
 * @deprecated
*/
type LCEFixes = unknown;

class AquaticParser {
  LCE_ChunkData: AquaticChunkData = {} as AquaticChunkData;

  // AquaticParser::~AquaticParser()
  // {
  //   if (LCE_ChunkData.NBTData)
  //   {
  //     LCE_ChunkData.NBTData->NbtFree();
  //     delete LCE_ChunkData.NBTData;
  //   }
  //   //delete LCE_ChunkData;
  //   //free(LCE_ChunkData);
  // }

  async ParseChunk(inputData: DataInputManager, _dimension?: number, _fixes?: LCEFixes): Promise<UniversalChunkFormat> {
    this.LCE_ChunkData.version = new Int16(inputData.readShort());
    this.LCE_ChunkData.chunkX = new Int32(inputData.readInt());
    this.LCE_ChunkData.chunkZ = new Int32(inputData.readInt());
    this.LCE_ChunkData.lastUpdate = inputData.readLong();
    this.LCE_ChunkData.inhabitedTime = inputData.readLong();
    this.parseBlocks(inputData);
    // return this.LCE_ChunkData;
    this.readLights(inputData);
    this.LCE_ChunkData.heightMap = this.read256(inputData);
    this.LCE_ChunkData.terrainPopulated = new Int16(inputData.readShort());
    this.LCE_ChunkData.biomes = this.read256(inputData);
    this.readNBTData(inputData);
    return this.LCE_ChunkData;
    // return LCE_universal.convertLCE1_13RegionToUniveral(this.LCE_ChunkData, dimension, fixes);
  }

  ParseChunkForAccess(inputData: DataInputManager, _dimension?: number, _fixes?: LCEFixes): UniversalChunkFormat {
    inputData.seek(26);
    this.parseBlocks(inputData);
    return this.LCE_ChunkData;
    // return LCE_universal.convertLCE1_13RegionToUniveralForAccess(this.LCE_ChunkData, dimension, fixes);
  }

  async readNBTData(inputData: DataInputManager): Promise<void> {
    if (inputData.data[0] === 0xA) {
      this.LCE_ChunkData.NBTData = await read(inputData.data);
    }
  }

  read256(inputData: DataInputManager): Uint8Array {
    const array1: Uint8Array = inputData.readIntoVector(256);
    return array1;
  }

  readx128(inputData: DataInputManager): Uint8Array {
    const num: number = inputData.readInt();
    const array1: Uint8Array = inputData.readIntoVector((num + 1) * 0x80);
    return array1;
  }

  readLights(inputData: DataInputManager): void {
    const dataArray = new Array(4) as [Uint8Array,Uint8Array,Uint8Array,Uint8Array];
    for (let i = 0; i < dataArray.length; i++){
      const item: Uint8Array = this.readx128(inputData);
      dataArray[i] = item;
    }
    this.LCE_ChunkData.DataGroupCount = new Int32(dataArray[0].length + dataArray[1].length + dataArray[2].length + dataArray[3].length);

    const segments = [ 0, 0, 1, 1 ] as const;
    const offsets = [ 0, 0x4000, 0, 0x4000 ] as const;
    const lightsData = [
      new Uint8Array(0x8000),
      new Uint8Array(0x8000)
    ] as const;
    for (let j = 0; j < 4; j++){
      const startingIndex: number = offsets[j]!;
      const currentLightSegment: number = segments[j]!;
      const data: Uint8Array = dataArray[j]!;
      for (let k = 0; k < 0x80; k++){
        const headerValue: number = data[k]!;
        if (headerValue === 0x80 || headerValue === 0x81){
          this.copyByte128(lightsData[currentLightSegment]!, k * 0x80 + startingIndex, (headerValue === 0x80) ? 0 : 255);
        } else {
          this.copyArray128(data, ((headerValue + 1) * 0x80), lightsData[currentLightSegment]!, k * 0x80 + startingIndex);
        }
      }
    }
    this.LCE_ChunkData.skyLight = lightsData[0]; //java stores skylight (and blocklight?) the same way LCE does, it does not need to be converted
    this.LCE_ChunkData.blockLight = lightsData[1];
  }

  copyByte128(writeVector: Uint8Array, writeOffset: number, value: number): void {
    for (let i = 0; i < 0x80; i++){
      writeVector[writeOffset + i] = value;
    }
  }

  copyArray128(readVector: Uint8Array, readOffset: number, writeVector: Uint8Array, writeOffset: number): void {
    for (let i = 0; i < 0x80; i++){
      writeVector[writeOffset + i] = readVector[readOffset + i]!;
    }
  }

  parseBlocks(inputData: DataInputManager): void {
    this.LCE_ChunkData.blocks = new Uint16Array(0x20000);
    this.LCE_ChunkData.submerged = new Uint16Array(0x20000);
    const maxSectionAddress: number = inputData.readShort() << 8;
    console.log(maxSectionAddress);
    const sectionJumpTable = new Uint16Array(16);//read 16 shorts so 32 bytes
    for (let i = 0; i < sectionJumpTable.length; i++){
      const address: number = inputData.readShort();
      sectionJumpTable[i] = address;
    }
    // console.log(sectionJumpTable);
    const sizeOfSubChunks: Uint8Array = inputData.readIntoVector(16);
    if (maxSectionAddress === 0){
      return;
    }
    // console.log("sectionJumpTable - length:",sectionJumpTable.length);
    for (let section = 0; section < sectionJumpTable.length; section++){
      let address: number = sectionJumpTable[section]!;
      inputData.seek(76 + address);
      // console.log("address:",address,"offset:",this.#inputData.byteOffset);
      if (address === maxSectionAddress){
        break;
      }
      if (!sizeOfSubChunks[section]){
        continue;
      }
      const sectionHeader: Uint8Array = inputData.readIntoVector(0x80);
      for (let gx = 0; gx < 4; gx++){
        for (let gz = 0; gz < 4; gz++){
          for (let gy = 0; gy < 4; gy++){
            const gridIndex: number = gx * 16 + gz * 4 + gy;

            const v1: number = sectionHeader[gridIndex * 2]!;
            const v2: number = sectionHeader[gridIndex * 2 + 1]!;
            const t1: number = v1 >> 4;
            const t2: number = 0xf & v1;
            const t3: number = v2 >> 4;
            const t4: number = 0xf & v2;

            const offset: number = (t4 << 8 | t1 << 4 | t2) * 4;
            const format: number = t3;

            const grid = new Uint16Array(128);
            const submergedData = new Uint16Array(128);
            const gridPosition: number = 0xcc + address + offset;//0x4c for start and 0x80 for header
            const offsetInBlockWrite: number = section * 0x20 + gy * 8 + gz * 0x800 + gx * 0x8000;
            if (format === 0){
              this.singleBlock(v1, v2, grid);
            } else if (format === 0xf){//read 128 bytes for normal blocks plus 128 bytes for submerged blocks
              /*if (gridPosition + 128 >= inputData.size_of_data){
                return;
              }
              ParseFormatF(inputData.start_of_data + gridPosition, grid);*/
              if (gridPosition + 256 >= inputData.size_of_data) /*[[unlikely]]*/ {
                return;
              }
              this.maxBlocks(inputData.start_of_data + gridPosition, grid);
              this.maxBlocks(inputData.start_of_data + gridPosition + 128, submergedData);
              this.putBlocks(this.LCE_ChunkData.submerged, submergedData, offsetInBlockWrite);
            } else if (format === 0xe){//read 128 bytes for normal blocks 
              if (gridPosition + 128 >= inputData.size_of_data) /*[[unlikely]]*/ {
                return;
              }
              this.maxBlocks(inputData.start_of_data + gridPosition, grid);
            } else if (format === 0x2){ // 1 bit
              if (gridPosition + 12 >= inputData.size_of_data) /*[[unlikely]]*/ {
                return;
              }
                if (!this.parse(1,inputData.start_of_data + gridPosition, grid)) /*[[unlikely]]*/ {
                  return;
                }
            } else if (format === 0x3){ // 1 bit + submerged
              if (gridPosition + 20 >= inputData.size_of_data) /*[[unlikely]]*/ {
                return;
              }
                if (!this.parseWithLayers(1,inputData.start_of_data + gridPosition, grid, submergedData)) /*[[unlikely]]*/ {
                  return;
                }
              this.putBlocks(this.LCE_ChunkData.submerged, submergedData, offsetInBlockWrite);
            } else if (format === 0x4){ // 2 bit
              if (gridPosition + 24 >= inputData.size_of_data) /*[[unlikely]]*/ {
                return;
              }
                if (!this.parse(2,inputData.start_of_data + gridPosition, grid)) /*[[unlikely]]*/ {
                  return;
                }
            } else if (format === 0x5){ // 2 bit + submerged
              if (gridPosition + 40 >= inputData.size_of_data) /*[[unlikely]]*/ {
                return;
              }
                if (!this.parseWithLayers(2,inputData.start_of_data + gridPosition, grid, submergedData)) /*[[unlikely]]*/ {
                  return;
                }
              this.putBlocks(this.LCE_ChunkData.submerged, submergedData, offsetInBlockWrite);
            } else if (format === 0x6){ // 3 bit
              if (gridPosition + 40 >= inputData.size_of_data) /*[[unlikely]]*/ {
                return;
              }
                if (!this.parse(3,inputData.start_of_data + gridPosition, grid)) /*[[unlikely]]*/ {
                  return;
                }
            } else if (format === 0x7){ // 3 bit + submerged
              if (gridPosition + 64 >= inputData.size_of_data) /*[[unlikely]]*/ {
                return;
              }
                if (!this.parseWithLayers(3,inputData.start_of_data + gridPosition, grid, submergedData)) /*[[unlikely]]*/ {
                  return;
                }
              this.putBlocks(this.LCE_ChunkData.submerged, submergedData, offsetInBlockWrite);
            } else if (format === 0x8){ // 4 bit
              if (gridPosition + 64 >= inputData.size_of_data) /*[[unlikely]]*/ {
                return;
              }
                if (!this.parse(4,inputData.start_of_data + gridPosition, grid)) /*[[unlikely]]*/ {
                  return;
                }
            } else if (format === 0x9){ // 4bit + submerged
              if (gridPosition + 96 >= inputData.size_of_data) /*[[unlikely]]*/ {
                return;
              }
                if (!this.parseWithLayers(4,inputData.start_of_data + gridPosition, grid, submergedData)) /*[[unlikely]]*/ {
                  return;
                }
              this.putBlocks(this.LCE_ChunkData.submerged, submergedData, offsetInBlockWrite);
            } else {
              return;//this should never occur
            }

            this.putBlocks(this.LCE_ChunkData.blocks, grid, offsetInBlockWrite);
          }
        }
      }
    }
  }

  putBlocks(writeVector: Uint16Array, readArray: Uint16Array, writeOffset: number): void {
    let readOffset: number = 0;
    for (let z = 0; z < 4; z++){
      for (let x = 0; x < 4; x++){
        for (let y = 0; y < 4; y++){
          const currentOffset = z * 0x2000 + x * 0x200 + y * 2;
          writeVector[currentOffset + writeOffset] = readArray[readOffset++]!;
          writeVector[currentOffset + writeOffset + 1] = readArray[readOffset++]!;
        }
      }
    }
  }

  singleBlock(v1: number, v2: number, grid: Uint16Array): void {
    for (let i = 0; i < 128; i++){
      if (i & 1){
        grid[i] = v2;
      } else {
        grid[i] = v1;
      }
    }
  }

  maxBlocks(buffer: Uint8Array, grid: Uint16Array): void {
    grid.set(buffer,128);
    // std::copy_n(buffer, 128, grid);
  }

  parse(BitsPerBlock: number, buffer: Uint8Array, grid: Uint16Array): boolean {
    const size: number = (1 << BitsPerBlock) * 2;
    const palette = new Uint16Array(size);
    palette.set(buffer,size);
    // std::copy_n(buffer, size, palette.begin());
    for (let i = 0; i < 8; i++){
      const v = new Uint8Array(BitsPerBlock);
      for (let j = 0; j < BitsPerBlock; j++){
        v[j] = buffer[size + i + j * 8]!;
      }
      for (let j = 0; j < 8; j++){
        const mask: number = 0x80 >> j;
        let idx: number = 0;
        for (let k = 0; k < BitsPerBlock; k++){
          idx |= ((v[k]! & mask) >> (7 - j)) << k;
        }
        if (idx >= size) /*[[unlikely]]*/ {
          return false;
        }
        const gridIndex: number = (i * 8 + j) * 2;
        const paletteIndex: number = idx * 2;
        grid[gridIndex] = palette[paletteIndex]!;
        grid[gridIndex + 1] = palette[paletteIndex + 1]!;
      }
    }
    return true;
  }

  parseWithLayers(BitsPerBlock: number, buffer: Uint8Array, grid: Uint16Array, submergedGrid: Uint16Array): boolean {
    const size: number = (1 << BitsPerBlock) * 2;
    const palette = new Uint16Array(size);
    palette.set(buffer,size);
    // std::copy_n(buffer, size, palette.begin());
    for (let i = 0; i < 8; i++){
      const v = new Uint8Array(BitsPerBlock);
      const vSubmerged = new Uint8Array(BitsPerBlock);
      for (let j = 0; j < BitsPerBlock; j++){
        const offset: number = size + i + j * 8;
        v[j] = buffer[offset]!;
        vSubmerged[j] = buffer[offset + BitsPerBlock * 8]!;
      }
      for (let j = 0; j < 8; j++){
        const mask: number = 0x80 >> j;
        let idx: number = 0;
        let idxSubmerged: number = 0;
        for (let k = 0; k < BitsPerBlock; k++){
          idx |= ((v[k]! & mask) >> (7 - j)) << k;
          idxSubmerged |= ((vSubmerged[k]! & mask) >> (7 - j)) << k;
        }
        if (idx >= size || idxSubmerged >= size) /*[[unlikely]]*/ {
          return false;
        }
        const gridIndex: number = (i * 8 + j) * 2;
        const paletteIndex: number = idx * 2;
        const paletteIndexSubmerged: number = idxSubmerged * 2;
        grid[gridIndex] = palette[paletteIndex]!;
        grid[gridIndex + 1] = palette[paletteIndex + 1]!;
        submergedGrid[gridIndex] = palette[paletteIndexSubmerged]!;
        submergedGrid[gridIndex + 1] = palette[paletteIndexSubmerged + 1]!;
      }
    }
    return true;
  }
}