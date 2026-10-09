import { Role } from '../../common/enums/role.enum';
import { PublicUser } from '../users/users.types';

export interface AccessTokenPayload {
  sub: string;
  role: Role;
}

export interface AuthSession {
  user: PublicUser;
  accessToken: string;
  expiresAt: Date;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  name: string;
}
