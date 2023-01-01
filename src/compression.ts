import { promisify } from "node:util";
import { inflateRaw as inflateRawCallback } from "node:zlib";

/**
 * A Promise-based wrapper for the Node Zlib Inflate Raw callback function.
*/
export async function inflateRaw(data: Uint8Array){
  const buffer = await promisify(inflateRawCallback)(data);
  return new Uint8Array(buffer);
}

/**
 * Decodes Uint8Array data compressed with the Run-Length Encoding format.
*/
export function rleDecode(data: Uint8Array, decompressedLength: number){
  const compressedLength = data.byteLength;
  const result = new Uint8Array(decompressedLength);
  let readOffset = 0;
  let writeOffset = 0;

  while (readOffset < compressedLength){
    const suspectedValue = data[readOffset];
    const suspectedLength = data[readOffset + 1];

    if (suspectedValue === 0xFF && suspectedLength >= 3){
      const value = data[readOffset + 2];
      const length = suspectedLength;
      const entries = new Uint8Array(length).fill(value);

      result.set(entries,writeOffset);
      readOffset += 2;
      writeOffset += (suspectedLength - 1);
    } else {
      result[writeOffset] = suspectedValue;
    }

    readOffset++;
    writeOffset++;
  }

  return result;
}