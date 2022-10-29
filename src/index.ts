export * from "./region.js";
export * from "./chunk.js";
export * from "./rle.js";

import { promisify } from "node:util";
import { inflateRaw as inflateRawCallback } from "node:zlib";

export const inflateRaw = promisify(inflateRawCallback);