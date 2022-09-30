// This was located in the parent folder, so I recommend moving it to the parent folder which holds MCRegionJS.
// This is the demo for this update's changes. This is the more concrete example of what I found.
// @ts-check

import * as fs from "node:fs/promises";
import * as NBT from "./NBTify/dist/index.js";
import * as zlib from "node:zlib";

const data = await fs.readFile(new URL("./MCRegionJS/test/world/r.0.0.mcr",import.meta.url));
// console.log(data);

const locations = getLocations(new Uint8Array(data.subarray(0,4096)));
// console.log(locations);

for (const [i,location] of locations.entries()){
  const offset = new DataView(new Uint8Array([0,...location.slice(0,3)]).buffer).getUint32(0) * 4096;
  const size = location[3] * 4096;
  if (offset === size) continue;
  // console.log(offset,size);

  const chunk = Buffer.from(data.subarray(offset,offset + size));
  const length = new DataView(chunk.buffer).getUint32(0);
  console.log(length,chunk,"\n");

  const header = data.subarray(0,12);
  console.log(header);

  const result = zlib.inflateRawSync(chunk.subarray(12));
  console.log(result,"\n");

  // fs.writeFile(new URL(`./chunk${i}.bin`,import.meta.url),result);
  // clear; node anvil.mjs; diff -y <(xxd chunk0.bin) <(xxd chunk1.bin)

  if (i === 1) break;
}

/** @type { (data: Uint8Array, offset?: number) => Promise<NBT.NBTData> } */
async function readChunk(data,offset = 0){
  try {
    console.log(offset);
    const result = zlib.inflateRawSync(data.slice(offset));
    return result;
  } catch {
    return readChunk(data,offset += 1);
  }
}

/** @type { (data: Uint8Array, offset?: number) => Promise<NBT.NBTData> } */
async function readNBT(data,offset = 0){
  try {
    console.log(offset);
    const result = await NBT.read(data);
    return result;
  } catch {
    return readNBT(data,offset += 1);
  }
}

/** @param { Uint8Array } data */
function getLocations(data){
  const view = new DataView(data.buffer);
  const offset = view.getUint8(0);
  const entries = data.slice(offset);
  const length = 4;

  const result = [];
  for (let i = 0; i < entries.length; i += length){
    const size = i + length;
    const section = entries.slice(i,size);
    result.push(section);
  }

  return result;
}