// @ts-check

import * as fs from "node:fs/promises";
import { Region } from "../dist/index.js";

const data = await fs.readFile(new URL("./world/r.0.0.mcr",import.meta.url))
  .then(buffer => new Uint8Array(buffer));
// console.log(data);

const region = await Region.read(data);

for (const { header } of region){
  console.log(header);
}

/*
const content = data.subarray(0,4096);
const view = new DataView(content.buffer,content.byteOffset,content.byteLength);

let result = "";

for (let i = 0; i < content.byteLength; i += 4){
  // result += `${data.subarray(i,i + 4).join(" ")}\n`;
  // result += `${new Int32Array(data.buffer.slice(i,i + 4))}\n`;
  // const location = view.getUint32(i);
  // Thanks UtterEvergreen!!!
  const offset = (view.getUint32(i) >> 8) * 4096;
  const length = view.getUint8(i + 3) * 4096;
  result += `${offset} ${length}\n`;
}

console.log(result);
*/