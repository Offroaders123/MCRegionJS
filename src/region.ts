import * as zlib from "node:zlib";
import { chunkify } from "./index.js";

export interface ChunkLocation {
  offset: number;
  length: number;
}

export class Region {
  static read(data: Uint8Array) {
    const locations = this.readLocations(data);
    const chunks = locations.map(location => this.readChunk(data,location));
    return chunks;
  }

  static readChunk(data: Uint8Array, { offset, length }: ChunkLocation) {
    const chunk = new Uint8Array(data.slice(offset,offset + length));
    const header = chunk.slice(0,12);
    const content = new Uint8Array(zlib.inflateRawSync(chunk.slice(12)));
    return { header, content };
  }

  static readLocations(data: Uint8Array) {
    const header = new Uint8Array(data.slice(0,4096));
    const view = new DataView(header.buffer);
    const offset = view.getUint8(0);
    const locations = [...chunkify(header.slice(offset),4)];

    const result: ChunkLocation[] = [];

    for (const location of locations){
      const view = new DataView(location.buffer);
      const offset = view.getUint32(0) & 0xffffff * 4096;
      const length = view.getUint8(3) * 4096;
      result.push({ offset, length });
      break; // For testing
    }

    return result;
  }
}