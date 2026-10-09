import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { TestingModule } from '@nestjs/testing';
import { Connection, Model } from 'mongoose';
import { createTestingModuleWith } from '../../../test/create-test-app';
import { Role } from '../../common/enums/role.enum';
import { User } from '../../modules/users/schemas/user.model';
import { SeedService } from './seed.service';

describe('SeedService without SEED_USER_* (AC-33)', () => {
  let moduleRef: TestingModule;

  beforeAll(async () => {
    delete process.env.SEED_USER_NAME;
    delete process.env.SEED_USER_EMAIL;
    delete process.env.SEED_USER_PASSWORD;
    moduleRef = await createTestingModuleWith();
  });

  afterAll(async () => {
    await moduleRef.get<Connection>(getConnectionToken()).dropDatabase();
    await moduleRef.close();
  });

  it('seeds only the admin root, no test user', async () => {
    await moduleRef.get(SeedService).run();

    const users = await moduleRef.get<Model<User>>(getModelToken(User.name)).find().lean();
    expect(users.map((user) => user.role)).toEqual([Role.Admin]);
  });
});
