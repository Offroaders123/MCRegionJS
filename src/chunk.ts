import { inflateRaw, rleDecode } from "./compression.js";

export interface CompressionHeader {
  isRLE: boolean;
  compressedLength: number;
  RLECompressedLength: number;
  decompressedLength: number;
}

export class Chunk {
  static async read(data: Uint8Array) {
    const { decompressedLength } = this.readCompressionHeader(data);

    const compressedData = data.subarray(12);
    const RLECompressedData = await inflateRaw(compressedData);
    const decompressedData = rleDecode(RLECompressedData,decompressedLength);

    return { data: decompressedData };
  }

  static readCompressionHeader(data: Uint8Array) {
    const view = new DataView(data.buffer,data.byteOffset,data.byteLength);

    const isRLE = Boolean(view.getUint8(0) >> 7);
    const compressedLength = view.getUint32(0) & 0x3FFFFFFF;
    const decompressedLength = view.getUint32(4);
    const RLECompressedLength = view.getUint32(8);

    return { isRLE, compressedLength, RLECompressedLength, decompressedLength } as CompressionHeader;
  }

  constructor(public data: Uint8Array) {}
}