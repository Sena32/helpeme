import { ROLES, type Role, type UserListQuery } from '@/types/auth';

export const USERS_PAGE_SIZE = 10;

const ROLE_VALUES: readonly Role[] = Object.values(ROLES);

function positivePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

// Canonical key order keeps API query strings (and cache keys) stable.
export function parseUserListQuery(params: URLSearchParams): UserListQuery {
  const query: UserListQuery = { page: positivePage(params.get('page')), limit: USERS_PAGE_SIZE };
  const search = params.get('search')?.trim();
  if (search) query.search = search;
  const role = ROLE_VALUES.find((value) => value === params.get('role'));
  if (role) query.role = role;
  return query;
}

export function toUserSearchParams({ page, search, role }: UserListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (page > 1) params.set('page', String(page));
  if (search) params.set('search', search);
  if (role) params.set('role', role);
  return params;
}
