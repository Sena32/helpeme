import { ConflictException } from '@nestjs/common';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { isolatedDatabaseName } from '../../../test/mongo-test-db';
import { Role } from '../../common/enums/role.enum';
import { User, UserSchema } from './schemas/user.model';
import { UsersRepository } from './users.repository';

const newUserRecord = {
  name: 'Maria Silva',
  email: 'maria@example.com',
  passwordHash: 'hashed-password',
  role: Role.User,
};

describe('UsersRepository', () => {
  let moduleRef: TestingModule;
  let repository: UsersRepository;
  let userModel: Model<User>;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(process.env.MONGODB_URI ?? '', { dbName: isolatedDatabaseName() }),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
      ],
      providers: [UsersRepository],
    }).compile();
    repository = moduleRef.get(UsersRepository);
    userModel = moduleRef.get(getModelToken(User.name));
    await userModel.syncIndexes();
  });

  afterEach(async () => {
    await userModel.deleteMany({});
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('stores users in the users collection', () => {
    expect(userModel.collection.collectionName).toBe('users');
  });

  it('creates a user and returns it without the password hash', async () => {
    const user = await repository.create(newUserRecord);

    expect(user).toMatchObject({
      name: 'Maria Silva',
      email: 'maria@example.com',
      role: Role.User,
    });
    expect(user.id).toEqual(expect.any(String));
    expect(user).not.toHaveProperty('passwordHash');
  });

  it('does not select the password hash by default', async () => {
    await repository.create(newUserRecord);

    const stored = await userModel.findOne({ email: newUserRecord.email }).lean();

    expect(stored).not.toHaveProperty('passwordHash');
  });

  it('lowercases the email on save (RN-01)', async () => {
    await repository.create({ ...newUserRecord, email: 'MARIA@Example.COM' });

    await expect(repository.existsByEmail('maria@example.com')).resolves.toBe(true);
  });

  it('reports a missing email as not existing', async () => {
    await expect(repository.existsByEmail('ghost@example.com')).resolves.toBe(false);
  });

  it('turns a duplicate email race into a conflict (RN-01)', async () => {
    await repository.create(newUserRecord);

    await expect(repository.create(newUserRecord)).rejects.toBeInstanceOf(ConflictException);
  });

  it('finds credentials by email ignoring case, including the password hash', async () => {
    const created = await repository.create(newUserRecord);

    const credentials = await repository.findCredentialsByEmail(' MARIA@example.com ');

    expect(credentials).toEqual({ user: created, passwordHash: newUserRecord.passwordHash });
  });

  it('returns null credentials for an unknown email', async () => {
    await expect(repository.findCredentialsByEmail('ghost@example.com')).resolves.toBeNull();
  });

  it('finds a public user by id', async () => {
    const created = await repository.create(newUserRecord);

    await expect(repository.findById(created.id)).resolves.toEqual(created);
  });

  it('returns null for an unknown or malformed id', async () => {
    await expect(repository.findById('64b7f0c2a1b2c3d4e5f60718')).resolves.toBeNull();
    await expect(repository.findById('not-an-object-id')).resolves.toBeNull();
  });

  describe('list (API-16)', () => {
    it('treats the search as literal text, not a regular expression', async () => {
      await repository.create({ ...newUserRecord, name: 'Ana (TI)', email: 'ana@example.com' });
      await repository.create({
        ...newUserRecord,
        name: 'Anderson',
        email: 'anderson@example.com',
      });

      const { items, total } = await repository.list({ skip: 0, limit: 10, search: '(ti)' });

      expect(total).toBe(1);
      expect(items.map((user) => user.name)).toEqual(['Ana (TI)']);
    });

    it('has an index for the newest-first listing', async () => {
      const indexes = await userModel.collection.indexes();

      expect(indexes.map((index) => index.key)).toContainEqual({ createdAt: -1, _id: -1 });
    });
  });

  describe('update (API-17)', () => {
    it('keeps the password hash and returns the public user', async () => {
      const user = await repository.create(newUserRecord);

      const updated = await repository.update(user.id, { name: 'Maria Souza', role: Role.Admin });

      expect(updated).toMatchObject({ name: 'Maria Souza', role: Role.Admin });
      expect(updated).not.toHaveProperty('passwordHash');
      const stored = await userModel.findById(user.id).select('+passwordHash').lean();
      expect(stored?.passwordHash).toBe(newUserRecord.passwordHash);
    });

    it("throws ConflictException for another user's e-mail (RN-01)", async () => {
      await repository.create(newUserRecord);
      const other = await repository.create({ ...newUserRecord, email: 'joao@example.com' });

      await expect(
        repository.update(other.id, { email: newUserRecord.email }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('returns null for unknown or malformed ids', async () => {
      await expect(
        repository.update('0123456789abcdef01234567', { name: 'X Y' }),
      ).resolves.toBeNull();
      await expect(repository.update('not-an-id', { name: 'X Y' })).resolves.toBeNull();
    });
  });
});
