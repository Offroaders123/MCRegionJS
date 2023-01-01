// @ts-check

import * as fs from "node:fs/promises";
import { Region } from "../dist/index.js";

const data = await fs.readFile(new URL("./world/r.0.0.mcr",import.meta.url))
  .then(buffer => new Uint8Array(buffer));
// console.log(data);

// const region = await Region.read(data);
const region = [await Region.readChunk(data,Region.readLocations(data)[300])];

for (const chunk of region){
  console.log(chunk);
}