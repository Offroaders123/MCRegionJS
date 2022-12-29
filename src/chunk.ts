import { inflateRaw } from "./compression.js";

export class Chunk {
  static async read(data: Uint8Array) {
    // console.log(...data.slice(0,12));
    const view = new DataView(data.buffer,data.byteOffset,data.byteLength);
    const rle = Boolean(view.getUint8(0) >> 7);
    // const unknown = view.getUint8(0);
    const compressedLength = view.getUint32(0) << 2;
    const rleUncompressed = view.getUint32(4);
    const uncompressed = view.getUint32(8);

    return Object.assign(new Chunk(),{ rle, compressedLength, rleUncompressed, uncompressed });
  }
}