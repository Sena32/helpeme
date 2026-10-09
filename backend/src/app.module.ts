import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { validateEnv } from './config/env.schema';
import { buildLoggerParams } from './config/logger.config';
import { buildThrottlerOptions } from './config/throttler.config';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';

// Local runs share the monorepo root .env; in Docker the variables come from env_file.
const ROOT_ENV_FILE = '../.env';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ROOT_ENV_FILE, validate: validateEnv }),
    LoggerModule.forRootAsync({ inject: [ConfigService], useFactory: buildLoggerParams }),
    ThrottlerModule.forRootAsync({ inject: [ConfigService], useFactory: buildThrottlerOptions }),
    DatabaseModule,
    AuthModule,
    HealthModule,
    UsersModule,
  ],
})
export class AppModule {}
