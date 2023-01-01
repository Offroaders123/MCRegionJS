import { inflateRaw, rld } from "./compression.js";

export interface Header {
  isRLE: boolean;
  compressedLength: number;
  decompressedLength: number;
  RLECompressedLength: number;
}

export class Chunk {
  static async read(data: Uint8Array) {
    const { isRLE, compressedLength, decompressedLength, RLECompressedLength } = this.readHeader(data);

    const compressedData = data.subarray(12);
    const RLECompressedData = new Uint8Array(RLECompressedLength);

    RLECompressedData.set(await inflateRaw(compressedData));

    const decompressedData = rld(RLECompressedData,decompressedLength);

    return Object.assign(new Chunk(),{ decompressedData });
  }

  static readHeader(data: Uint8Array) {
    const view = new DataView(data.buffer,data.byteOffset,data.byteLength);

    const isRLE = Boolean(view.getUint8(0) >> 7);
    const compressedLength = view.getUint32(0) & 0x3FFFFFFF;
    const decompressedLength = view.getUint32(4);
    const RLECompressedLength = view.getUint32(8);

    return { isRLE, compressedLength, decompressedLength, RLECompressedLength } as Header;
  }
}