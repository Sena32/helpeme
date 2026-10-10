import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare } from 'bcryptjs';
import { Role } from '../../common/enums/role.enum';
import { Env } from '../../config/env.schema';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { NewUserRecord, PublicUser, UserChanges, UserListOptions } from './users.types';

class FakeUsersRepository implements Pick<
  UsersRepository,
  'existsByEmail' | 'create' | 'findById' | 'update' | 'list'
> {
  readonly created: NewUserRecord[] = [];
  readonly updates: { userId: string; changes: UserChanges }[] = [];
  readonly listCalls: UserListOptions[] = [];
  constructor(
    private readonly existingEmails: string[] = [],
    private readonly stored: PublicUser[] = [],
  ) {}

  findById(id: string): Promise<PublicUser | null> {
    return Promise.resolve(this.stored.find((user) => user.id === id) ?? null);
  }

  update(userId: string, changes: UserChanges): Promise<PublicUser | null> {
    this.updates.push({ userId, changes });
    const current = this.stored.find((user) => user.id === userId);
    return Promise.resolve(current ? { ...current, ...changes } : null);
  }

  list(options: UserListOptions): Promise<{ items: PublicUser[]; total: number }> {
    this.listCalls.push(options);
    return Promise.resolve({ items: this.stored, total: this.stored.length });
  }

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

const TEST_PAGINATION_MAX_LIMIT = 50;
const testConfig: Partial<Env> = {
  BCRYPT_ROUNDS: TEST_BCRYPT_ROUNDS,
  PAGINATION_MAX_LIMIT: TEST_PAGINATION_MAX_LIMIT,
};

function buildService(repository: FakeUsersRepository): UsersService {
  const config = {
    get: (key: keyof Env) => testConfig[key],
  } as unknown as ConfigService<Env, true>;
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

const storedUser = (id: string, role: Role): PublicUser => ({
  id,
  name: `Usuário ${id}`,
  email: `${id}@example.com`,
  role,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
});

const ADMIN_ID = 'admin-id';
const OTHER_ID = 'other-id';
const actingAdmin = { id: ADMIN_ID, role: Role.Admin };

describe('UsersService.list (RF-16)', () => {
  it('defaults to page 1 with 10 items, newest first', async () => {
    const repository = new FakeUsersRepository([], [storedUser(OTHER_ID, Role.User)]);

    const page = await buildService(repository).list({});

    expect(page).toMatchObject({ page: 1, limit: 10, total: 1 });
    expect(repository.listCalls).toEqual([
      { skip: 0, limit: 10, search: undefined, role: undefined },
    ]);
  });

  it('caps the page size at PAGINATION_MAX_LIMIT and passes the filters on', async () => {
    const repository = new FakeUsersRepository();

    const page = await buildService(repository).list({
      page: 3,
      limit: 500,
      search: 'ana',
      role: Role.Admin,
    });

    expect(page.limit).toBe(TEST_PAGINATION_MAX_LIMIT);
    expect(repository.listCalls).toEqual([
      {
        skip: 2 * TEST_PAGINATION_MAX_LIMIT,
        limit: TEST_PAGINATION_MAX_LIMIT,
        search: 'ana',
        role: Role.Admin,
      },
    ]);
  });
});

describe('UsersService.update (RF-17, RN-14)', () => {
  const buildRepository = () =>
    new FakeUsersRepository(
      [],
      [storedUser(ADMIN_ID, Role.Admin), storedUser(OTHER_ID, Role.User)],
    );

  it('normalizes name and e-mail before saving', async () => {
    const repository = buildRepository();

    const user = await buildService(repository).update(
      OTHER_ID,
      { name: '  Ana  ', email: ' Ana@Example.COM ', role: Role.Admin },
      actingAdmin,
    );

    expect(repository.updates).toEqual([
      { userId: OTHER_ID, changes: { name: 'Ana', email: 'ana@example.com', role: Role.Admin } },
    ]);
    expect(user).toMatchObject({ name: 'Ana', email: 'ana@example.com', role: Role.Admin });
  });

  it('rejects an update without any field (400)', async () => {
    const repository = buildRepository();

    await expect(buildService(repository).update(OTHER_ID, {}, actingAdmin)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.updates).toHaveLength(0);
  });

  it('answers 404 for an unknown user', async () => {
    await expect(
      buildService(buildRepository()).update('missing', { name: 'Ana' }, actingAdmin),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('AC-44: forbids an admin from changing their own role (409)', async () => {
    const repository = buildRepository();

    await expect(
      buildService(repository).update(ADMIN_ID, { role: Role.User }, actingAdmin),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.updates).toHaveLength(0);
  });

  it('lets an admin resend their own current role along with other changes', async () => {
    const repository = buildRepository();

    const user = await buildService(repository).update(
      ADMIN_ID,
      { name: 'Admin Root', role: Role.Admin },
      actingAdmin,
    );

    expect(user.name).toBe('Admin Root');
  });
});
