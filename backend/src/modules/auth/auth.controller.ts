import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CookieOptions, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { Env } from '../../config/env.schema';
import { UsersService } from '../users/users.service';
import { PublicUser } from '../users/users.types';
import { ACCESS_TOKEN_COOKIE, UNAUTHENTICATED_MESSAGE } from './auth.constants';
import { AuthService } from './auth.service';
import { AuthSession } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

type UserResponse = { user: PublicUser };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('register')
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserResponse> {
    const session = await this.authService.register(body);
    return this.startSession(response, session);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserResponse> {
    const session = await this.authService.login(body);
    return this.startSession(response, session);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(ACCESS_TOKEN_COOKIE, this.baseCookieOptions());
  }

  @Get('me')
  async me(@CurrentUser() currentUser: AuthenticatedUser): Promise<UserResponse> {
    const user = await this.usersService.findById(currentUser.id);
    // A valid token whose user no longer exists is treated as an invalid session.
    if (!user) throw new UnauthorizedException(UNAUTHENTICATED_MESSAGE);
    return { user };
  }

  private startSession(response: Response, session: AuthSession): UserResponse {
    response.cookie(ACCESS_TOKEN_COOKIE, session.accessToken, {
      ...this.baseCookieOptions(),
      expires: session.expiresAt,
    });
    return { user: session.user };
  }

  private baseCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get('COOKIE_SECURE', { infer: true }),
      path: '/',
    };
  }
}
