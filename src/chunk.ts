import { read } from "nbtify";
import { decompress, runLengthDecode } from "./compression.js";

import type { Region, Entry } from "./region.js";

export interface Chunk {}

export async function readChunks(region: Region): Promise<(Chunk | null)[]> {
  return Promise.all(region.map(async entry => {
    entry = await decompressChunk(entry);
    if (entry === null) return null;
    const header = readHeader(entry);
    // if (header.Format !== 12) return null;
    console.log(header);

    for (let i = entry.byteLength; i > 0; i--){
      try {
        const nbt = await read(entry.subarray(i),{ name: "", endian: "big", compression: null, bedrockLevel: null });
        // console.log(nbt.data,"\n");
        return nbt;
      } catch (error){
        continue;
      }
    }

    return null;
  }));
}

const COMPRESSION_HEADER_LENGTH = 12;

interface CompressionHeader {
  rle: boolean;
  compressedLength: number;
  rleCompressedLength: number;
  decompressedLength: number;
}

function readCompressionHeader(entry: Uint8Array): CompressionHeader {
  const view = new DataView(entry.buffer,entry.byteOffset,entry.byteLength);

  const rle = Boolean(view.getUint8(0) >> 7);
  const compressedLength = view.getUint32(0) & 0x3FFFFFFF;
  const decompressedLength = view.getUint32(4);
  const rleCompressedLength = view.getUint32(8);

  return { rle, compressedLength, rleCompressedLength, decompressedLength };
}

async function decompressChunk(entry: Entry): Promise<Entry> {
  if (entry === null || entry.byteLength < COMPRESSION_HEADER_LENGTH) return null;

  const { decompressedLength } = readCompressionHeader(entry);

  const compressedEntry = entry.subarray(COMPRESSION_HEADER_LENGTH);
  const rleCompressedEntry = await decompress(compressedEntry,"deflate-raw");
  const decompressedEntry = runLengthDecode(rleCompressedEntry,decompressedLength);

  return decompressedEntry;
}

interface Header {
  Format: number;
  X: number;
  Y: number;
  LastUpdate: bigint;
  Inhabited: bigint;
}

function readHeader(data: Uint8Array): Header {
  const view = new DataView(data.buffer,data.byteOffset,data.byteLength);

  const Format = view.getUint16(0);
  const X = view.getUint32(2);
  const Y = view.getUint32(6);
  const LastUpdate = view.getBigUint64(10);
  const Inhabited = view.getBigUint64(18);

  return { Format, X, Y, LastUpdate, Inhabited };
}