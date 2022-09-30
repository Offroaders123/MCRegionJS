import * as zlib from "node:zlib";
import { chunkify, Chunk, Region } from "./index.js";

/**
 * @param { Uint8Array } data
*/
export async function read(data){
  const locations = getLocations(new Uint8Array(data.subarray(0,4096)));
  // console.log(locations);
  const result = new Region(locations);

  for (const [i,location] of locations.entries()){
    const offset = new DataView(new Uint8Array([0,...location.slice(0,3)]).buffer).getUint32(0) * 4096;
    const size = location[3] * 4096;
    if (offset === size) continue;
    // console.log(offset,size);

    const chunk = Buffer.from(data.subarray(offset,offset + size));

    const header = data.subarray(0,12);
    // console.log(header);

    const content = zlib.inflateRawSync(chunk.subarray(12));
    // console.log(content,"\n");

    result.chunks.push(new Chunk(header,content));
    // if (i === 1) break;
  }

  return result;
}

/**
 * @param { Uint8Array } data
*/
function getLocations(data){
  const view = new DataView(data.buffer);
  const offset = view.getUint8(0);
  const entries = data.slice(offset);
  const result = chunkify(entries,4);
  return result;
}