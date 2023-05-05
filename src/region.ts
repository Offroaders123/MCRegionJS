import { readLocations } from "./location.js";

export async function readRegion(data: Uint8Array){
  for (const location of readLocations(data)){
    console.log(location);
  }
}