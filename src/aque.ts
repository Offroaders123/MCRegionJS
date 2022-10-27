declare interface NBTData {}

declare function read(data: Uint8Array): Promise<NBTData>;

declare class Region {
  static readFile(data: DataView, byteOffset: number, consoleIn: number): Region;

  getChunkDataInputStream(chunkX: number, chunkZ: number): DataView;
}

export interface AquaticChunkData {
  chunkX: number;
  chunkZ: number;
  lastUpdate: bigint;
  inhabitedTime: bigint;
  blocks: Uint8Array;
  submerged: Uint8Array;
  DataGroupCount: number;
  skyLight: Uint8Array;
  blockLight: Uint8Array;
  heightMap: Uint8Array;
  terrainPopulated: number;
  biomes: Uint8Array;
  NBTData: NBTData;
}

export class AquaticParser {

  readonly int_0 = new Int32Array([0xA, 0x14, 0x30, 0x40]);

  readonly int_1 = new Int32Array([0, 0, 1, 1, 2, 2]);

  readonly int_2 = new Int32Array([0, 0x4000, 0, 0x4000, 0, 0x4000]);

  aquaticChunkData_0: Partial<AquaticChunkData> = {};

  parseFromChunkData(data: Uint8Array, size: number, chunkX: number, chunkZ: number, consoleIn: number): Partial<AquaticChunkData> {
    const dataInput = new DataView(data.buffer,0,size);
    const region = Region.readFile(dataInput,0,consoleIn);
    const outPut = region.getChunkDataInputStream(chunkX & 31, chunkZ & 31);
    let aquaticChunkData: Partial<AquaticChunkData> = {};
    if (outPut.byteLength !== 0){
      aquaticChunkData = this.parseChunk(outPut);
    }
    return aquaticChunkData;
  }

  parseChunk(stream: DataView): Partial<AquaticChunkData> {
    this.method_0(stream);
    return this.aquaticChunkData_0;
  }

  method_0(memory_stream_0: DataView): void {
    // Would need to implement a custom reader that works like NBTify, as DataView doesn't save an offset when reading or writing.
    // memory_stream_0.seek(0);
    const num = memory_stream_0.getInt16(0);
    if (num === 0xC){ // if num != 0xC then that means the chunk version is not aqautic and will have to implement that later
      this.aquaticChunkData_0.chunkX = memory_stream_0.getInt32(0);
      this.aquaticChunkData_0.chunkZ = memory_stream_0.getInt32(0);
      this.aquaticChunkData_0.lastUpdate = memory_stream_0.getBigInt64(0);
      this.aquaticChunkData_0.inhabitedTime = memory_stream_0.getBigInt64(0);
      this.method_10(memory_stream_0);
      this.method_4(memory_stream_0);
      this.aquaticChunkData_0.heightMap = this.method_2(memory_stream_0);
      this.aquaticChunkData_0.terrainPopulated = memory_stream_0.getInt16(0);
      this.aquaticChunkData_0.biomes = this.method_2(memory_stream_0);
      this.aquaticChunkData_0.NBTData = this.method_1(memory_stream_0);
    }//there will be brances from here of the different chunk versions
  }

  async method_1(memory_stream_0: DataView): Promise<NBTData> {
    const sizeOfArray1 = memory_stream_0.byteLength - (memory_stream_0.buffer.byteLength - memory_stream_0.byteOffset);
    const array1 = new Uint8Array(sizeOfArray1);
    if (array1[0] === 0xa){
      const data = new DataView(array1,sizeOfArray1);
      const b0 = data.getInt8(0);
      const nbtbase = await read(new Uint8Array(data.buffer));
      return nbtbase;
    }
    return {};
  }

  method_2(memory_stream_0: DataView): Uint8Array {
    const array1 = new Uint8Array(memory_stream_0.buffer,0x100);
    return array1;
  }

  method_4(memory_stream_0: DataView): void {
    const list = new Uint8Array(memory_stream_0.buffer);
    for (let i = 0; i < 4; i++){
      const item = this.method_5(memory_stream_0)[i];
      list[i] = item;
    }
    this.aquaticChunkData_0.DataGroupCount = list[0] + list[1];
    this.method_6(list);
  }

