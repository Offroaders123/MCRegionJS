import { read, Int16, Int32, NBTData } from "nbtify";
import { decompress, runLengthDecode } from "./compression.js";

import type { ShortTag, IntTag, LongTag, StringTag } from "nbtify";
import type { Region, Entry } from "./region.js";

/* These types should eventually be derived from Region-Types. */

export type Chunk = NBTData<ChunkData>;

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
  TileEntities: Entity[];
  TileTicks: TileTick[];
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
}