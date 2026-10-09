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
