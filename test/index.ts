import { readFile } from "node:fs/promises";
import { readRegion } from "../src/index.js";

const data = await readFile(new URL("./world/r.0.0.mcr",import.meta.url));
console.log(data);

const region = readRegion(data);
console.log(region);
console.log(region.length);

// const timestamps = readTimestamps(data);
// console.log(...timestamps);