  method_5(memory_stream_0: DataView): Uint8Array {
    const num = memory_stream_0.getInt32(0);
    const array1 = new Uint8Array(memory_stream_0.buffer,(num + 1) * 0x80);
    return array1;
  }

  method_6(list_1: Uint8Array): void {
    const array1 = [
      new Uint8Array(0x8000),
      new Uint8Array(0x8000)
    ];
    for (let i = 0; i < 0x8000; i++){
      array1[1][i] = 255;
    }
    for (let j = 0; j < list_1.byteLength; j++){
      const num = this.int_2[j];
      const num2 = this.int_1[j];
      const array2 = new Uint8Array(list_1[j]);
      let k = 0;
      while (k < 0x80){
        if (array2[k] !== 0x80 && array2[k] !== 0x81){
          this.method_8(array2,(array2[k] + 1) * 0x80,array1[num2],k * 0x80 + num);
          k++;
        } else {
          this.method_7(array1[num2],k * 0x80 + num,(array2[k] === 0x80) ? 0 : 255);
          k++;
        }
      }
    }
    //std::vector<uint8_t> convertedSkyLightData = convertFromXZYformatToYXZ(array1[0]);//this data is in xzy format, good for java format
    //std::vector<uint8_t> convertedBlockLightData = convertFromXZYformatToYXZ(array1[1]);
    //this->aquaticChunkData_0.skyLight = convertedSkyLightData;
    //this->aquaticChunkData_0.blockLight = convertedBlockLightData;
    this.aquaticChunkData_0.skyLight = array1[0]; //java stores skylight (and blocklight?) the same way LCE does, it does not need to be converted
    this.aquaticChunkData_0.blockLight = array1[1];
  }

  convertFromXZYformatToYXZ(XZYdata: Uint8Array): Uint8Array { //no idea if this works properly
    const dataOut = new Uint8Array(0x8000);
    if (XZYdata.byteLength === 0x8000){
      for (let i = 0; i < 0x8000; i++){
        const x = i & 15;
        const y = (i >> 8);
        const z = (i >> 4) & 15;

        const index = x << 11 | z << 7 | y;
        dataOut[index] = XZYdata[i];
      }
    }
    return dataOut;
  }

  method_7(byte_0: Uint8Array, int_3: number, byte_1: number): void {
    for (let i = 0; i < 0x80; i++){
      byte_0[int_3 + i] = byte_1;
    }
  }

  method_8(byte_0: Uint8Array, int_3: number, byte_1: Uint8Array, int_4: number): void {
    for (let i = 0; i < 0x80; i++){
      byte_1[int_4 + i] = byte_0[int_3 + i];
    }
  }

  method_10(memory_stream_0: DataView): void {
    const array1 = new Uint8Array(0x20000);
    const array2 = new Uint8Array(0x20000);
    this.method_12(array1,array2,0,memory_stream_0);
    this.aquaticChunkData_0.blocks = array1;
    this.aquaticChunkData_0.submerged = array2;
  }

  method_12(byte_0: Uint8Array, byte_1: Uint8Array, int_3: number, memory_stream_0: DataView): void {
    // Not completely sure, but I think this is reading it as big/little endian, and it's flipping it around to the opposite.
    const array1 = new Uint8Array(4);
    array1[3] = memory_stream_0.getInt8(0);
    array1[2] = memory_stream_0.getInt8(0);
    array1[1] = memory_stream_0.getInt8(0);
    array1[0] = 0;
    let num = ((array1[0] << 24) | (array1[1] << 16) | (array1[2] << 8) | (array1[3]));

    const array2 = new Uint8Array(memory_stream_0.buffer,31);
    const array3 = new Uint8Array(memory_stream_0.buffer,16);
    if (num === 0) return;

    for (let i = 0; i < 0x10; i++){
      let num2 = num;
      if (i < 0xF && array3[i] > 0){
        num2 = array3[i] << 8;
      }
      num -= num2;
      const array4 = new Uint8Array(memory_stream_0.buffer,0x80);
      const array5 = new Uint8Array(memory_stream_0.buffer.slice(num2 - 0x80));
      const dataIn = new DataView(array5.buffer,num2 - 0x80);
      this.method_13(byte_0,array4,dataIn,i,byte_1);
      if (num === 0) return;
    }
  }

