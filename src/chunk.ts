import { decompress, decodeRLE } from "./compression.js";

export interface CompressionHeader {
  isRLE: boolean;
  compressedLength: number;
  RLECompressedLength: number;
  decompressedLength: number;
}

export interface Header {
  format: number;
  x: number;
  y: number;
  lastUpdate: bigint;
  inhabited: bigint;
}

export class Chunk {
  static async read(data: Uint8Array) {
    data = await this.decompress(data);

    const header = this.readHeader(data);
    const blocks = this.readBlocks(data);

    data = data.subarray(26);

    return { ...header, ...blocks };
  }

  static readCompressionHeader(data: Uint8Array) {
    const view = new DataView(data.buffer,data.byteOffset,data.byteLength);

    const isRLE = Boolean(view.getUint8(0) >> 7);
    const compressedLength = view.getUint32(0) & 0x3FFFFFFF;
    const decompressedLength = view.getUint32(4);
    const RLECompressedLength = view.getUint32(8);

    return { isRLE, compressedLength, RLECompressedLength, decompressedLength } as CompressionHeader;
  }

  static async decompress(data: Uint8Array) {
    const { decompressedLength } = this.readCompressionHeader(data);

    const compressedData = data.subarray(12);
    const RLECompressedData = await decompress(compressedData,"deflate-raw");
    const decompressedData = decodeRLE(RLECompressedData,decompressedLength);

    return decompressedData;
  }

  static readHeader(data: Uint8Array) {
    const view = new DataView(data.buffer,data.byteOffset,data.byteLength);

    const format = view.getUint16(0);
    const x = view.getUint32(2);
    const y = view.getUint32(6);
    const lastUpdate = view.getBigUint64(10);
    const inhabited = view.getBigUint64(18);

    return { format, x, y, lastUpdate, inhabited } as Header;
  }

  static readBlocks(data: Uint8Array) {
    data = data.subarray(26);

    const view = new DataView(data.buffer,data.byteOffset,data.byteLength);
    let byteOffset = 0;

    const maxSectionAddress = view.getUint16((byteOffset += 2) - 2) << 8;
    const sectionJumpTable = new Uint16Array(16);

    for (const i in sectionJumpTable){
      const entry = view.getUint16(Number(i) + (byteOffset += 2) - 2);
      sectionJumpTable[i] = entry;
    }

    const sizeOfSubChunks = data.slice(byteOffset,byteOffset += 16);

    const blocks = new Uint16Array();
    const submerged = new Uint16Array();

    return { maxSectionAddress, sectionJumpTable, sizeOfSubChunks, blocks, submerged };
  }

  constructor(public data: Uint8Array) {}
}