export interface Region extends ReadonlyArray<Entry | null> {
  [index: number]: Entry | null;
}

export function readRegion(region: Uint8Array): Region {
  return Object.seal([...readEntries(region)]);
}

export const LOCATIONS_OFFSET = 0;
export const LOCATIONS_LENGTH = 4096;
export const LOCATION_LENGTH = 4;

export const TIMESTAMPS_OFFSET = LOCATIONS_LENGTH;
export const TIMESTAMPS_LENGTH = 4096;
export const TIMESTAMP_LENGTH = 4;

export const ENTRY_HEADER_LENGTH = 12;

export interface Entry {
  data: Uint8Array;
  timestamp: number;
  rle: boolean;
  compressedLength: number;
  decompressedLength: number;
  rleCompressedLength: number;
}

export function* readEntries(region: Uint8Array): Generator<Entry | null,void,void> {
  const view = new DataView(region.buffer,region.byteOffset,region.byteLength);

  for (let i = LOCATIONS_OFFSET; i < LOCATIONS_OFFSET + LOCATIONS_LENGTH; i += LOCATION_LENGTH){
    const byteOffset = (view.getUint32(i) >> 8) * LOCATIONS_LENGTH;
    const byteLength = view.getUint8(i + 3) * LOCATIONS_LENGTH;
    const timestamp = view.getUint32(i + TIMESTAMPS_OFFSET);

    if (byteLength === 0){
      yield null; continue;
    }

    let data = region.subarray(byteOffset,byteOffset + byteLength);

    const entryView = new DataView(data.buffer,data.byteOffset,data.byteLength);

    const rle = Boolean(entryView.getUint8(0) >> 7);
    const compressedLength = entryView.getUint32(0) & 0x3FFFFFFF;
    const decompressedLength = entryView.getUint32(4);
    const rleCompressedLength = entryView.getUint32(8);

    data = data.subarray(ENTRY_HEADER_LENGTH);

    yield { data, timestamp, rle, compressedLength, decompressedLength, rleCompressedLength };
  }
}