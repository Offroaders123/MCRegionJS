import { promises as fs } from "fs";
import path from "path";
import MCR from "../src/index.js";

const data = await fs.readFile("./test/world/r.0.0.mcr");

const chunks = await MCR.read(data);
const chunk1 = chunks[0];
const chunk2 = chunks[8];
console.log(chunk1);
console.log(chunk2);

await fs.writeFile("result",`${new Uint8Array(chunk1).join(" ")}`);
await fs.writeFile("result2",`${new Uint8Array(chunk2).join(" ")}`);