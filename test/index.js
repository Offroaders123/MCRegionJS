import { promises as fs } from "fs";
import path from "path";
import MCR from "../src/index.js";

const data = await fs.readFile("./test/world/r.0.0.mcr");

const chunks = await MCR.read(data);
console.log(chunks);

await fs.writeFile("result.txt",chunks[0]);