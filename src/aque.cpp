class AquaticParser {
public:

    int int_0[4] = {0xA, 0x14, 0x30, 0x40};

    int int_1[6] = { 0, 0, 1, 1, 2, 2 };

    int int_2[6] = { 0, 0x4000, 0, 0x4000, 0, 0x4000 };

    AquaticChunkData aquaticChunkData_0;

    AquaticChunkData parseChunkFromData(uint8_t* data, int size, int chunkX, int chunkZ, int consoleIn) {
        DataInputManager dataInput = DataInputManager(data, size);
        RegionFileRead region = RegionFileRead(dataInput, 0, consoleIn);
        DataInputManager outPut = region.getChunkDataInputStream(chunkX & 31, chunkZ & 31);
        /*std::string outfileStr = "C:\\Users\\Daniel\\Desktop\\testChunkDecompressed.dat";
        FILE* f = NULL;
        f = fopen(outfileStr.c_str(), "wb");
        if (f == NULL) {
            printf("cannot open infile %s", outfileStr.c_str());//open inpout
        }
        else {
            fwrite(outPut.data, 1, outPut.size_of_data, f);
        }*/ //I used this to output the contents of the decompressed chunk to a file
        AquaticChunkData aquaticChunkData;
        if (outPut.size_of_data != NULL) {
            aquaticChunkData = this->ParseChunk(outPut);
            region.~RegionFileRead();
        }
        return aquaticChunkData;
    }

    AquaticChunkData ParseChunk(DataInputManager stream) {
        this->method_0(stream);
        return this->aquaticChunkData_0;
    }

    void method_0(DataInputManager memoryStream_0) {
        memoryStream_0.seek(0);
        short num = memoryStream_0.readShort();
        if (num == 0xC) { // if num != 0xC then that means the chunk version is not aqautic and will have to implement that later
            this->aquaticChunkData_0.chunkX = memoryStream_0.readInt();
            this->aquaticChunkData_0.chunkZ = memoryStream_0.readInt();
            this->aquaticChunkData_0.lastUpdate = memoryStream_0.readLong();
            this->aquaticChunkData_0.inhabitedTime = memoryStream_0.readLong();
            this->method_10(memoryStream_0);
            this->method_4(memoryStream_0);
            this->aquaticChunkData_0.heightMap = this->method_2(memoryStream_0);
            this->aquaticChunkData_0.terrainPopulated = (int)memoryStream_0.readShort();
            this->aquaticChunkData_0.biomes = this->method_2(memoryStream_0);
            this->aquaticChunkData_0.NBTData = this->method_1(memoryStream_0);
        }//there will be brances from here of the different chunk versions
    }

    NBTBase* method_1(DataInputManager& memoryStream_0) {
        int sizeOfArray1 = memoryStream_0.size_of_data - (memoryStream_0.data - memoryStream_0.start_of_data);
        uint8_t* array1 = memoryStream_0.read(sizeOfArray1);
        if (array1[0] == 0xA) {
            DataInputManager data = DataInputManager(array1, sizeOfArray1);
            uint8_t b0 = data.readByte();
            std::string s = data.readUTF();
            NBTBase* nbtbase = readNBT(b0, s, data);
            return nbtbase;
        }
        return nullptr;
    }

    std::vector<uint8_t> method_2(DataInputManager &memoryStream_0) {
        std::vector<uint8_t> array1;
        array1 = memoryStream_0.readIntoVector(0x100);
        return array1;
    }

    void method_4(DataInputManager &memoryStream_0) {
        std::vector<std::vector<uint8_t>> list;
        for (int i = 0; i < 4; i++) {
            std::vector<uint8_t> item = this->method_5(memoryStream_0);
            list.push_back(item);
        }
        this->aquaticChunkData_0.DataGroupCount = list[0].size() + list[1].size();
        this->method_6(list);
    }

    std::vector<uint8_t> method_5(DataInputManager &memoryStream_0) {
        int num = memoryStream_0.readInt();
        std::vector<uint8_t> array1;
        array1 = memoryStream_0.readIntoVector((num + 1) * 0x80);
        return array1;
    }

    void method_6(std::vector<std::vector<uint8_t>> list_1) {
        std::vector<std::vector<uint8_t>> array1 = {
            std::vector<uint8_t>(0x8000),
            std::vector<uint8_t>(0x8000),
        };
        for (int i = 0; i < 0x8000; i++) {
            array1[1][i] = (uint8_t)255;
        }
        for (int j = 0; j < list_1.size(); j++) {
            int num = this->int_2[j];
            int num2 = this->int_1[j];
            std::vector<uint8_t> array2 = list_1[j];
            int k = 0;
            while (k < 0x80) {
                if (array2[k] != 0x80 && array2[k] != 0x81) {
                    this->method_8(array2, (int)((array2[k] + 1) * 0x80), array1[num2], k * 0x80 + num);
                    k++;
                }
                else {
                    this->method_7(array1[num2], k * 0x80 + num, (array2[k] == (uint8_t)0x80) ? (uint8_t)0 : (uint8_t)255);
                    k++;
                }
            }
        }
        //std::vector<uint8_t> convertedSkyLightData = convertFromXZYformatToYXZ(array1[0]);//this data is in xzy format, good for java format
        //std::vector<uint8_t> convertedBlockLightData = convertFromXZYformatToYXZ(array1[1]);
        //this->aquaticChunkData_0.skyLight = convertedSkyLightData;
        //this->aquaticChunkData_0.blockLight = convertedBlockLightData;
        this->aquaticChunkData_0.skyLight = array1[0]; //java stores skylight (and blocklight?) the same way LCE does, it does not need to be converted
        this->aquaticChunkData_0.blockLight = array1[1];
    }
    std::vector<uint8_t> convertFromXZYformatToYXZ(std::vector<uint8_t> XZYdata) { //no idea if this works properly
        std::vector<uint8_t> dataOut(0x8000, 0);
        if (XZYdata.size() == 0x8000) {
            for (int i = 0; i < 0x8000; i++) {
                int x = i & 15;
                int y = (i >> 8);
                int z = (i >> 4) & 15;

                int index = x << 11 | z << 7 | y;
                dataOut[index] = XZYdata[i];
            }
        }
        return dataOut;
    }
    void method_7(std::vector<uint8_t> &byte_0, int int_3, uint8_t byte_1) {
        for (int i = 0; i < 0x80; i++) {
            byte_0[int_3 + i] = byte_1;
        }
    }

    void method_8(std::vector<uint8_t> byte_0, int int_3, std::vector<uint8_t> &byte_1, int int_4) {
        for (int i = 0; i < 0x80; i++) {
            byte_1[int_4 + i] = byte_0[int_3 + i];
        }
    }

    std::vector<uint8_t> method_9(DataInputManager memoryStream_0) {
        memoryStream_0.readInt();
        std::vector<uint8_t> array1(0x80);
        array1 = memoryStream_0.readIntoVector(0x80);
        return array1;
    }

    void method_10(DataInputManager &memoryStream_0) {
        std::vector<uint8_t> array1(0x20000);
        std::vector<uint8_t> array2(0x20000);
        this->method_12(array1, array2, 0, memoryStream_0);
        this->aquaticChunkData_0.blocks = array1;
        this->aquaticChunkData_0.submerged = array2;
    }

    bool method_11(DataInputManager memoryStream_0) {
        return true;
    }

    void method_12(std::vector<uint8_t> &byte_0, std::vector<uint8_t> &byte_1, int int_3, DataInputManager &memoryStream_0) {
        uint8_t array1[4];
        array1[3] = (uint8_t)memoryStream_0.readByte();
        array1[2] = (uint8_t)memoryStream_0.readByte();
        array1[1] = (uint8_t)memoryStream_0.readByte();
        array1[0] = 0;
        int num = ((array1[0] << 24) | (array1[1] << 16) | (array1[2] << 8) | (array1[3]));
        std::vector<uint8_t> array2(31);
        array2 = memoryStream_0.readIntoVector(31);
        std::vector<uint8_t> array3(16);
        array3 = memoryStream_0.readIntoVector(16);
        if (num == 0) {
            return;
        }
        for (int i = 0; i < 0x10; i++) {
            int num2 = num;
            if (i < 0xF && array3[i] > 0) {
                num2 = (int)array3[i] << 8;
            }
            num -= num2;
            std::vector<uint8_t> array4(0x80);
            array4 = memoryStream_0.readIntoVector(0x80);
            uint8_t* array5;
            array5 = memoryStream_0.read(num2 - 0x80);
            DataInputManager dataIn = DataInputManager(array5, num2 - 0x80);
            this->method_13(byte_0, array4, dataIn, i, byte_1);
            dataIn.~DataInputManager();
            if (num == 0) {
                return;
            }
        }
    }

    void method_13(std::vector<uint8_t> &byte_0, std::vector<uint8_t> byte_1, DataInputManager byte_2, int int_3, std::vector<uint8_t> &byte_3) {
        int num = 0;
        for (int i = 0; i < 4; i++) {
            for (int j = 0; j < 4; j++) {
                for (int k = 0; k < 4; k++) {
                    uint8_t b = byte_1[num];
                    uint8_t b2 = byte_1[num + 1];
                    int num2 = (int)(b2 & 0xF) << 0xA;
                    int int_4 = int_3 * 0x20 + k * 8 + j * 0x800 + i * 0x8000;
                    b2 = (uint8_t)(b2 >> 4);
                    if (b2 == 0) {
                        this->method_15(byte_0, int_4, b, (uint8_t)num2);
                    }
                    else {
                        int count = (int)(b * 4) + num2;
                        int count2 = this->method_26((int)b2);
                        std::vector<uint8_t> byte_4 = byte_2.readIntoVectorWithOffset(count, count2);
                        byte_2.seekStart();//the .Skip doesn't move the pointer permanently
                        this->method_17(byte_0, int_4, byte_4, byte_3);
                    }
                    num += 2;
                }
            }
        }
    }

    bool method_14(int int_3) {
        return int_3 == 2 || int_3 == 4 || int_3 == 8 || int_3 == 0x10;
    }

    void method_15(std::vector<uint8_t> &byte_0, int int_3, uint8_t byte_1, uint8_t byte_2) {
        std::vector<uint8_t> array1(0x80);
        for (int i = 0; i < 0x80; i += 2) {
            array1[i] = byte_1;
            array1[i] = byte_1;
        }
        this->method_25(byte_0, array1, int_3);
    }

    std::vector<uint8_t> method_16(std::vector<uint8_t> byte_0, uint32_t uint_0, uint32_t uint_1) {
        std::vector<uint8_t> array1(uint_1);
        int num = 0;
        while ((int64_t)num < (int64_t)((uint64_t)uint_1)) {
            array1[num] = byte_0[(int)(((uint64_t)uint_0 + (uint64_t)((int64_t)num)))];
            num++;
        }
        return array1;
    }

    void method_17(std::vector<uint8_t> &byte_0, int int_3, std::vector<uint8_t> &byte_1, std::vector<uint8_t> &byte_2) {
        int num = byte_1.size();
        if (num >= 0x100) {
            this->method_25(byte_0, byte_1, int_3);
            DataInputManager in = DataInputManager(byte_1.data(), num);
            std::vector<uint8_t> appendTodata;
            appendTodata = in.readIntoVectorWithOffset(0x80, num - 0x80);//not sure if this works right but I don't think this ever happens?
            this->method_25(byte_2, appendTodata, int_3);
            in.~DataInputManager();
            return;
        }
        if (num == 0x80) {
            this->method_25(byte_0, byte_1, int_3);
            return;
        }
        DataOutputManager dataoutputmanager = DataOutputManager();
        if (num == 0xC) {
            uint32_t num2 = 4U;
            for (int i = 0; i < 8; i++) {
                uint8_t b = byte_1[(int64_t)num2 + (int64_t)i];
                std::vector<int32_t> int_4 = this->method_18(b);
                std::vector<uint8_t> array1 = this->method_24(byte_1, int_4);
                dataoutputmanager.writeFromVector(array1);
                std::vector<int32_t> int_4_1 = this->method_18((uint8_t)(b << 4));
                std::vector<uint8_t> array2 = this->method_24(byte_1, int_4_1);
                dataoutputmanager.writeFromVector(array2);
            }
            this->method_25(byte_0, dataoutputmanager.data, int_3);
            return;
        }
        else if (num == 0x18) {
            uint32_t num3 = 8U;
            for (int j = 0; j < 8; j++) {
                uint8_t b2;
                uint8_t b3;
                b2 = byte_1[(int)((uint64_t)num3 + (uint64_t)((int64_t)j))];
                b3 = byte_1[(int)((uint64_t)num3 + (uint64_t)((int64_t)j) + 8UL)];
                for (int k = 0; k < 2; k++) {
                    std::vector<int32_t> int_5 = this->method_19(b2, b3);
                    std::vector<uint8_t> array1 = this->method_24(byte_1, int_5);
                    dataoutputmanager.writeFromVector(array1);
                    b2 = (uint8_t)(b2 << 4);
                    b3 = (uint8_t)(b3 << 4);
                }
            }
            this->method_25(byte_0, dataoutputmanager.data, int_3);
            return;
        }
        else if (num == 0x28) {
            uint32_t num4 = 0x10U;
            for (int l = 0; l < 8; l++) {
                uint8_t b4;
                uint8_t b5;
                uint8_t b6;
                b4 = byte_1[(int)(uint64_t)num4 + (uint64_t)((int64_t)l)];
                b5 = byte_1[(int)((uint64_t)num4 + (uint64_t)((int64_t)l) + 8UL)];
                b6 = byte_1[(int)((uint64_t)num4 + (uint64_t)((int64_t)l) + 0x10UL)];
                for (int m = 0; m < 2; m++) {
                    std::vector<int32_t> int_6 = this->method_20((int)b4, (int)b5, (int)b6);
                    std::vector<uint8_t> array1 = this->method_24(byte_1, int_6);
                    dataoutputmanager.writeFromVector(array1);
                    b4 = (uint8_t)(b4 << 4);
                    b5 = (uint8_t)(b5 << 4);
                    b6 = (uint8_t)(b6 << 4);
                }
            }
            this->method_25(byte_0, dataoutputmanager.data, int_3);
            return;
        }
        else if (num == 0x40) {
            uint32_t num5 = 0x20U;
            for (int n = 0; n < 8; n++) {
                uint8_t b7;
                uint8_t b8;
                uint8_t b9;
                uint8_t b10;
                b7 = byte_1[(int64_t)num5 + (int64_t)n];
                b8 = byte_1[(int64_t)num5 + (int64_t)n + 8UL];
                b9 = byte_1[(int64_t)num5 + (int64_t)n + 0x10UL];
                b10 = byte_1[(int64_t)num5 + (int64_t)n + 0x18UL];
                for (int num6 = 0; num6 < 2; num6++) {
                    std::vector<int32_t> int_7 = this->method_21(b7, b8, b9, b10);
                    std::vector<uint8_t> array1 = this->method_24(byte_1, int_7);
                    dataoutputmanager.writeFromVector(array1);
                    b7 = (uint8_t)(b7 << 4);
                    b8 = (uint8_t)(b8 << 4);
                    b9 = (uint8_t)(b9 << 4);
                    b10 = (uint8_t)(b10 << 4);
                }
            }
            this->method_25(byte_0, dataoutputmanager.data, int_3);
            return;
        }
        else if (num == 0x60) {
            uint32_t num7 = 0x20U;
            for (int num8 = 0; num8 < 0x20; num8 += 2) {
                uint8_t byte_3 = byte_1[(int64_t)num7 + (int64_t)num8];
                uint8_t byte_4 = byte_1[(int64_t)num7 + (int64_t)num8 + 1UL];
                std::vector<int32_t> int_8 = this->method_23(byte_3, byte_4);
                std::vector<uint8_t> array1 = this->method_24(byte_1, int_8);
                dataoutputmanager.writeFromVector(array1);
            }
            this->method_25(byte_0, dataoutputmanager.data, int_3);
        }
    }

    std::vector<int32_t> method_18(uint8_t byte_0) {
        std::vector<int32_t> array1(4);
        for (int i = 0; i < 4; i++) {
            int num = ((0x80 & byte_0) > 0) ? 1 : 0;
            array1[i] = num;
            byte_0 = (uint32_t)(byte_0 << 1);
        }
        return array1;
    }

    std::vector<int32_t> method_19(uint8_t byte_0, uint8_t byte_1) {
        std::vector<int32_t> array1(4);
        for (int i = 0; i < 4; i++) {
            int num = ((0x80 & byte_0) > 0) ? 1 : 0;
            num += (((0x80 & byte_1) > 0) ? 2 : 0);
            array1[i] = num;
            byte_0 = (uint8_t)(byte_0 << 1);
            byte_1 = (uint8_t)(byte_1 << 1);
        }
        return array1;
    }

    std::vector<int32_t> method_20(int int_3, int int_4, int int_5) {
        std::vector<int32_t> array1(4);
        for (int i = 0; i < 4; i++) {
            int num = ((0x80 & int_3) > 0) ? 1 : 0;
            num += (((0x80 & int_4) > 0) ? 2 : 0);
            num += (((0x80 & int_5) > 0) ? 4 : 0);
            array1[i] = num;
            int_3 = (int)((uint8_t)(int_3 << 1));
            int_4 = (int)((uint8_t)(int_4 << 1));
            int_5 = (int)((uint8_t)(int_5 << 1));
        }
        return array1;
    }

    std::vector<int32_t> method_21(uint8_t byte_0, uint8_t byte_1, uint8_t byte_2, uint8_t byte_3) {
        std::vector<int32_t> array1(4);
        for (int i = 0; i < 4; i++) {
            int num = ((0x80 & byte_0) > 0) ? 1 : 0;
            num += (((0x80 & byte_1) > 0) ? 2 : 0);
            num += (((0x80 & byte_2) > 0) ? 4 : 0);
            num += (((0x80 & byte_3) > 0) ? 8 : 0);
            array1[i] = num;
            byte_0 = (uint8_t)(byte_0 << 1);
            byte_1 = (uint8_t)(byte_1 << 1);
            byte_2 = (uint8_t)(byte_2 << 1);
            byte_3 = (uint8_t)(byte_3 << 1);
        }
        return array1;
    }

    int method_22(int int_3) {
        int num = int_3 / 0x20;
        int num2 = int_3 % 0x20;
        return num / 4 * 0x40 + num % 4 * 4 + num2 * 0x400;
    }

    std::vector<int32_t> method_23(uint8_t byte_0, uint8_t byte_1) {
        return std::vector<int32_t> {
            (int)(byte_0 & 0xF),
                byte_0 >> 4,
                (int)(byte_1 & 0xF),
                byte_1 >> 4
        };
    }

    std::vector<uint8_t> method_24(std::vector<uint8_t> byte_0, std::vector<int32_t> int_3) {
        std::vector<uint8_t> array1(8);
        for (int i = 0; i < 4; i++) {
            int num = int_3[i] * 2;
            array1[i * 2] = byte_0[num];
            array1[i * 2 + 1] = byte_0[num + 1];
        }
        return array1;
    }

    uint8_t vvbYstrOjH(uint8_t byte_0, uint8_t byte_1) { //I did not have a stroke writing this, it was the decompiler
        return (uint8_t)(byte_0 >> (int)byte_1 & 1);
    }

    void method_25(std::vector<uint8_t> &byte_0, std::vector<uint8_t> byte_1, int int_3) {
        int num = 0;
        for (int i = 0; i < 4; i++) {
            for (int j = 0; j < 4; j++) {
                for (int k = 0; k < 4; k++) {
                    int num2 = i * 0x2000 + j * 0x200 + k * 2;
                    byte_0[num2 + int_3] = byte_1[num++];
                    byte_0[num2 + int_3 + 1] = byte_1[num++];
                }
            }
        }
    }

    int method_26(int int_3) {
        int result = 0;
        if (int_3 == 2) {
            result = 0xC;
        }
        else if (int_3 == 4) {
            result = 0x18;
        }
        else if (int_3 == 6) {
            result = 0x28;
        }
        else if (int_3 == 7) {
            result = 0x40;
        }
        else if (int_3 == 8) {
            result = 0x40;
        }
        else if (int_3 == 9) {
            result = 0x60;
        }
        else if (int_3 == 0xE) {
            result = 0x80;
        }
        else if (int_3 == 0xF) {
            result = 0x100;
        }
        return result;
    }

    uint32_t method_27(uint8_t byte_0, uint8_t byte_1) {
        return (uint32_t)((byte_0 & 0xFC) / 2 + byte_1 * 0x80);
    }

    void WriteBytesToFile(char* string_0, uint8_t* byte_0, uint64_t elementCount) {
        FILE* file = fopen(string_0, "wb");
        fwrite(byte_0, 1, elementCount, file);
        fclose(file);
    }
};