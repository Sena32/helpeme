import { BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare } from 'bcryptjs';
import { Role } from '../../common/enums/role.enum';
import { Env } from '../../config/env.schema';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { NewUserRecord, PublicUser } from './users.types';

class FakeUsersRepository implements Pick<UsersRepository, 'existsByEmail' | 'create'> {
  readonly created: NewUserRecord[] = [];
  constructor(private readonly existingEmails: string[] = []) {}

  existsByEmail(email: string): Promise<boolean> {
    return Promise.resolve(this.existingEmails.includes(email));
  }

  create(record: NewUserRecord): Promise<PublicUser> {
    this.created.push(record);
    const timestamp = new Date();
    return Promise.resolve({
      id: 'user-id',
      name: record.name,
      email: record.email,
      role: record.role,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }
}

const TEST_BCRYPT_ROUNDS = 4;

function buildService(repository: FakeUsersRepository): UsersService {
  const config = { get: () => TEST_BCRYPT_ROUNDS } as unknown as ConfigService<Env, true>;
  return new UsersService(repository as unknown as UsersRepository, config);
}

const validInput = { name: '  Maria Silva ', email: ' Maria@Example.com ', password: 'Senha123@' };

describe('UsersService.create', () => {
  it('stores a bcrypt hash instead of the plain password', async () => {
    const repository = new FakeUsersRepository();

    await buildService(repository).create(validInput);

    const [stored] = repository.created;
    expect(stored.passwordHash).not.toBe(validInput.password);
    await expect(compare(validInput.password, stored.passwordHash)).resolves.toBe(true);
  });

  it('normalizes name and email and defaults role to USER', async () => {
    const repository = new FakeUsersRepository();

    const user = await buildService(repository).create(validInput);

    expect(user).toMatchObject({
      name: 'Maria Silva',
      email: 'maria@example.com',
      role: Role.User,
    });
  });

  it('creates an admin when the role is explicitly given', async () => {
    const user = await buildService(new FakeUsersRepository()).create({
      ...validInput,
      role: Role.Admin,
    });

    expect(user.role).toBe(Role.Admin);
  });

  it('never exposes the password hash', async () => {
    const user = await buildService(new FakeUsersRepository()).create(validInput);

    expect(user).not.toHaveProperty('passwordHash');
  });

  it('rejects a weak password (RN-02)', async () => {
    const repository = new FakeUsersRepository();

    await expect(
      buildService(repository).create({ ...validInput, password: 'fraca' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.created).toHaveLength(0);
  });

  it('rejects an email already registered, ignoring case (RN-01)', async () => {
    const repository = new FakeUsersRepository(['maria@example.com']);

    await expect(buildService(repository).create(validInput)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repository.created).toHaveLength(0);
  });
});
