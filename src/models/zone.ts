import type { Collection } from "./collection";
import type { Store } from "./store";

export interface ZoneCollectionLink {
  collectionId: number;
  zoneId: number;
  collection?: Collection;
}

export interface Zone {
  id: number;
  title: string;
  collections?: ZoneCollectionLink[];
  stores?: Store[];
}

export interface CreateZoneDto {
  title: string;
  collectionIds?: number[];
}
