export * from "./region.js";
export * from "./chunk.js";
export * from "./rle.js";

export function* chunkify(data: Uint8Array, length: number){
  for (let i = 0; i < data.length; i += length){
    yield data.slice(i,i + length);
  }
}