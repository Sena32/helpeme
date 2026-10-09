import { Priority } from '../../common/enums/priority.enum';
import { RequestStatus } from '../../common/enums/request-status.enum';

export const REQUEST_SORT_FIELDS = ['priority', 'createdAt'] as const;
export const SORT_ORDERS = ['asc', 'desc'] as const;
export const UNSET_PRIORITY_FILTER = 'UNSET';

export type RequestSortField = (typeof REQUEST_SORT_FIELDS)[number];
export type SortOrder = (typeof SORT_ORDERS)[number];
export type PriorityFilter = Priority | typeof UNSET_PRIORITY_FILTER;
type SortDirection = 1 | -1;

export interface ListRequestsQuery {
  page?: number;
  limit?: number;
  sortBy?: RequestSortField;
  order?: SortOrder;
  status?: RequestStatus;
  categoryId?: string;
  priority?: PriorityFilter;
  search?: string;
}

export interface RequestFilter {
  createdBy?: string;
  status?: RequestStatus;
  category?: string;
  priority?: Priority | null;
  title?: { $regex: string; $options: 'i' };
}

export type RequestSort = Record<'createdAt' | '_id', SortDirection> & {
  priorityRank?: SortDirection;
};

const NEWEST_FIRST: SortDirection = -1;

export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// RF-08: default is priority desc then newest; _id keeps pagination stable on equal dates.
export function buildRequestSort({
  sortBy = 'priority',
  order = 'desc',
}: ListRequestsQuery): RequestSort {
  const direction: SortDirection = order === 'asc' ? 1 : -1;
  if (sortBy === 'createdAt') return { createdAt: direction, _id: direction };
  return { priorityRank: direction, createdAt: NEWEST_FIRST, _id: NEWEST_FIRST };
}

export function buildRequestFilter(
  { status, categoryId, priority, search }: ListRequestsQuery,
  scope: { ownerId?: string },
): RequestFilter {
  const filter: RequestFilter = {};
  if (scope.ownerId) filter.createdBy = scope.ownerId;
  if (status) filter.status = status;
  if (categoryId) filter.category = categoryId;
  if (priority) filter.priority = priority === UNSET_PRIORITY_FILTER ? null : priority;
  if (search) filter.title = { $regex: escapeRegExp(search), $options: 'i' };
  return filter;
}
