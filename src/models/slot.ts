import type { Collection } from "./collection";

export interface Slot {
  id: number;
  startAt: Date;
  endAt: Date;
  collectionId: number;
  collection?: Collection;
}

export interface CreateSlotDto {
  id: number;
  startAt: Date;
  endAt: Date;
  collectionId: number;
}