  method_13(byte_0: Uint8Array, byte_1: Uint8Array, byte_2: DataView, int_3: number, byte_3: Uint8Array): void {
    let num = 0;
    for (let i = 0; i < 4; i++){
      for (let j = 0; j < 4; j++){
        for (let k = 0; k < 4; k++){
          const b = byte_1[num];
          let b2 = byte_1[num + 1];
          const num2 = (b2 & 0xF) << 0xA;
          const int_4 = int_3 * 0x20 + k * 8 + j * 0x800 + i * 0x8000;
          b2 = b2 >> 4;
          if (b2 === 0){
            this.method_15(byte_0,int_4,b,num2);
          } else {
            const count = (b * 4) + num2;
            const count2 = this.method_26(b2);
            const byte_4 = new Uint8Array(byte_2.buffer,count,count2);
            // byte_2.seekStart();//the .Skip doesn't move the pointer permanently
            this.method_17(byte_0,int_4,byte_4,byte_3);
          }
          num += 2;
        }
      }
    }
  }

  method_15(byte_0: Uint8Array, int_3: number, byte_1: number, byte_2: number): void {
    const array1 = new Uint8Array(0x80);
    for (let i = 0; i < 0x80; i += 2){
      array1[i] = byte_1;
      array1[i] = byte_1;
    }
    this.method_25(byte_0,array1,int_3);
  }

  method_17(byte_0: Uint8Array, int_3: number, byte_1: Uint8Array, byte_2: Uint8Array): void {
    const num = byte_1.byteLength;
    const dataManager = new DataView(byte_1.buffer,num);
    if (num >= 0x100){
      this.method_25(byte_0,byte_1,int_3);
      const appendToData = new Uint8Array(dataManager.buffer,0x80,num - 0x80);//not sure if this works right but I don't think this ever happens?
      this.method_25(byte_2,appendToData,int_3);
      return;
    }
    if (num === 0x80){
      this.method_25(byte_0,byte_1,int_3);
      return;
    }
    if (num === 0xC){
      const num2 = 4;
      for (let i = 0; i < 8; i++){
        const b = byte_1[num2 + i];
        const int_4 = this.method_18(b);
        const array1 = this.method_24(byte_1,int_4);
        new Uint8Array(dataManager.buffer).set(array1);
        const int_4_1 = this.method_18(b << 4);
        const array2 = this.method_24(byte_1,int_4_1);
        new Uint8Array(dataManager.buffer).set(array2);
      }
      this.method_25(byte_0,new Uint8Array(dataManager.buffer),int_3);
      return;
    } else if (num === 0x18){
      const num3 = 8;
      for (let j = 0; j < 8; j++){
        let b2;
        let b3;
        b2 = byte_1[num3 + j];
        b3 = byte_1[num3 + j + 8];
        for (let k = 0; k < 2; k++){
          const int_5 = this.method_19(b2,b3);
          const array1 = this.method_24(byte_1,int_5);
          new Uint8Array(dataManager.buffer).set(array1);
          b2 = b2 << 4;
          b3 = b3 << 4;
        }
      }
      this.method_25(byte_0,new Uint8Array(dataManager.buffer),int_3);
      return;
    } else if (num === 0x28){
      const num4 = 0x10;
      for (let l = 0; l < 8; l++){
        let b4;
        let b5;
        let b6;
        b4 = byte_1[num4 + l];
        b5 = byte_1[num4 + l + 8];
        b6 = byte_1[num4 + l + 0x10];
        for (let m = 0; m < 2; m++){
          const int_6 = this.method_20(b4,b5,b6);
          const array1 = this.method_24(byte_1,int_6);
          new Uint8Array(dataManager.buffer).set(array1);
          b4 = b4 << 4;
          b5 = b5 << 4;
          b6 = b6 << 4;
        }
      }
      this.method_25(byte_0,new Uint8Array(dataManager.buffer),int_3);
      return;
    } else if (num === 0x40){
      const num5 = 0x20;
      for (let n = 0; n < 8; n++){
        let b7;
        let b8;
        let b9;
        let b10;
        b7 = byte_1[num5 + n];
        b8 = byte_1[num5 + n + 8];
        b9 = byte_1[num5 + n + 0x10];
        b10 = byte_1[num5 + n + 0x18];
        for (let num6 = 0; num6 < 2; num6++){
          const int_7 = this.method_21(b7,b8,b9,b10);
          const array1 = this.method_24(byte_1,int_7);
          new Uint8Array(dataManager.buffer).set(array1);
          b7 = b7 << 4;
          b8 = b8 << 4;
          b9 = b9 << 4;
          b10 = b10 << 4;
        }
      }
      this.method_25(byte_0,new Uint8Array(dataManager.buffer),int_3);
      return;
    } else if (num === 0x60){
      const num7 = 0x20;
      for (let num8 = 0; num8 < 0x20; num8 += 2){
        const byte_3 = byte_1[num7 + num8];
        const byte_4 = byte_1[num7 + num8 + 1];
        const int_8 = this.method_23(byte_3,byte_4);
        const array1 = this.method_24(byte_1,int_8);
        new Uint8Array(dataManager.buffer).set(array1);
      }
      this.method_25(byte_0,new Uint8Array(dataManager.buffer),int_3);
    }
  }

