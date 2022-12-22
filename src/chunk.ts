import { inflateRaw } from "./compression.js";

export class Chunk {
  static async read(data: Uint8Array) {
    const header = data.slice(0,12);
    const content = data.slice(12);
    return new Chunk(Buffer.from(header),Buffer.from(content));
  }

  constructor(public header: Uint8Array, public content: Uint8Array) {}
}