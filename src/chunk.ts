import { read } from "nbtify";
import { decompress, runLengthDecode } from "./compression.js";

import type { Region, Entry } from "./region.js";

export interface Chunk {}

export async function readChunks(data: Region): Promise<(Chunk | null)[]> {
  return Promise.all(data.map(async chunk => {
    chunk = await decompressChunk(chunk);
    if (chunk === null) return null;
    const header = readHeader(chunk);
    // if (header.Format !== 12) return null;
    console.log(header);

    for (let i = chunk.byteLength; i > 0; i--){
      try {
        const nbt = await read(chunk.subarray(i),{ name: "", endian: "big", compression: null, bedrockLevel: null });
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
  isRLE: boolean;
  compressedLength: number;
  RLECompressedLength: number;
  decompressedLength: number;
}

function readCompressionHeader(data: Uint8Array): CompressionHeader {
  const view = new DataView(data.buffer,data.byteOffset,data.byteLength);

  const isRLE = Boolean(view.getUint8(0) >> 7);
  const compressedLength = view.getUint32(0) & 0x3FFFFFFF;
  const decompressedLength = view.getUint32(4);
  const RLECompressedLength = view.getUint32(8);

  return { isRLE, compressedLength, RLECompressedLength, decompressedLength };
}

async function decompressChunk(data: Entry): Promise<Entry> {
  if (data === null || data.byteLength < COMPRESSION_HEADER_LENGTH) return null;

  const { decompressedLength } = readCompressionHeader(data);

  const compressedData = data.subarray(COMPRESSION_HEADER_LENGTH);
  const RLECompressedData = await decompress(compressedData,"deflate-raw");
  const decompressedData = runLengthDecode(RLECompressedData,decompressedLength);

  return decompressedData;
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