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
    const suspectedTag = data[readOffset];
    readOffset++;

    if (suspectedTag === 255){
      const length = data[readOffset];
      readOffset++;
      let value = 255;

      if (length >= 3){
        value = data[readOffset];
        readOffset++;
      }

      for (let i = 0; i <= length; i++){
        result[writeOffset] = value;
        writeOffset++;
      }
    } else {
      result[writeOffset] = suspectedTag;
      writeOffset++;
    }
  }

  return result;
}