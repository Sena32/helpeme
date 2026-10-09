import { Priority } from '../../common/enums/priority.enum';
import { RequestStatus } from '../../common/enums/request-status.enum';
import { UNSET_PRIORITY_FILTER } from '../requests/request-list-query';
import { RequestListItem } from '../requests/requests.types';

export type PriorityCountKey = Priority | typeof UNSET_PRIORITY_FILTER;

export interface CategoryCount {
  categoryId: string;
  name: string;
  count: number;
}

export interface DashboardCounts {
  total: number;
  byStatus: Record<RequestStatus, number>;
  byPriority: Record<PriorityCountKey, number>;
  byCategory: CategoryCount[];
}

export interface DashboardSummary extends DashboardCounts {
  recent: RequestListItem[];
}
