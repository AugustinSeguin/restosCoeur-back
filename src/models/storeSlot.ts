import type { Store } from "./store";

export interface StoreSlot {
  id: number;
  startAt: Date;
  endAt: Date;
  storeId: number;
  store?: Store;
}

export interface CreateStoreSlotDto {
  startAt: Date;
  endAt: Date;
  storeId: number;
}
