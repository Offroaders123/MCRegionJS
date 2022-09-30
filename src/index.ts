export * from "./read.js";
export { chunkify } from "gamedata-parser";

export class Chunk {
  /**
   * @param { Uint8Array } [header]
   * @param { Uint8Array } [data]
  */
  constructor(public header: Uint8Array, public data: Uint8Array) {
    this.header = header;
    this.data = data;
  }
}

export class Region {
  /**
   * @param { Uint8Array[] } [locations]
   * @param { Chunk[] } [chunks]
  */
  constructor(public locations: Uint8Array[] = [], public chunks: Chunk[] = []) {
    this.locations = locations;
    this.chunks = chunks;
  }
}