import { promises as fs } from "fs";
import path from "path";

const data = await fs.readFile("./world/r.0.0.mcr");

const locations = data.slice(0,8192);

const chunks = parseFileChunks(locations);

for (const chunk of chunks){
  console.log(chunk);
}

function parseFileChunks(data){
  const offset = new DataView(data.buffer).getUint8();
  const locations = data.slice(offset);

  const chunks = chunkify(locations,4);
  return chunks;
}

function chunkify(data,size){
  const results = [];
  for (let i = 0; i < data.length; i += size){
    const chunk = data.slice(i,i + size);
    results.push(chunk);
  }
  return results;
}