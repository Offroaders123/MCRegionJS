import * as zlib from "node:zlib";
import { chunkify, Chunk, Region } from "./index.js";

export async function read(data: Uint8Array){
  const locations = Region.getLocations(data);
  // console.log(locations);

  const chunks = locations.map(location => {
    const offset = new DataView(new Uint8Array([0,...location.slice(0,3)])).getUint32(0) * 4096;
    const size = location[3] * 4096;
    // if (offset === size) continue;

    const chunk = data.slice(offset,offset + size);

    const header = data.slice(0,12);
  });
}