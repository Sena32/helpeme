import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { validateEnv } from './config/env.schema';
import { buildLoggerParams } from './config/logger.config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';

// Local runs share the monorepo root .env; in Docker the variables come from env_file.
const ROOT_ENV_FILE = '../.env';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ROOT_ENV_FILE, validate: validateEnv }),
    LoggerModule.forRootAsync({ inject: [ConfigService], useFactory: buildLoggerParams }),
    DatabaseModule,
    HealthModule,
    UsersModule,
  ],
})
export class AppModule {}
