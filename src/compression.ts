import { type CompressionFormat, makeCompressionStream, makeDecompressionStream } from "compression-streams-polyfill/ponyfill";

const CompressionStream = makeCompressionStream(TransformStream);
const DecompressionStream = makeDecompressionStream(TransformStream);

/**
 * Transforms a Uint8Array through a specific compression format.
*/
export async function compress(data: Uint8Array, format: CompressionFormat): Promise<Uint8Array> {
  const { body } = new Response(data);
  const readable = body!.pipeThrough(new CompressionStream(format));
  const buffer = await new Response(readable).arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Transforms a Uint8Array through a specific decompression format.
*/
export async function decompress(data: Uint8Array, format: CompressionFormat): Promise<Uint8Array> {
  const { body } = new Response(data);
  const readable = body!.pipeThrough(new DecompressionStream(format));
  const buffer = await new Response(readable).arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Decodes Uint8Array data compressed with the Run-Length Encoding format.
*/
export function decodeRLE(data: Uint8Array, decompressedLength: number){
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