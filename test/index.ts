import { readFile } from "node:fs/promises";
import { readRegion, readChunks } from "../src/index.js";

const REGION = new URL("./world/r.0.0.mcr",import.meta.url);

const data = await readFile(REGION);

const region = readRegion(data);
console.log(region[64]);
console.log(region.length);

const chunks = await readChunks(region);
console.log(chunks[64]);
// console.log(chunks.length);