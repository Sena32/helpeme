import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthenticatedRequest, AuthenticatedUser } from '../types/authenticated-user';

export const CurrentUser = createParamDecorator(
  (_property: unknown, context: ExecutionContext): AuthenticatedUser => {
    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!user) throw new UnauthorizedException();
    return user;
  },
);
