import { LOCATIONS_LENGTH } from "./location.js";

export const TIMESTAMP_LENGTH = 4;
export const TIMESTAMPS_LENGTH = 4096;

export type Timestamp = number;

export function* readTimestamps(region: Uint8Array): Generator<Timestamp,void,void> {
  const view = new DataView(region.buffer,region.byteOffset,region.byteLength);

  for (let i = LOCATIONS_LENGTH; i < LOCATIONS_LENGTH + TIMESTAMPS_LENGTH; i += TIMESTAMP_LENGTH){
    yield view.getUint32(i);
  }
}