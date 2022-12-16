import { inflateRaw } from "./compression.js";

export class Chunk {
  static async read(data: Uint8Array) {
    const header = data.slice(0,12);
    const content = await inflateRaw(data.slice(12));
    return new Chunk(header,content);
  }

  constructor(public header: Uint8Array, public content: Uint8Array) {}
}