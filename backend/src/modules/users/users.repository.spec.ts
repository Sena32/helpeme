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
});
