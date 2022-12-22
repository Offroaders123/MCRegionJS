import { Chunk } from "./chunk.js";

export interface Location {
  offset: number;
  length: number;
}

export class Region extends Array<Chunk> {
  static async read(data: Uint8Array) {
    const locations = this.readLocations(data);
    const chunks = await Promise.all(locations.map(location => this.#readChunk(data,location)));
    return new Region(...chunks);
  }

  static readLocations(data: Uint8Array) {
    const locations = data.subarray(0,4096);
    const view = new DataView(locations.buffer,locations.byteOffset,locations.byteLength);
    const offset = view.getUint8(0);

    const result: Location[] = [];

    for (let i = offset; i < locations.byteLength; i += 4){
      const data = locations.subarray(i,i + 4);
      const location = this.#readLocation(data);
      result.push(location);
      break; // For testing
    }

    return result;
  }

  static #readLocation(data: Uint8Array): Location {
    const view = new DataView(data.buffer,data.byteOffset,data.byteLength);
    const offset = view.getUint32(0) & 0xFFFFFF * 4096;
    const length = view.getUint8(3) * 4096;
    return { offset, length };
  }

  static async #readChunk(data: Uint8Array, { offset, length }: Location) {
    const chunk = data.subarray(offset,offset + length);
    return Chunk.read(chunk);
  }
}