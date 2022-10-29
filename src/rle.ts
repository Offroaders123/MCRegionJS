export function decode(data: Uint8Array, decompressed: number){
  const compressed = data.byteLength;
  const result = new Uint8Array(decompressed);
  let i = 0;
  let offset = 0;

  while (i < compressed){
    const entry = data[i];
    const length = data[i + 1];

    if (entry === 0xFF && length >= 3){
      const value = data[i + 2];
      const entries = Array<number>(length).fill(value);

      result.set(entries,offset);
      i += 2;
      offset += (length - 1);
    } else {
      result[offset] = entry;
    }

    i++;
    offset++;
  }

  return result;
}