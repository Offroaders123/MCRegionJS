import { read } from "nbtify";
import { decompress, runLengthDecode } from "./compression.js";

import type { Region, Entry } from "./region.js";

export interface Chunk {}

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

  const Format = view.getUint16(0);
  const X = view.getUint32(2);
  const Y = view.getUint32(6);
  const LastUpdate = view.getBigUint64(10);
  const Inhabited = view.getBigUint64(18);

  console.log({ Format, X, Y, LastUpdate, Inhabited });

  for (let i = decompressedEntry.byteLength; i > 0; i--){
    try {
      const nbt = await read<Chunk>(decompressedEntry.subarray(i),{ name: "", endian: "big", compression: null, bedrockLevel: null });
      // console.log(nbt.data,"\n");
      return nbt;
    } catch (error){
      continue;
    }
  }

  return null;
}