import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Env } from '../../config/env.schema';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

type JwtExpiresIn = NonNullable<NonNullable<JwtModuleOptions['signOptions']>['expiresIn']>;

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): JwtModuleOptions => ({
        secret: config.get('JWT_SECRET', { infer: true }),
        signOptions: {
          // Format ("1h", "15m"…) is the `ms` syntax validated by jsonwebtoken at sign time.
          expiresIn: config.get<JwtExpiresIn>('JWT_EXPIRES_IN'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, { provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AuthModule {}
