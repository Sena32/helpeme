import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_ROLES } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';
import { AuthenticatedRequest } from '../types/authenticated-user';

export const FORBIDDEN_MESSAGE = 'Você não tem permissão para executar esta ação.';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(REQUIRED_ROLES, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) return true;

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!user) throw new UnauthorizedException();
    if (!requiredRoles.includes(user.role)) throw new ForbiddenException(FORBIDDEN_MESSAGE);
    return true;
  }
}
