export { compress, decompress } from "nbtify";

/**
 * Decompresses Uint8Array data using the Run-Length Encoding format.
*/
export function runLengthDecode(data: Uint8Array, decompressedLength: number): Uint8Array {
  const compressedLength = data.byteLength;
  const result = new Uint8Array(decompressedLength);
  let readOffset = 0;
  let writeOffset = 0;

  while (readOffset < compressedLength){
    const suspectedTag = data[readOffset]!;
    readOffset++;

    if (suspectedTag === 255){
      const length = data[readOffset]!;
      readOffset++;
      let value = 255;

      if (length >= 3){
        value = data[readOffset]!;
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