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

export async function readEntry(entry: Entry | null): Promise<Uint8Array> {
  if (entry === null) return null;
  const { data, decompressedLength } = entry;

  const rleCompressedEntry = await decompress(data,"deflate-raw");
  const decompressedEntry = runLengthDecode(rleCompressedEntry,decompressedLength);

  return decompressedEntry;

  const parser = new AquaticParser();
  return parser.ParseChunk(decompressedEntry);
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
  #inputData!: DataView;
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

  async ParseChunk(entry: Uint8Array, _dimension?: number, _fixes?: LCEFixes): Promise<UniversalChunkFormat> {
    this.#inputData = new DataView(entry.buffer,entry.byteOffset,entry.byteLength);
    this.LCE_ChunkData.version = new Int16(this.#inputData.getUint16(0));
    this.LCE_ChunkData.chunkX = new Int32(this.#inputData.getUint32(2));
    this.LCE_ChunkData.chunkZ = new Int32(this.#inputData.getUint32(6));
    this.LCE_ChunkData.lastUpdate = this.#inputData.getBigUint64(10);
    this.LCE_ChunkData.inhabitedTime = this.#inputData.getBigUint64(18);
    this.seek(26);
    this.parseBlocks();
    return this.LCE_ChunkData;
    this.readLights();
    this.LCE_ChunkData.heightMap = this.read256();
    this.LCE_ChunkData.terrainPopulated = new Int16(this.#inputData.getUint16(0));
    this.seek(2);
    this.LCE_ChunkData.biomes = this.read256();
    await this.readNBTData();
    return this.LCE_ChunkData;
    // return LCE_universal.convertLCE1_13RegionToUniveral(this.LCE_ChunkData, dimension, fixes);
  }

  ParseChunkForAccess(entry: Uint8Array, _dimension?: number, _fixes?: LCEFixes): UniversalChunkFormat {
    this.#inputData = new DataView(entry.buffer,entry.byteOffset,entry.byteLength);
    this.seek(26);
    this.parseBlocks();
    return this.LCE_ChunkData;
    // return LCE_universal.convertLCE1_13RegionToUniveralForAccess(this.LCE_ChunkData, dimension, fixes);
  }

  async readNBTData(): Promise<void> {
    if (this.#inputData.getUint8(0) === 0xA){
      const array1 = new Uint8Array(this.#inputData.buffer,this.#inputData.byteOffset,this.#inputData.byteLength);
      this.LCE_ChunkData.NBTData = await read(array1);
    }
  }

  seek(byteLength: number): void {
    this.#inputData = new DataView(this.#inputData.buffer,this.#inputData.byteOffset + byteLength,this.#inputData.byteLength - byteLength);
  }

  rewind(): void {
    this.#inputData = new DataView(this.#inputData.buffer);
  }

  read256(): Uint8Array {
    const array1: Uint8Array = this.readIntoVector(256);
    return array1;
  }

  readx128(): Uint8Array {
    console.log(Buffer.from(this.#inputData.buffer,this.#inputData.byteOffset,this.#inputData.byteLength));
    const num: number = this.#inputData.getUint32(0/*,true*/);
    console.log(num);
    this.seek(4);
    const array1: Uint8Array = this.readIntoVector((num + 1) * 0x80);
    return array1;
  }

  readLights(): void {
    const dataArray = new Array(4) as [Uint8Array,Uint8Array,Uint8Array,Uint8Array];
    for (let i = 0; i < dataArray.length; i++){
      const item: Uint8Array = this.readx128();
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

	readIntoVector(amount: number): Uint8Array {
		const returnVector = new Uint8Array(amount);
		for (let i = 0; i < returnVector.byteLength; i++){
      returnVector[i] = this.#inputData.getUint8(i);
		}
    this.seek(returnVector.byteLength);
		return returnVector;
	}

  parseBlocks(): void {
    this.LCE_ChunkData.blocks = new Uint16Array(0x20000);
    this.LCE_ChunkData.submerged = new Uint16Array(0x20000);
    const maxSectionAddress: number = this.#inputData.getUint16(0) << 8;
    console.log(maxSectionAddress);
    this.seek(2);
    const sectionJumpTable = new Uint16Array(16);//read 16 shorts so 32 bytes
    for (let i = 0; i < sectionJumpTable.length; i++){
      const address: number = this.#inputData.getUint16(i * 2);
      sectionJumpTable[i] = address;
    }
    console.log(sectionJumpTable);
    this.seek(sectionJumpTable.byteLength);
    const sizeOfSubChunks: Uint8Array = this.readIntoVector(16);
    if (maxSectionAddress === 0){
      return;
    }
    // console.log("sectionJumpTable - length:",sectionJumpTable.length);
    for (let section = 0; section < sectionJumpTable.length; section++){
      let address: number = sectionJumpTable[section]!;
      this.rewind();
      this.seek(76 + address);
      // console.log("address:",address,"offset:",this.#inputData.byteOffset);
      if (address === maxSectionAddress){
        break;
      }
      if (!sizeOfSubChunks[section]){
        continue;
      }
      const sectionHeader: Uint8Array = this.readIntoVector(0x80);
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
              /*if (gridPosition + 128 >= this.#inputData.byteLength){
                return;
              }
              ParseFormatF(this.#inputData.byteOffset + gridPosition, grid);*/
              if (gridPosition + 256 >= this.#inputData.byteLength) /*[[unlikely]]*/ {
                return;
              }
              this.maxBlocks(this.#inputData.byteOffset + gridPosition, grid);
              this.maxBlocks(this.#inputData.byteOffset + gridPosition + 128, submergedData);
              this.putBlocks(this.LCE_ChunkData.submerged, submergedData, offsetInBlockWrite);
            } else if (format === 0xe){//read 128 bytes for normal blocks 
              if (gridPosition + 128 >= this.#inputData.byteLength) /*[[unlikely]]*/ {
                return;
              }
              this.maxBlocks(this.#inputData.byteOffset + gridPosition, grid);
            } else if (format === 0x2){ // 1 bit
              if (gridPosition + 12 >= this.#inputData.byteLength) /*[[unlikely]]*/ {
                return;
              }
                if (!this.parse(1,this.#inputData.byteOffset + gridPosition, grid)) /*[[unlikely]]*/ {
                  return;
                }
            } else if (format === 0x3){ // 1 bit + submerged
              if (gridPosition + 20 >= this.#inputData.byteLength) /*[[unlikely]]*/ {
                return;
              }
                if (!this.parseWithLayers(1,this.#inputData.byteOffset + gridPosition, grid, submergedData)) /*[[unlikely]]*/ {
                  return;
                }
              this.putBlocks(this.LCE_ChunkData.submerged, submergedData, offsetInBlockWrite);
            } else if (format === 0x4){ // 2 bit
              if (gridPosition + 24 >= this.#inputData.byteLength) /*[[unlikely]]*/ {
                return;
              }
                if (!this.parse(2,this.#inputData.byteOffset + gridPosition, grid)) /*[[unlikely]]*/ {
                  return;
                }
            } else if (format === 0x5){ // 2 bit + submerged
              if (gridPosition + 40 >= this.#inputData.byteLength) /*[[unlikely]]*/ {
                return;
              }
                if (!this.parseWithLayers(2,this.#inputData.byteOffset + gridPosition, grid, submergedData)) /*[[unlikely]]*/ {
                  return;
                }
              this.putBlocks(this.LCE_ChunkData.submerged, submergedData, offsetInBlockWrite);
            } else if (format === 0x6){ // 3 bit
              if (gridPosition + 40 >= this.#inputData.byteLength) /*[[unlikely]]*/ {
                return;
              }
                if (!this.parse(3,this.#inputData.byteOffset + gridPosition, grid)) /*[[unlikely]]*/ {
                  return;
                }
            } else if (format === 0x7){ // 3 bit + submerged
              if (gridPosition + 64 >= this.#inputData.byteLength) /*[[unlikely]]*/ {
                return;
              }
                if (!this.parseWithLayers(3,this.#inputData.byteOffset + gridPosition, grid, submergedData)) /*[[unlikely]]*/ {
                  return;
                }
              this.putBlocks(this.LCE_ChunkData.submerged, submergedData, offsetInBlockWrite);
            } else if (format === 0x8){ // 4 bit
              if (gridPosition + 64 >= this.#inputData.byteLength) /*[[unlikely]]*/ {
                return;
              }
                if (!this.parse(4,this.#inputData.byteOffset + gridPosition, grid)) /*[[unlikely]]*/ {
                  return;
                }
            } else if (format === 0x9){ // 4bit + submerged
              if (gridPosition + 96 >= this.#inputData.byteLength) /*[[unlikely]]*/ {
                return;
              }
                if (!this.parseWithLayers(4,this.#inputData.byteOffset + gridPosition, grid, submergedData)) /*[[unlikely]]*/ {
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