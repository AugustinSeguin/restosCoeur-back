import type { Store } from "./store";

export interface StoreSlot {
  id: number;
  startAt: Date;
  endAt: Date;
  storeId: number;
  store?: Store;
}

export interface CreateStoreSlotDto {
  id: number;
  startAt: Date;
  endAt: Date;
  storeId: number;
}
