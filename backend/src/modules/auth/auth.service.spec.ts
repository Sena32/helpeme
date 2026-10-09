import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcryptjs';
import { Role } from '../../common/enums/role.enum';
import { UsersService } from '../users/users.service';
import { CreateUserInput, PublicUser, UserCredentials } from '../users/users.types';
import { AuthService, INVALID_CREDENTIALS_MESSAGE } from './auth.service';

const TEST_BCRYPT_ROUNDS = 4;
const PASSWORD = 'Senha123@';

const storedUser: PublicUser = {
  id: 'user-id',
  name: 'Maria Silva',
  email: 'maria@example.com',
  role: Role.User,
  createdAt: new Date(),
  updatedAt: new Date(),
};

class FakeUsersService {
  readonly createdInputs: CreateUserInput[] = [];
  constructor(private readonly credentials: UserCredentials | null = null) {}

  create(input: CreateUserInput): Promise<PublicUser> {
    this.createdInputs.push(input);
    return Promise.resolve({ ...storedUser, role: input.role ?? Role.User });
  }

  findCredentialsByEmail(): Promise<UserCredentials | null> {
    return Promise.resolve(this.credentials);
  }
}

function buildAuthService(usersService: FakeUsersService): AuthService {
  const jwtService = new JwtService({ secret: 'test-secret', signOptions: { expiresIn: '1h' } });
  return new AuthService(usersService as unknown as UsersService, jwtService);
}

describe('AuthService', () => {
  it('AC-04: registers through UsersService without ever forwarding a role', async () => {
    const usersService = new FakeUsersService();

    const session = await buildAuthService(usersService).register({
      name: 'Maria Silva',
      email: 'maria@example.com',
      password: PASSWORD,
    });

    expect(usersService.createdInputs[0]).not.toHaveProperty('role');
    expect(session.user.role).toBe(Role.User);
    expect(session.accessToken).toEqual(expect.any(String));
  });

  it('AC-05: issues a token carrying the user id and role on valid login', async () => {
    const passwordHash = await hash(PASSWORD, TEST_BCRYPT_ROUNDS);
    const service = buildAuthService(new FakeUsersService({ user: storedUser, passwordHash }));

    const session = await service.login({ email: storedUser.email, password: PASSWORD });

    const payload = new JwtService({ secret: 'test-secret' }).verify<{ sub: string; role: Role }>(
      session.accessToken,
    );
    expect(payload).toMatchObject({ sub: storedUser.id, role: Role.User });
  });

  it('AC-06: rejects a wrong password with the generic message', async () => {
    const passwordHash = await hash(PASSWORD, TEST_BCRYPT_ROUNDS);
    const service = buildAuthService(new FakeUsersService({ user: storedUser, passwordHash }));

    await expect(
      service.login({ email: storedUser.email, password: 'Errada123@' }),
    ).rejects.toThrow(new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE));
  });

  it('AC-06: rejects an unknown email with the same generic message', async () => {
    const service = buildAuthService(new FakeUsersService(null));

    await expect(service.login({ email: 'ghost@example.com', password: PASSWORD })).rejects.toThrow(
      new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE),
    );
  });
});
