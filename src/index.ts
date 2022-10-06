export * from "./read.js";

export class Region {
  constructor(public locations: Uint8Array[] = [], public chunks: Chunk[] = []) {}
}

export class Chunk {
  constructor(public header: Uint8Array, public data: Uint8Array) {}
}

export function* chunkify(data: Uint8Array, length: number){
  for (let i = 0; i < data.length; i += length){
    yield data.slice(i,i + length);
  }
}