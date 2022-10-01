export * from "./read.js";
export { chunkify } from "gamedata-parser";

export class Region {
  constructor(public locations: Uint8Array[] = [], public chunks: Chunk[] = []) {}
}

export class Chunk {
  constructor(public header: Uint8Array, public data: Uint8Array) {}
}