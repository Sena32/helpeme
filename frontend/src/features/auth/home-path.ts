import { ROLES, type Role } from '@/types/auth';

export const ADMIN_HOME_PATH = '/admin';
export const USER_HOME_PATH = '/';

export function homePathFor(role: Role): string {
  return role === ROLES.Admin ? ADMIN_HOME_PATH : USER_HOME_PATH;
}
