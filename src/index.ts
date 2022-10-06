export * from "./read.js";

export class Region extends Array<Chunk> {
  static getLocations(data: Uint8Array) {
    const view = new DataView(data.buffer);
    const offset = view.getUint8(0);
    const result = [...chunkify(data.slice(offset),4)];
    return result;
  }
}

export class Chunk {
  constructor(public location: Uint8Array, public header: Uint8Array, public value: Uint8Array) {}
}

export function* chunkify(data: Uint8Array, length: number){
  for (let i = 0; i < data.length; i += length){
    yield data.slice(i,i + length);
  }
}