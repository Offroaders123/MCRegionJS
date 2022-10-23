// @ts-check

import * as fs from "node:fs/promises";
import * as zlib from "node:zlib";
import * as rle from "../dist/rle.js";

const decoder = new TextDecoder();

const data = await fs.readFile(new URL("./chunk/chunk.bin",import.meta.url))
.then(data => {
  const length = new DataView(data.buffer).getUint32(0) & 0xffffff;
  return data.subarray(0,length + 8);
})
.then(data => {
  const decompressed = new DataView(data.buffer).getUint32(4);
  const result = zlib.inflateRawSync(data.subarray(12));
  const compressed = result.byteLength;
  return { compressed, decompressed, data: result };
})
.then(({ compressed, decompressed, data }) => {
  const result = Buffer.from(rle.decode(data,{ compressed, decompressed }));
  console.log(compressed,decompressed,"\n");
  return result;
});
console.log(data.byteLength,"\n");
console.log(data,"\n");

// console.log(decoder.decode(data),"\n");
// await fs.writeFile("./rle-decompress-v5.bin",data);