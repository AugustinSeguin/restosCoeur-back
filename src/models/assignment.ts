import type { User } from "./user";
import type { Slot } from "./slot";
import type { Store } from "./store";
import type { Collection } from "./collection";

export interface Assignment {
  userId: number;
  slotId: number;
  storeId: number;
  collectionId: number;
  user?: User;
  slot?: Slot;
  store?: Store;
  collection?: Collection;
}

export interface CreateAssignmentDto {
  userId: number;
  slotId: number;
  storeId: number;
  collectionId: number;
}
