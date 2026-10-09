import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const REQUIRED_ROLES = 'requiredRoles';

export const Roles = (...roles: Role[]) => SetMetadata(REQUIRED_ROLES, roles);
