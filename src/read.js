import zlib from "zlib";
import NBT from "../../NBT-Parser/src/index.js";
import { chunkify } from "../../Gamedata-Parser/src/index.js";

export default async function read(data){
  const locations = new Uint8Array(data.slice(0,4096));
  const definitions = getDefinitions(locations);
  const result = [];

  for (const definition of definitions){
    const offset = new DataView(new Uint8Array([0,...definition.slice(0,3)]).buffer).getInt32(0) * 4096;
    const sector = definition[3];

    const length = 4096 * sector;
    const chunk = data.slice(offset,offset + length);

    console.log(offset,sector);
    result.push(chunk);
    break;
  }

  return result;
}

function getDefinitions(data){
  const view = new DataView(data.buffer);
  const offset = view.getUint8(0);
  const locations = data.slice(offset);

  const result = chunkify(locations,4);
  return result;
}