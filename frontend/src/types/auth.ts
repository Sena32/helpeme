export const ROLES = { Admin: 'ADMIN', User: 'USER' } as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  name: string;
}

export interface CreateUserInput extends RegisterInput {
  role: Role;
}
