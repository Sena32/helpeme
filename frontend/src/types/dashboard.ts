import type { Priority, PriorityFilter, RequestListItem, RequestStatus } from './requests';

export interface CategoryCount {
  categoryId: string;
  name: string;
  count: number;
}

export interface DashboardSummary {
  total: number;
  byStatus: Record<RequestStatus, number>;
  byPriority: Record<Priority | Extract<PriorityFilter, 'UNSET'>, number>;
  byCategory: CategoryCount[];
  recent: RequestListItem[];
}
