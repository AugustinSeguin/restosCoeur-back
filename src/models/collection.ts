import type { Zone } from "./zone";

export interface Collection {
  id: number;
  title: string;
  isActive: boolean;
  formUrl: string;
  zones?: Zone[];
}

export interface CreateCollectionDto {
  title: string;
  isActive?: boolean;
  formUrl: string;
}
