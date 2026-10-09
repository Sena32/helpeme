import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Role } from '../../common/enums/role.enum';
import { Env } from '../../config/env.schema';
import { CategoriesService } from '../../modules/categories/categories.service';
import { UsersService } from '../../modules/users/users.service';

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
    await this.ensureAdminRoot();
    await this.categoriesService.ensureDefaults();
    this.logger.log('Seed applied (admin root and default categories).');
  }

  private async ensureAdminRoot(): Promise<void> {
    const email = this.config.get('ADMIN_ROOT_EMAIL', { infer: true });
    if (await this.usersService.findCredentialsByEmail(email)) return;

    await this.usersService.create({
      name: this.config.get('ADMIN_ROOT_NAME', { infer: true }),
      email,
      password: this.config.get('ADMIN_ROOT_PASSWORD', { infer: true }),
      role: Role.Admin,
    });
  }
}
