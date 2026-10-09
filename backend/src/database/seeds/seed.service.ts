import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Role } from '../../common/enums/role.enum';
import { Env } from '../../config/env.schema';
import { CategoriesService } from '../../modules/categories/categories.service';
import { UsersService } from '../../modules/users/users.service';

interface SeedAccount {
  name: string;
  email: string;
  password: string;
}

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly usersService: UsersService,
    private readonly categoriesService: CategoriesService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.ensureIndexes();
    if (this.config.get('RUN_SEED', { infer: true })) await this.run();
  }

  // autoIndex is off in production, so unique indexes are created explicitly (Q-15).
  async ensureIndexes(): Promise<void> {
    await Promise.all(Object.values(this.connection.models).map((model) => model.createIndexes()));
  }

  async run(): Promise<void> {
    await this.ensureUser(this.adminRootAccount(), Role.Admin);
    const testUser = this.testUserAccount();
    if (testUser) await this.ensureUser(testUser, Role.User);
    await this.categoriesService.ensureDefaults();
    this.logger.log('Seed applied (admin root, test user when configured, default categories).');
  }

  private adminRootAccount(): SeedAccount {
    return {
      name: this.config.get('ADMIN_ROOT_NAME', { infer: true }),
      email: this.config.get('ADMIN_ROOT_EMAIL', { infer: true }),
      password: this.config.get('ADMIN_ROOT_PASSWORD', { infer: true }),
    };
  }

  // Optional (AC-33): env validation guarantees the three variables come together.
  private testUserAccount(): SeedAccount | null {
    const name = this.config.get('SEED_USER_NAME', { infer: true });
    const email = this.config.get('SEED_USER_EMAIL', { infer: true });
    const password = this.config.get('SEED_USER_PASSWORD', { infer: true });
    return name && email && password ? { name, email, password } : null;
  }

  // Idempotent: an existing account with the same email is left untouched.
  private async ensureUser(account: SeedAccount, role: Role): Promise<void> {
    if (await this.usersService.findCredentialsByEmail(account.email)) return;
    await this.usersService.create({ ...account, role });
  }
}
