export interface UserAnswer {
  id: number;
  userId: number;
  collectionId: number;
  slotId: number | null;
  zoneId: number | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: number;
    lastName: string;
    firstName: string;
    username: string;
    birthdate: Date;
    codePostal: string;
    email: string | null;
    phoneNumber: string;
  };
  collectionUser?: {
    collectionId: number;
    userId: number;
    collection: {
      id: number;
      title: string;
    };
  };
  slot?: {
    id: number;
    startAt: Date;
    endAt: Date;
  };
  zone?: {
    id: number;
    title: string;
  };
}

export interface CreateUserAnswerDto {
  lastName: string;
  firstName: string;
  birthdate: Date;
  codePostal: string;
  phoneNumber: string;
  email?: string | null;
  collectionId: number;
  slotId?: number | null;
  zoneId?: number | null;
}

export interface UpdateUserAnswerDto {
  lastName: string;
  firstName: string;
  birthdate: Date;
  codePostal: string;
  phoneNumber: string;
  email?: string | null;
  slotId?: number | null;
  zoneId?: number | null;
}
