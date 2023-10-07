import { readFile } from "node:fs/promises";
import { readRegion, readChunks } from "../src/index.js";

import type { Chunk } from "../src/index.js";

const data = await readFile(new URL("./world/r.0.0.mcr",import.meta.url));
// console.log(data);

const region = readRegion(data);
// console.log(region);
// console.log(region.length);

// const timestamps = readTimestamps(data);
// console.log(...timestamps);

const chunks = await readChunks(region);
console.log(chunks.filter((chunk): chunk is Chunk => chunk?.data.Format.valueOf() === 12).map(chunk => chunk.data ?? chunk));