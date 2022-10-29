import { inflateRaw } from "./index.js";

export interface ChunkLocation {
  offset: number;
  length: number;
}

export interface Chunk {
  header: Uint8Array;
  content: Uint8Array;
}

export class Region extends Array<Chunk> {
  static async read(data: Uint8Array) {
    const locations = this.readLocations(data);
    const chunks = await Promise.all(locations.map(location => this.readChunk(data,location)));
    return new Region(...chunks);
  }

  static async readChunk(data: Uint8Array, { offset, length }: ChunkLocation) {
    const chunk = new Uint8Array(data.slice(offset,offset + length));
    const header = chunk.slice(0,12);
    const content = new Uint8Array(await inflateRaw(chunk.slice(12)));
    return { header, content } as Chunk;
  }

  static readLocations(data: Uint8Array) {
    const locations = new Uint8Array(data.slice(0,4096));
    const view = new DataView(locations.buffer);
    const offset = view.getUint8(0);

    const result: ChunkLocation[] = [];

    for (let i = offset; i < locations.byteLength; i += 4){
      const location = new Uint8Array(locations.slice(i,i + 4));
      const view = new DataView(location.buffer);
      const offset2 = view.getUint32(0) & 0xffffff * 4096;
      const length = view.getUint8(3) * 4096;
      result.push({ offset: offset2, length });
      break; // For testing
    }

    return result;
  }
}