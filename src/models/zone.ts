import type { Collection } from "./collection";
import type { Store } from "./store";

export interface Zone {
  id: number;
  title: string;
  collections?: Collection[];
  stores?: Store[];
}

export interface CreateZoneDto {
  title: string;
}
