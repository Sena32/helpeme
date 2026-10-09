import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { PublicUser } from '../users/users.types';
import { AccessTokenPayload, AuthSession, LoginInput, RegisterInput } from './auth.types';

export const INVALID_CREDENTIALS_MESSAGE = 'E-mail ou senha inválidos.';
const MILLISECONDS_PER_SECOND = 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register({ name, email, password }: RegisterInput): Promise<AuthSession> {
    const user = await this.usersService.create({ name, email, password });
    return this.createSession(user);
  }

  async login({ email, password }: LoginInput): Promise<AuthSession> {
    const credentials = await this.usersService.findCredentialsByEmail(email);
    const passwordMatches =
      credentials !== null && (await compare(password, credentials.passwordHash));
    if (!credentials || !passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }
    return this.createSession(credentials.user);
  }

  private async createSession(user: PublicUser): Promise<AuthSession> {
    const payload: AccessTokenPayload = { sub: user.id, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);
    const { exp } = this.jwtService.decode<{ exp: number }>(accessToken);
    return { user, accessToken, expiresAt: new Date(exp * MILLISECONDS_PER_SECOND) };
  }
}
