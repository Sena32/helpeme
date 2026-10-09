import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Env } from '../config/env.schema';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        uri: config.get('MONGODB_URI', { infer: true }),
        // Production indexes are created explicitly (seed/migration), never on app boot.
        autoIndex: config.get('NODE_ENV', { infer: true }) !== 'production',
      }),
    }),
  ],
})
export class DatabaseModule {}
