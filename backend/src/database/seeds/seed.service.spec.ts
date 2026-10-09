import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { TestingModule } from '@nestjs/testing';
import { compare } from 'bcryptjs';
import { Connection, Model } from 'mongoose';
import { createTestingModuleWith } from '../../../test/create-test-app';
import { validEnv } from '../../../test/env.fixture';
import { Role } from '../../common/enums/role.enum';
import { DEFAULT_CATEGORY_NAMES } from '../../modules/categories/categories.constants';
import { Category } from '../../modules/categories/schemas/category.model';
import { User } from '../../modules/users/schemas/user.model';
import { SeedService } from './seed.service';

describe('SeedService', () => {
  let moduleRef: TestingModule;
  let seedService: SeedService;
  let userModel: Model<User>;
  let categoryModel: Model<Category>;

  beforeAll(async () => {
    moduleRef = await createTestingModuleWith();
    seedService = moduleRef.get(SeedService);
    userModel = moduleRef.get(getModelToken(User.name));
    categoryModel = moduleRef.get(getModelToken(Category.name));
  });

  afterAll(async () => {
    await moduleRef.get<Connection>(getConnectionToken()).dropDatabase();
    await moduleRef.close();
  });

  it('AC-09: running the seed twice yields 1 admin root and the 5 default categories', async () => {
    await seedService.run();
    await seedService.run();

    const admins = await userModel.find({ role: Role.Admin }).select('+passwordHash').lean();
    expect(admins).toHaveLength(1);
    expect(admins[0]).toMatchObject({
      name: validEnv.ADMIN_ROOT_NAME,
      email: validEnv.ADMIN_ROOT_EMAIL,
    });
    await expect(compare(validEnv.ADMIN_ROOT_PASSWORD, admins[0].passwordHash)).resolves.toBe(true);

    const categories = await categoryModel.find().lean();
    expect(categories.map((category) => category.name).sort()).toEqual(
      [...DEFAULT_CATEGORY_NAMES].sort(),
    );
    expect(categories.every((category) => category.isDefault)).toBe(true);
  });

  it('AC-33: seeds the configured test USER once, able to log in', async () => {
    await seedService.run();

    const testUsers = await userModel
      .find({ email: validEnv.SEED_USER_EMAIL })
      .select('+passwordHash')
      .lean();
    expect(testUsers).toHaveLength(1);
    expect(testUsers[0]).toMatchObject({ name: validEnv.SEED_USER_NAME, role: Role.User });
    await expect(compare(validEnv.SEED_USER_PASSWORD, testUsers[0].passwordHash)).resolves.toBe(
      true,
    );
  });

  it('creates the unique indexes explicitly (autoIndex is off in production)', async () => {
    await seedService.ensureIndexes();

    const userIndexes = await userModel.collection.indexes();
    const categoryIndexes = await categoryModel.collection.indexes();
    expect(userIndexes).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: { email: 1 }, unique: true })]),
    );
    expect(categoryIndexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: { name: 1 },
          unique: true,
          collation: expect.objectContaining({ locale: 'pt', strength: 2 }),
        }),
      ]),
    );
  });
});
