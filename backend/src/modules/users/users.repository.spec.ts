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
});
