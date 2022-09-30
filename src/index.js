export * from "./read.js";
export { chunkify } from "gamedata-parser";

export class Chunk {
  /**
   * @param { Uint8Array } [header]
   * @param { Uint8Array } [data]
  */
  constructor(header,data) {
    this.header = header;
    this.data = data;
  }
}

export class Region {
  /**
   * @param { Uint8Array[] } [locations]
   * @param { Chunk[] } [chunks]
  */
  constructor(locations = [],chunks = []) {
    this.locations = locations;
    this.chunks = chunks;
  }
}