export function decode(data: Uint8Array, { compressed, decompressed }: { compressed: number; decompressed: number; }){
  const result = new Uint8Array(decompressed);
  let i = 0;
  let offset = 0;

  while (i < compressed){
    const entry = data[i];
    const length = data[i + 1];

    if (entry === 0xff && length >= 3){
      const value = data[i + 2];
      console.log(`Wrap! Length: ${length}; Value: ${value};`);
      result.set(Array(length).fill(value),offset);

      i += 2;
      offset += length - 1;
    } else {
      console.log(i,offset,entry.toString(16).padStart(2,"0"));
      result[offset] = entry;
    }

    i++;
    offset++;
  }

  return result;
}