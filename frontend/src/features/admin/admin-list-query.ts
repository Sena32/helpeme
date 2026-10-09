import {
  PRIORITIES,
  REQUEST_STATUSES,
  UNSET_PRIORITY,
  type PriorityFilter,
  type RequestListQuery,
  type RequestStatus,
} from '@/types/requests';

export const ADMIN_PAGE_SIZE = 10;
export const DEFAULT_ADMIN_QUERY: RequestListQuery = { page: 1, limit: ADMIN_PAGE_SIZE };

const SORT_FIELDS = ['createdAt', 'priority'] as const;
const SORT_ORDERS = ['asc', 'desc'] as const;
const STATUS_VALUES: readonly RequestStatus[] = Object.values(REQUEST_STATUSES);
const PRIORITY_VALUES: readonly PriorityFilter[] = [...Object.values(PRIORITIES), UNSET_PRIORITY];

function oneOf<T extends string>(allowed: readonly T[], value: string | null): T | undefined {
  return allowed.find((option) => option === value);
}

function positivePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

// Canonical key order keeps API query strings (and cache keys) stable.
export function parseAdminListQuery(params: URLSearchParams): RequestListQuery {
  const query: RequestListQuery = {
    page: positivePage(params.get('page')),
    limit: ADMIN_PAGE_SIZE,
  };
  const sortBy = oneOf(SORT_FIELDS, params.get('sortBy'));
  const order = oneOf(SORT_ORDERS, params.get('order'));
  if (sortBy && order) Object.assign(query, { sortBy, order });
  const status = oneOf(STATUS_VALUES, params.get('status'));
  if (status) query.status = status;
  const categoryId = params.get('categoryId');
  if (categoryId) query.categoryId = categoryId;
  const priority = oneOf(PRIORITY_VALUES, params.get('priority'));
  if (priority) query.priority = priority;
  const search = params.get('search')?.trim();
  if (search) query.search = search;
  return query;
}

export function toAdminSearchParams({
  page,
  limit,
  ...filters
}: RequestListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (page && page > 1) params.set('page', String(page));
  for (const [name, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(name, String(value));
  }
  return params;
}