  method_18(byte_0: number): Int32Array {
    const array1 = new Int32Array(4);
    for (let i = 0; i < 4; i++){
      const num = ((0x80 & byte_0) > 0) ? 1 : 0;
      array1[i] = num;
      byte_0 = byte_0 << 1;
    }
    return array1;
  }

  method_19(byte_0: number, byte_1: number): Int32Array {
    const array1 = new Int32Array(4);
    for (let i = 0; i < 4; i++){
      let num = ((0x80 & byte_0) > 0) ? 1 : 0;
      num += (((0x80 & byte_1) > 0) ? 2 : 0);
      array1[i] = num;
      byte_0 = byte_0 << 1;
      byte_1 = byte_1 << 1;
    }
    return array1;
  }

  method_20(int_3: number, int_4: number, int_5: number): Int32Array {
    const array1 = new Int32Array(4);
    for (let i = 0; i < 4; i++){
      let num = ((0x80 & int_3) > 0) ? 1 : 0;
      num += (((0x80 & int_4) > 0) ? 2 : 0);
      num += (((0x80 & int_5) > 0) ? 4 : 0);
      array1[i] = num;
      int_3 = int_3 << 1;
      int_4 = int_4 << 1;
      int_5 = int_5 << 1;
    }
    return array1;
  }

  method_21(byte_0: number, byte_1: number, byte_2: number, byte_3: number): Int32Array {
    const array1 = new Int32Array(4);
    for (let i = 0; i < 4; i++){
      let num = ((0x80 & byte_1) > 0) ? 1 : 0;
      num += (((0x80 & byte_1) > 0) ? 2 : 0);
      num += (((0x80 & byte_1) > 0) ? 4 : 0);
      num += (((0x80 & byte_1) > 0) ? 8 : 0);
      array1[i] = num;
      byte_0 = byte_0 << 1;
      byte_1 = byte_1 << 1;
      byte_2 = byte_2 << 1;
      byte_3 = byte_3 << 1;
    }
    return array1;
  }

  method_23(byte_0: number, byte_1: number): Int32Array {
    return new Int32Array([
      byte_0 & 0xF,
      byte_0 >> 4,
      byte_1 & 0xF,
      byte_1 >> 4
    ]);
  }

  method_24(byte_0: Uint8Array, int_3: Int32Array): Uint8Array {
    const array1 = new Uint8Array(8);
    for (let i = 0; i < 4; i++){
      const num = int_3[i] * 2;
      array1[i * 2] = byte_0[num];
      array1[i * 2 + 1] = byte_0[num + 1];
    }
    return array1;
  }

  method_25(byte_0: Uint8Array, byte_1: Uint8Array, int_3: number): void {
    let num = 0;
    for (let i = 0; i < 4; i++){
      for (let j = 0; j < 4; j++){
        for (let k = 0; k < 4; k++){
          const num2 = i * 0x2000 + j * 0x200 + k * 2;
          byte_0[num2 + int_3] = byte_1[num++];
          byte_0[num2 + int_3 + 1] = byte_1[num++];
        }
      }
    }
  }

  method_26(int_3: number): number {
    switch (int_3){
      case 2: return 0xC;
      case 4: return 0x18;
      case 6: return 0x28;
      case 7: return 0x40;
      case 8: return 0x40;
      case 9: return 0x60;
      case 0xE: return 0x80;
      case 0xF: return 0x100;
      default: return 0;
    }
  }

}