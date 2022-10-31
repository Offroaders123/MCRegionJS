export * from "./region.js";
export * from "./chunk.js";
export * from "./rle.js";

import { promisify } from "node:util";
import { inflateRaw as inflateRawCallback } from "node:zlib";

const inflateRawAsync = promisify(inflateRawCallback);

export async function inflateRaw(data: Uint8Array){
  const result = await inflateRawAsync(data);
  return new Uint8Array(result);
}