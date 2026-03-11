import type { Zone } from "./zone";
import type { StoreSlot } from "./storeSlot";

export interface Store {
  id: number;
  title: string;
  zoneId: number;
  zone?: Zone;
  minVolunteers: number;
  idealVolunteers: number;
  slots?: StoreSlot[];
}

export interface CreateStoreDto {
  id: number;
  title: string;
  zoneId: number;
  minVolunteers: number;
  idealVolunteers: number;
}
