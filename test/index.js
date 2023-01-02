// @ts-check

import * as fs from "node:fs/promises";
import * as NBT from "nbtify";
import { Region } from "../dist/index.js";

const data = await fs.readFile(new URL("./world/r.0.0.mcr",import.meta.url))
  .then(buffer => new Uint8Array(buffer));
// console.log(data);

// const region = await Region.read(data);
// const region = [await Region.readChunk(data,Region.readLocations(data)[300])];

// for (const chunk of region){
//   console.log(chunk);
// }

const region = await Region.readChunk(data,Region.readLocations(data)[300]);
// console.log(Buffer.from(region?.data).toString());

if (region !== null){
  const { data } = region;
  console.log(data.byteLength);

  const nbt = await findNBT(data);
  console.log(nbt);
}

/**
 * Tries to find an NBT structure within a set of data.
 * 
 * @param { ArrayBufferLike | Uint8Array } data
 * @param { number } offset
 * @returns { Promise<NBT.NBTData> }
*/
async function findNBT(data,offset = 0){
  try {
    console.log(offset);
    if (offset > data.byteLength) throw new Error("Reached the end of the buffer! No NBT data was found");
    // return await NBT.read(data);
    return await NBT.read(data,{ endian: "big", compression: null, isNamed: true, isBedrockLevel: false });
  } catch (error){
    if (offset > data.byteLength) throw error;
    return findNBT(data,offset += 1);
  }
}