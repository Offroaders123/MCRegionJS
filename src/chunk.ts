import { decompress, runLengthDecode } from "./compression.js";
import { readLocations } from "./location.js";

export interface Chunk {}

export async function* readChunks(data: Uint8Array): AsyncGenerator<Chunk,void,void> {
  for await (const chunk of getChunk(data)){
    if (chunk === null) continue;
    const header = readHeader(chunk);
    console.log(header);
  }
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

async function* getChunk(data: Uint8Array): AsyncGenerator<Uint8Array | null,void,void> {
  for (const { byteOffset, byteLength } of readLocations(data)){
    if (byteLength === 0) yield null;
    yield decompressChunk(data.subarray(byteOffset,byteOffset + byteLength));
  }
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

async function decompressChunk(data: Uint8Array): Promise<Uint8Array | null> {
  if (data.byteLength < COMPRESSION_HEADER_LENGTH) return null;

  const { decompressedLength } = readCompressionHeader(data);

  const compressedData = data.subarray(COMPRESSION_HEADER_LENGTH);
  const RLECompressedData = await decompress(compressedData,"deflate-raw");
  const decompressedData = runLengthDecode(RLECompressedData,decompressedLength);

  return decompressedData;
}