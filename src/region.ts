export interface Region extends ReadonlyArray<Entry> {
  [index: number]: Entry;
}

export function readRegion(region: Uint8Array): Region {
  return Object.seal([...readEntries(region)]);
}

export type Entry = Uint8Array | null;

export function* readEntries(region: Uint8Array): Generator<Entry,void,void> {
  for (const { byteOffset, byteLength } of readLocations(region)){
    yield byteLength !== 0 ? region.subarray(byteOffset,byteOffset + byteLength) : null;
  }
}

export const LOCATION_LENGTH = 4;
export const LOCATIONS_LENGTH = 4096;

export interface Location {
  byteOffset: number;
  byteLength: number;
}

export function* readLocations(region: Uint8Array): Generator<Location,void,void> {
  const view = new DataView(region.buffer,region.byteOffset,LOCATIONS_LENGTH);

  for (let i = 0; i < LOCATIONS_LENGTH; i += LOCATION_LENGTH){
    const byteOffset = (view.getUint32(i) >> 8) * LOCATIONS_LENGTH;
    const byteLength = view.getUint8(i + 3) * LOCATIONS_LENGTH;

    yield { byteOffset, byteLength };
  }
}

export const TIMESTAMP_LENGTH = 4;
export const TIMESTAMPS_LENGTH = 4096;

export type Timestamp = number;

export function* readTimestamps(region: Uint8Array): Generator<Timestamp,void,void> {
  const view = new DataView(region.buffer,region.byteOffset,TIMESTAMPS_LENGTH);

  for (let i = LOCATIONS_LENGTH; i < LOCATIONS_LENGTH + TIMESTAMPS_LENGTH; i += TIMESTAMP_LENGTH){
    yield view.getUint32(i);
  }
}