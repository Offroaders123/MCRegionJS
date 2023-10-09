import { read, Int32, NBTData } from "nbtify";
import { decompress, runLengthDecode } from "./compression.js";

import type { IntTag, LongTag, StringTag } from "nbtify";
import type { Region, Entry } from "./region.js";

/* These types should eventually be derived from Region-Types. */

export type Chunk = NBTData<ChunkData>;

export interface ChunkData {
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

const COMPRESSION_HEADER_LENGTH = 12;

export async function readEntry(entry: Entry): Promise<Chunk | null> {
  if (entry === null || entry.byteLength < COMPRESSION_HEADER_LENGTH) return null;

  let view = new DataView(entry.buffer,entry.byteOffset,entry.byteLength);

  const rle = Boolean(view.getUint8(0) >> 7);
  const compressedLength = view.getUint32(0) & 0x3FFFFFFF;
  const decompressedLength = view.getUint32(4);
  const rleCompressedLength = view.getUint32(8);

  const compressedEntry = entry.subarray(COMPRESSION_HEADER_LENGTH);
  const rleCompressedEntry = await decompress(compressedEntry,"deflate-raw");
  const decompressedEntry = runLengthDecode(rleCompressedEntry,decompressedLength);

  view = new DataView(decompressedEntry.buffer,decompressedEntry.byteOffset,decompressedEntry.byteLength);

  const Format = new Int32(view.getUint16(0));
  const X = new Int32(view.getUint32(2));
  const Y = new Int32(view.getUint32(6));
  const LastUpdate = view.getBigUint64(10);
  const Inhabited = view.getBigUint64(18);

  view = new DataView(view.buffer,view.byteOffset + 26,view.byteLength - 26);
  console.log(Buffer.from(view.buffer).subarray(view.byteOffset,view.byteOffset + 34));

  const Blocks = new Uint16Array(0x20000);
  const Submerged = new Uint16Array(0x20000);

  const maxSectionAddress = view.getUint16(0) << 8;
  console.log(maxSectionAddress);

  const sectionJumpTable = new Uint16Array(16);//read 16 shorts so 32 bytes
  for (let i = 0; i < sectionJumpTable.length; i++){
    const address = view.getUint16(i + 2);
    sectionJumpTable[i] = address;
  }
  console.log(sectionJumpTable);

  const sizeOfSubChunks = new Uint8Array(view.buffer,view.byteOffset + 34,16);
  console.log(sizeOfSubChunks);

  view = new DataView(view.buffer,view.byteOffset + 50,view.byteLength - 50);

  if (maxSectionAddress !== 0){
    parseBlocks: for (let section = 0; section < sectionJumpTable.length; section++){
      const address = sectionJumpTable[section]!;
      view = new DataView(view.buffer,view.byteOffset + 76 + address,view.byteLength - 76 - address);
      if (address === maxSectionAddress){
        break;
      }
      if (!sizeOfSubChunks[section]){
        continue;
      }
      const sectionHeader = new Uint8Array(view.buffer,view.byteOffset + 0x80,0x80);
      view = new DataView(view.buffer,view.byteOffset + 0x80,view.byteLength - 0x80);
      for (let gx = 0; gx < 4; gx++){
        for (let gz = 0; gz < 4; gz++){
          for (let gy = 0; gy < 4; gy++){
            const gridIndex = gx * 16 + gz * 4 + gy;

            const v1 = sectionHeader[gridIndex * 2]!;
            const v2 = sectionHeader[gridIndex * 2 + 1]!;
            const t1 = v1 >> 4;
            const t2 = 0xf & v1;
            const t3 = v2 >> 4;
            const t4 = 0xf & v2;

            const offset = (t4 << 8 | t1 << 4 | t2) * 4;
            const format = t3;

            const grid = new Uint16Array(128);
            const submergedData = new Uint16Array(128);
            const gridPosition = 0xcc + address + offset;//0x4c for start and 0x80 for header
            const offsetInBlockWrite = section * 0x20 + gy * 8 + gz * 0x800 + gx * 0x8000;
            if (format === 0){
              singleBlock(v1, v2, grid);
            } else if (format === 0xf){//read 128 bytes for normal blocks plus 128 bytes for submerged blocks
              /*if (gridPosition + 128 >= view.byteLength){
                break parseBlocks;
              }
              ParseFormatF(view.byteOffset + gridPosition, grid);*/
              if (gridPosition + 256 >= view.byteLength) /*[[unlikely]]*/ {
                break parseBlocks;
              }
              maxBlocks(view.byteOffset + gridPosition, grid);
              maxBlocks(view.byteOffset + gridPosition + 128, submergedData);
              putBlocks(Submerged, submergedData, offsetInBlockWrite);
            } else if (format === 0xe){//read 128 bytes for normal blocks 
              if (gridPosition + 128 >= view.byteLength) /*[[unlikely]]*/ {
                break parseBlocks;
              }
              maxBlocks(view.byteOffset + gridPosition, grid);
            } else if (format === 0x2){ // 1 bit
              if (gridPosition + 12 >= view.byteLength) /*[[unlikely]]*/ {
                break parseBlocks;
              }
                if (!parse(1,view.byteOffset + gridPosition, grid)) /*[[unlikely]]*/ {
                  break parseBlocks;
                }
            } else if (format === 0x3){ // 1 bit + submerged
              if (gridPosition + 20 >= view.byteLength) /*[[unlikely]]*/ {
                break parseBlocks;
              }
                if (!parseWithLayers(1,view.byteOffset + gridPosition, grid, submergedData)) /*[[unlikely]]*/ {
                  break parseBlocks;
                }
              putBlocks(Submerged, submergedData, offsetInBlockWrite);
            } else if (format === 0x4){ // 2 bit
              if (gridPosition + 24 >= view.byteLength) /*[[unlikely]]*/ {
                break parseBlocks;
              }
                if (!parse(2,view.byteOffset + gridPosition, grid)) /*[[unlikely]]*/ {
                  break parseBlocks;
                }
            } else if (format === 0x5){ // 2 bit + submerged
              if (gridPosition + 40 >= view.byteLength) /*[[unlikely]]*/ {
                break parseBlocks;
              }
                if (!parseWithLayers(2,view.byteOffset + gridPosition, grid, submergedData)) /*[[unlikely]]*/ {
                  break parseBlocks;
                }
              putBlocks(Submerged, submergedData, offsetInBlockWrite);
            } else if (format === 0x6){ // 3 bit
              if (gridPosition + 40 >= view.byteLength) /*[[unlikely]]*/ {
                break parseBlocks;
              }
                if (!parse(3,view.byteOffset + gridPosition, grid)) /*[[unlikely]]*/ {
                  break parseBlocks;
                }
            } else if (format === 0x7){ // 3 bit + submerged
              if (gridPosition + 64 >= view.byteLength) /*[[unlikely]]*/ {
                break parseBlocks;
              }
                if (!parseWithLayers(3,view.byteOffset + gridPosition, grid, submergedData)) /*[[unlikely]]*/ {
                  break parseBlocks;
                }
              putBlocks(Submerged, submergedData, offsetInBlockWrite);
            } else if (format === 0x8){ // 4 bit
              if (gridPosition + 64 >= view.byteLength) /*[[unlikely]]*/ {
                break parseBlocks;
              }
                if (!parse(4,view.byteOffset + gridPosition, grid)) /*[[unlikely]]*/ {
                  break parseBlocks;
                }
            } else if (format === 0x9){ // 4bit + submerged
              if (gridPosition + 96 >= view.byteLength) /*[[unlikely]]*/ {
                break parseBlocks;
              }
                if (!parseWithLayers(4,view.byteOffset + gridPosition, grid, submergedData)) /*[[unlikely]]*/ {
                  break parseBlocks;
                }
              putBlocks(Submerged, submergedData, offsetInBlockWrite);
            } else {
              break parseBlocks;//this should never occur
            }

            putBlocks(Blocks, grid, offsetInBlockWrite);
          }
        }
      }
    }
  }

  const dataArray = Array(4) as [Uint8Array,Uint8Array,Uint8Array,Uint8Array];
  for (let i = 0; i < dataArray.length; i++){
    const item = new Uint8Array();
    // const item = this->readx128(inputData);
    dataArray[i] = item;
  }

  const DataGroupCount = dataArray[0].length + dataArray[1].length + dataArray[2].length + dataArray[3].length;

  const segments = [ 0, 0, 1, 1 ] as const;
  const offsets = [ 0, 0x4000, 0, 0x4000 ] as const;
  const lightsData = [
    new Uint8Array(0x8000),
    new Uint8Array(0x8000)
  ] as const;

  for (let j = 0; j < 4; j++){
    let startingIndex = offsets[j]!;
    let currentLightSegment = segments[j]!;
    const data = dataArray[j]!;

    for (let k = 0; k < 0x80; k++){
      const headerValue = data[k]!;
      if (headerValue === 0x80 || headerValue === 0x81){
        copyByte128(lightsData[currentLightSegment], k * 0x80 + startingIndex, (headerValue === 0x80) ? 0 : 255);
      } else {
        copyArray128(data, ((headerValue + 1) * 0x80), lightsData[currentLightSegment], k * 0x80 + startingIndex);
      }
    }
  }

  const SkyLight = lightsData[0]; //java stores skylight (and blocklight?) the same way LCE does, it does not need to be converted
  const BlockLight = lightsData[1];

  return new NBTData<ChunkData>({ Format, X, Y, LastUpdate, Inhabited, Blocks, Submerged, DataGroupCount, SkyLight, BlockLight });
}
function parse(BitsPerBlock: number, buffer: Uint8Array, grid: Uint16Array): boolean {
  const size = (1 << BitsPerBlock) * 2;
  const palette = new Uint16Array(size);
  // std::copy_n(buffer, size, palette.begin());
  for (let i = 0; i < 8; i++){
    const v = new Uint8Array(BitsPerBlock);
    for (let j = 0; j < BitsPerBlock; j++){
      v[j] = buffer[size + i + j * 8]!;
    }
    for (let j = 0; j < 8; j++){
      const mask = 0x80 >> j;
      let idx = 0;
      for (let k = 0; k < BitsPerBlock; k++){
        idx |= ((v[k]! & mask) >> (7 - j)) << k;
      }
      if (idx >= size) /*[[unlikely]]*/ {
        return false;
      }
      const gridIndex = (i * 8 + j) * 2;
      const paletteIndex = idx * 2;
      grid[gridIndex] = palette[paletteIndex]!;
      grid[gridIndex + 1] = palette[paletteIndex + 1]!;
    }
  }
  return true;
}

function parseWithLayers(BitsPerBlock: number, buffer: Uint8Array, grid: Uint16Array, submergedGrid: Uint16Array): boolean {
  const size = (1 << BitsPerBlock) * 2;
  const palette = new Uint16Array(size);
  // std::copy_n(buffer, size, palette.begin());
  palette.set(buffer,size);
  for (let i = 0; i < 8; i++){
    const v = new Uint8Array(BitsPerBlock);
    const vSubmerged = new Uint8Array(BitsPerBlock);
    for (let j = 0; j < BitsPerBlock; j++){
      const offset = size + i + j * 8;
      v[j] = buffer[offset]!;
      vSubmerged[j] = buffer[offset + BitsPerBlock * 8]!;
    }
    for (let j = 0; j < 8; j++){
      const mask = 0x80 >> j;
      let idx = 0;
      let idxSubmerged = 0;
      for (let k = 0; k < BitsPerBlock; k++){
        idx |= ((v[k]! & mask) >> (7 - j)) << k;
        idxSubmerged |= ((vSubmerged[k]! & mask) >> (7 - j)) << k;
      }
      if (idx >= size || idxSubmerged >= size) /*[[unlikely]]*/ {
        return false;
      }
      const gridIndex = (i * 8 + j) * 2;
      const paletteIndex = idx * 2;
      const paletteIndexSubmerged = idxSubmerged * 2;
      grid[gridIndex] = palette[paletteIndex]!;
      grid[gridIndex + 1] = palette[paletteIndex + 1]!;
      submergedGrid[gridIndex] = palette[paletteIndexSubmerged]!;
      submergedGrid[gridIndex + 1] = palette[paletteIndexSubmerged + 1]!;
    }
  }
  return true;
}

function singleBlock(v1: number, v2: number, grid: Uint16Array): void {
  for (let i = 0; i < 128; i++){
    if (i & 1){
      grid[i] = v2;
    } else {
      grid[i] = v1;
    }
  }
}

function putBlocks(writeVector: Uint16Array, readArray: Uint16Array, writeOffset: number): void {
  let readOffset = 0;
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

function maxBlocks(buffer: Uint8Array, grid: Uint16Array): void {
  // std::copy_n(buffer, 128, grid);
  grid.set(buffer,128);
}

function copyByte128(writeVector: Uint8Array, writeOffset: number, value: number): void {
  for (let i = 0; i < 0x80; i++){
    writeVector[writeOffset + i] = value;
  }
}

function copyArray128(readVector: Uint8Array, readOffset: number, writeVector: Uint8Array, writeOffset: number): void {
  for (let i = 0; i < 0x80; i++){
    writeVector[writeOffset + i] = readVector[readOffset + i]!;
  }
}