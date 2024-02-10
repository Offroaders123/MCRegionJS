import { read, Int16, Int32, NBTData } from "nbtify";
import { decompress, runLengthDecode } from "./compression.js";

import type { ShortTag, IntTag, LongTag } from "nbtify";
import type { BlockEntity, TileTick } from "../Region-Types/src/legacy-console/index.js";
import type { Region, Entry } from "./region.js";

/* These types should eventually be derived from Region-Types. */

export type Chunk = ChunkData;

export interface ChunkData {
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
  TileEntities: BlockEntity[];
  TileTicks: TileTick[];
}

export async function readChunks(region: Region): Promise<(Chunk | null)[]> {
  return Promise.all(region.map(readEntry));
}

export async function readEntry(entry: Entry | null): Promise<Chunk | null> {
  if (entry === null) return null;
  let { data } = entry;
  const { rle, decompressedLength } = entry;

  data = await decompress(data,"deflate-raw");
  if (rle) data = runLengthDecode(data,decompressedLength);

  const view = new DataView(data.buffer,data.byteOffset,data.byteLength);
  let pointer: number = 0;

  // parseChunk
  const version: ShortTag = new Int16(view.getUint16(pointer + 0));
  const chunkX: IntTag = new Int32(view.getUint32(pointer + 2));
  const chunkZ: IntTag = new Int32(view.getUint32(pointer + 6));
  const lastUpdate: LongTag = view.getBigUint64(pointer + 10);
  const inhabitedTime: LongTag = view.getBigUint64(pointer + 18);
  pointer += 26;

  // parseBlocks
  const blocks = new Uint16Array(0x20000);
  const submerged = new Uint16Array(0x20000);

  const maxSectionAddress: number = view.getUint16(pointer + 0) << 8; // console.log(maxSectionAddress);
  pointer += 2;

  const sectionJumpTable = new Uint16Array(16);
  for (let i = 0; i < sectionJumpTable.length; i++){
    const address: number = view.getUint16(pointer + i * 2);
    sectionJumpTable[i] = address;
  }
  pointer += sectionJumpTable.length; // console.log(sectionJumpTable); console.log(pointer);

  const sizeOfSubChunks: Uint8Array = readIntoVector(16); // console.log(sizeOfSubChunks);
  if (maxSectionAddress !== 0){
    for (let section = 0; section < sectionJumpTable.length; section++){
      let address: number = sectionJumpTable[section]!; // console.log(address);
      pointer = 76 + address; // note the lack of `+=`

      if (address === maxSectionAddress) break;
      if (!sizeOfSubChunks[section]) continue;

      const sectionHeader: Uint8Array = readIntoVector(0x80); console.log(sectionHeader);
    }
  }

  return { version, chunkX, chunkZ, lastUpdate, inhabitedTime, blocks, submerged };

  function readIntoVector(byteLength: number): Uint8Array {
    const returnVector = new Uint8Array(byteLength);
    for (let i = 0; i < returnVector.length; i++){
      returnVector[i] = view.getUint8(pointer + i);
    }
    pointer += returnVector.byteLength;
    return returnVector;
  }
}