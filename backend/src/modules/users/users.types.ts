import { Role } from '../../common/enums/role.enum';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

export interface NewUserRecord {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCredentials {
  user: PublicUser;
  passwordHash: string;
}

export interface UserChanges {
  name?: string;
  email?: string;
  role?: Role;
}

export interface ListUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: Role;
}

export interface UserListOptions {
  skip: number;
  limit: number;
  search?: string;
  role?: Role;
}

export interface UserListPage {
  items: PublicUser[];
  total: number;
  page: number;
  limit: number;
}
