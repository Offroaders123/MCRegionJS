import { readLocations } from "./location.js";

export type Region = Entry[];

export function readRegion(region: Uint8Array): Region {
  return [...readEntry(region)];
}

export type Entry = Uint8Array | null;

export function* readEntry(region: Uint8Array): Generator<Entry,void,void> {
  for (const { byteOffset, byteLength } of readLocations(region)){
    yield byteLength !== 0 ? region.subarray(byteOffset,byteOffset + byteLength) : null;
  }
}