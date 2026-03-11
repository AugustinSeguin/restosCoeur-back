export enum UserType {
  permanent = "permanent",
  occasional = "occasional",
  newcomer = "newcomer",
}

export interface User {
  id: number;
  lastName: string;
  firstName: string;
  email: string | null;
  phoneNumber: string;
  /** Null when isAdmin = false */
  password: string | null;
  isActive: boolean;
  isAdmin: boolean;
  type: UserType;
}

export interface CreateUserDto {
  lastName: string;
  firstName: string;
  email?: string | null;
  phoneNumber: string;
  isActive?: boolean;
  isAdmin?: boolean;
  type: UserType;
  /** Required only if isAdmin = true */
  password?: string | null;
}
