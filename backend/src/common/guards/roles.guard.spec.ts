import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { AuthenticatedUser } from '../types/authenticated-user';
import { RolesGuard } from './roles.guard';

function contextFor(user: AuthenticatedUser | undefined): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function guardRequiring(roles: Role[] | undefined): RolesGuard {
  const reflector = { getAllAndOverride: () => roles } as unknown as Reflector;
  return new RolesGuard(reflector);
}

const admin: AuthenticatedUser = { id: 'admin-id', role: Role.Admin };
const regularUser: AuthenticatedUser = { id: 'user-id', role: Role.User };

describe('RolesGuard', () => {
  it('allows any request when the route declares no roles', () => {
    expect(guardRequiring(undefined).canActivate(contextFor(regularUser))).toBe(true);
  });

  it('AC-07: allows a user whose role is required', () => {
    expect(guardRequiring([Role.Admin]).canActivate(contextFor(admin))).toBe(true);
  });

  it('AC-08: forbids a user without the required role', () => {
    expect(() => guardRequiring([Role.Admin]).canActivate(contextFor(regularUser))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects an unauthenticated request on a role-protected route', () => {
    expect(() => guardRequiring([Role.Admin]).canActivate(contextFor(undefined))).toThrow(
      UnauthorizedException,
    );
  });
});
