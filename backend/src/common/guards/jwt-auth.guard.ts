import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ACCESS_TOKEN_COOKIE, UNAUTHENTICATED_MESSAGE } from '../../modules/auth/auth.constants';
import { AccessTokenPayload } from '../../modules/auth/auth.types';
import { IS_PUBLIC_ROUTE } from '../decorators/public.decorator';
import { AuthenticatedRequest } from '../types/authenticated-user';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.isPublicRoute(context)) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token: unknown = request.cookies?.[ACCESS_TOKEN_COOKIE];
    if (typeof token !== 'string') throw new UnauthorizedException(UNAUTHENTICATED_MESSAGE);

    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token);
      request.user = { id: payload.sub, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedException(UNAUTHENTICATED_MESSAGE);
    }
  }

  private isPublicRoute(context: ExecutionContext): boolean {
    return this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ROUTE, [
      context.getHandler(),
      context.getClass(),
    ]);
  }
}
