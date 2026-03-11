export interface UserAnswer {
  id: number;
  userId: number;
  collecteId: number;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: number;
    lastName: string;
    firstName: string;
    email: string | null;
    phoneNumber: string;
  };
  collection?: {
    id: number;
    title: string;
  };
  storeSlots?: Array<{
    id: number;
    startAt: Date;
    endAt: Date;
  }>;
}

export interface CreateUserAnswerDto {
  lastName: string;
  firstName: string;
  phoneNumber: string;
  email?: string | null;
  collecteId: number;
  storeSlotIds?: number[];
}

export interface UpdateUserAnswerDto {
  lastName: string;
  firstName: string;
  phoneNumber: string;
  email?: string | null;
  storeSlotIds?: number[];
}
