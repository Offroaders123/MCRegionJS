import { inflateRaw, rleDecode } from "./compression.js";

export interface Header {
  isRLE: boolean;
  compressedLength: number;
  RLECompressedLength: number;
  decompressedLength: number;
}

export class Chunk {
  static async read(data: Uint8Array) {
    const { isRLE, compressedLength, RLECompressedLength, decompressedLength } = this.readHeader(data);

    const compressedData = data.subarray(12,12 + compressedLength);
    const RLECompressedData = new Uint8Array(RLECompressedLength);
    RLECompressedData.set(await inflateRaw(compressedData),0);
    const decompressedData = rleDecode(RLECompressedData,decompressedLength);

    return Object.assign(new Chunk(),{ decompressedData });
  }

  static readHeader(data: Uint8Array) {
    const view = new DataView(data.buffer,data.byteOffset,data.byteLength);

    const isRLE = Boolean(view.getUint8(0) >> 7);
    const compressedLength = view.getUint32(0) & 0x3FFFFFFF;
    const decompressedLength = view.getUint32(4);
    const RLECompressedLength = view.getUint32(8);

    return { isRLE, compressedLength, RLECompressedLength, decompressedLength } as Header;
  }
}