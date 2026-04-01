export enum UserType {
  permanent = "permanent",
  occasional = "occasional",
  newcomer = "newcomer",
}

export interface User {
  id: number;
  lastName: string;
  firstName: string;
  username: string;
  birthdate: Date;
  codePostal: string;
  email: string | null;
  phoneNumber: string;
  /** Null when isAdmin = false */
  password: string | null;
  isActive: boolean;
  isAdmin: boolean;
  type: UserType;
  collections?: Array<{
    collectionId: number;
    collection: {
      id: number;
      title: string;
      isActive: boolean;
      formUrl: string;
    };
  }>;
}

export interface CreateUserDto {
  id: number;
  lastName: string;
  firstName: string;
  birthdate: Date;
  codePostal: string;
  email?: string | null;
  phoneNumber: string;
  isActive?: boolean;
  isAdmin?: boolean;
  type: UserType;
  collectionIds?: number[];
  /** Required only if isAdmin = true */
  password?: string | null;
}
