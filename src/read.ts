import * as zlib from "node:zlib";
import { chunkify, Chunk, Region } from "./index.js";

export async function read(data: Uint8Array){
  const locations = getLocations(new Uint8Array(data.slice(0,4096))).map(Buffer.from).slice(0,1);
  // console.log(locations);
  const result = new Region(locations);

  for (const location of locations){
    const offset = new DataView(new Uint8Array([0,...location.slice(0,3)]).buffer).getUint32(0) * 4096;
    const size = location[3] * 4096;
    if (offset === size) continue;
    // console.log(offset,size);

    const chunk = data.slice(offset,offset + size);

    const header = data.slice(0,12);
    // console.log(header);

    const content = zlib.inflateRawSync(chunk.slice(12));
    // console.log(content,"\n");

    result.chunks.push(new Chunk(header,content));
    break;
  }

  return result;
}

function getLocations(data: Uint8Array){
  const view = new DataView(data.buffer);
  const offset = view.getUint8(0);
  const entries = data.slice(offset);
  const result = [...chunkify(entries,4)];
  return result;
}