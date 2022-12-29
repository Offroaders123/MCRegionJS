import { Chunk } from "./chunk.js";

export interface Location {
  offset: number;
  length: number;
}

export class Region extends Array<Chunk> {
  static async read(data: Uint8Array) {
    const locations = this.readLocations(data);
    const chunks = await Promise.all(locations.map(location => this.readChunk(data,location)));
    return new Region(...chunks);
  }

  static readLocations(data: Uint8Array) {
    const locations = data.subarray(0,4096);
    const view = new DataView(locations.buffer,locations.byteOffset,locations.byteLength);
    const result: Location[] = [];

    for (let i = 0; i < locations.byteLength; i += 4){
      const offset = (view.getUint32(i) >> 8) * 4096;
      const length = view.getUint8(i + 3) * 4096;
      result.push({ offset, length });
      // break; // For testing
    }

    return result;
  }

  static async readChunk(data: Uint8Array, { offset, length }: Location) {
    const chunk = data.subarray(offset,offset + length);
    return Chunk.read(chunk);
  }
}