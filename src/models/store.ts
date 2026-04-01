import type { Zone } from "./zone";

export interface Store {
  id: number;
  title: string;
  zoneId: number;
  zone?: Zone;
  openingTime: string;
  closingTime: string;
  isOpenSunday: boolean;
  minVolunteers: number;
  idealVolunteers: number;
}

export interface CreateStoreDto {
  id: number;
  title: string;
  zoneId: number;
  openingTime: string;
  closingTime: string;
  isOpenSunday: boolean;
  minVolunteers: number;
  idealVolunteers: number;
}
