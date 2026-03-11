import type { User } from "./user";
import type { StoreSlot } from "./storeSlot";

export interface Assignment {
  userId: number;
  storeSlotId: number;
  user?: User;
  storeSlot?: StoreSlot;
}

export interface CreateAssignmentDto {
  userId: number;
  storeSlotId: number;
}
