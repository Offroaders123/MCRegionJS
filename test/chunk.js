// @ts-check

import { readFile, writeFile } from "node:fs/promises";
import { inflateRawSync } from "node:zlib";
import { decode } from "../dist/rle.js";

const decoder = new TextDecoder();

const data = await readFile(new URL("./chunk/chunk.bin",import.meta.url))
.then(data => {
  const length = new DataView(data.buffer).getUint32(0) & 0xFFFFFF;
  return data.subarray(0,length + 8);
})
.then(data => {
  const decompressed = new DataView(data.buffer).getUint32(4);
  const result = inflateRawSync(data.subarray(12));
  const compressed = result.byteLength;
  return { compressed, decompressed, data: result };
})
.then(({ compressed, decompressed, data }) => {
  const result = Buffer.from(decode(data,decompressed));
  console.log(compressed,decompressed,"\n");
  return result;
});
console.log(data.byteLength,"\n");
console.log(data,"\n");

console.log(decoder.decode(data),"\n");
// await writeFile("./rle-decompress-v6.bin",data);