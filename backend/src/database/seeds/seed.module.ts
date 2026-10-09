import { Module } from '@nestjs/common';
import { CategoriesModule } from '../../modules/categories/categories.module';
import { UsersModule } from '../../modules/users/users.module';
import { SeedService } from './seed.service';

@Module({
  imports: [UsersModule, CategoriesModule],
  providers: [SeedService],
})
export class SeedModule {}
