import { read, Int32, NBTData } from "nbtify";
import { decompress, runLengthDecode } from "./compression.js";

import type { IntTag, ShortTag, LongTag, StringTag } from "nbtify";
import type { Region, Entry } from "./region.js";

/* These types should eventually be derived from Region-Types. */

export type Chunk = NBTData<ChunkData>;

export interface ChunkData {
  Format: IntTag;
  X: IntTag;
  Y: IntTag;
  LastUpdate: LongTag;
  Inhabited: LongTag;
  Blocks: ShortTag[];
  Submerged: ShortTag[];
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

  view = new DataView(decompressedEntry.buffer,view.byteOffset + 26,view.byteLength - 26);
  console.log(Buffer.from(view.buffer).subarray(view.byteOffset,view.byteOffset + 34));

  const Blocks: ShortTag[] = Array(0x20000);
  const Submerged: ShortTag[] = Array(0x20000);
  const maxSectionAddress = view.getUint16(0) << 8;
  console.log(maxSectionAddress);

  const sectionJumpTable = new Uint16Array(16);

  for (let i = 0; i < sectionJumpTable.length; i++){
    const address = view.getUint16(i + 2);
    sectionJumpTable[i] = address;
  }
  console.log(sectionJumpTable);

  view = new DataView(decompressedEntry.buffer,view.byteOffset + 34,view.byteLength - 34);

  const sizeOfSubChunks = new Uint8Array(view.buffer,view.byteOffset,16);
  console.log(sizeOfSubChunks);

  return new NBTData<ChunkData>({ Format, X, Y, LastUpdate, Inhabited, Blocks, Submerged });
}