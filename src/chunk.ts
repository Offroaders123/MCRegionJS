import { inflateRaw, rld } from "./compression.js";

export class Chunk {
  static async read(data: Uint8Array) {
    const view = new DataView(data.buffer,data.byteOffset,data.byteLength);

    const rleFlag = Boolean(view.getUint8(0) >> 7);
    const sizeOfChunkData = view.getUint32(0) & 0x3FFFFFFF;
    const decompressedSize = view.getUint32(4);
    const decSize = view.getUint32(8);

    const abyte = data.subarray(12);
    const decompressedData = new Uint8Array(decSize);
    
    decompressedData.set(await inflateRaw(abyte));

    const rle = rld(decompressedData,decompressedSize);

    return Object.assign(new Chunk(),{
      // These arbitrary values are the results provided by UtterEvergreen,
      // which are the results he got for parsing the first chunk in the test
      // region. I used them to debug my code to make sure that I was getting
      // the same results he was for the test chunk, the first one inside of
      // the region file.

      // I think most of my parsing issues were from using incorrect/buggy
      // bitwise operators on the data that I was reading from the DataView,
      // and it would then use that malformed data to try and work with the
      // buffer, causing all kinds of wrong results. Messy! So glad we are
      // working to document all of this for other Crafters' projects too :)
      rleFlag: [rleFlag,true],
      sizeOfChunkData: [sizeOfChunkData,5376],
      decompressedSize: [decompressedSize,21693],
      decSize: [decSize,11751],
      rle
    });

    // sizeOfChunkData = 5376
    // rleFlag = 1
    // decompressedSize = 21693
    // decSize = 11751
  }
}