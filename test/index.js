// @ts-check

import * as fs from "node:fs/promises";
// import * as NBT from "nbtify";
import * as MCR from "../dist/index.js";

const data = await fs.readFile(new URL("./world/r.0.0.mcr",import.meta.url));
// console.log(data);

const region = await MCR.read(data);
console.log(region);