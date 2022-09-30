// @ts-check

import * as fs from "node:fs/promises";
// import * as NBT from "nbtify";
import * as MCR from "../src/index.js";

const data = await fs.readFile(new URL("./world/r.0.0.mcr",import.meta.url));
// console.log(data);

const region = await MCR.read(data);
console.log(region);

/*
// A copy of the demo from anvil.mjs. It's what helped me figure out that part of the chunk data uses Deflate-Raw

/** @type { (data: Uint8Array, offset?: number) => Promise<NBT.NBTData> } *\/
async function readChunk(data,offset = 0){
  try {
    console.log(offset);
    const result = zlib.inflateRawSync(data.slice(offset));
    return result;
  } catch {
    return readChunk(data,offset += 1);
  }
}

/** @type { (data: Uint8Array, offset?: number) => Promise<NBT.NBTData> } *\/
async function readNBT(data,offset = 0){
  try {
    console.log(offset);
    const result = await NBT.read(data);
    return result;
  } catch {
    return readNBT(data,offset += 1);
  }
}

*/