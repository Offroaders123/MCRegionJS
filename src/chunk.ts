import { inflateRaw, rld } from "./compression.js";

export class Chunk {
  static async read(data: Uint8Array) {
    const { rleFlag, sizeOfChunkData, decompressedSize, decSize } = this.readHeader(data);

    const abyte = data.subarray(12);
    const decompressedData = new Uint8Array(decSize);

    decompressedData.set(await inflateRaw(abyte));

    const rle = rld(decompressedData,decompressedSize);

    return Object.assign(new Chunk(),{ rle });
  }

  static readHeader(data: Uint8Array) {
    const view = new DataView(data.buffer,data.byteOffset,data.byteLength);

    const rleFlag = Boolean(view.getUint8(0) >> 7);
    const sizeOfChunkData = view.getUint32(0) & 0x3FFFFFFF;
    const decompressedSize = view.getUint32(4);
    const decSize = view.getUint32(8);

    return { rleFlag, sizeOfChunkData, decompressedSize, decSize };
  }
}