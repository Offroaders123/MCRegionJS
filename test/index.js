// @ts-check

import * as fs from "node:fs/promises";
import { Region } from "../dist/index.js";

const data = await fs.readFile(new URL("./world/r.0.0.mcr",import.meta.url))
  .then(buffer => new Uint8Array(buffer));
// console.log(data);

// const region = Region.readLocations(data);

// for (const location of region){
//   console.log(location);
// }

const content = data.subarray(0,4096);
const view = new DataView(content.buffer,content.byteOffset,content.byteLength);

let result = "";

for (let i = 0; i < content.byteLength; i += 4){
  // result += `${data.subarray(i,i + 4).join(" ")}\n`;
  // result += `${new Int32Array(data.buffer.slice(i,i + 4))}\n`;
  const location = view.getUint32(i);
  // Thanks UtterEvergreen!!!
  const offset = (location >> 8) * 4096;
  const length = (location & 255) * 4096;
  result += `${offset} ${length}\n`;
}

console.log(result);