// Mirrors docs/specs/04-data-model.md and 05-api-contract.md.
export const REQUEST_STATUSES = {
  Open: 'OPEN',
  InProgress: 'IN_PROGRESS',
  Resolved: 'RESOLVED',
} as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[keyof typeof REQUEST_STATUSES];

export const PRIORITIES = { High: 'HIGH', Medium: 'MEDIUM', Low: 'LOW' } as const;
export type Priority = (typeof PRIORITIES)[keyof typeof PRIORITIES];
export const UNSET_PRIORITY = 'UNSET';
export type PriorityFilter = Priority | typeof UNSET_PRIORITY;

export interface NamedReference {
  id: string;
  name: string;
}

export interface Attachment {
  id: string;
  originalName: string;
  mimeType: 'image/jpeg' | 'image/png';
  sizeBytes: number;
}

export interface RequestDetails {
  id: string;
  title: string;
  description: string;
  category: NamedReference;
  createdBy: NamedReference;
  status: RequestStatus;
  priority: Priority | null;
  adminNote: string | null;
  resolution: string | null;
  resolvedAt: string | null;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface RequestListItem {
  id: string;
  title: string;
  categoryName: string;
  status: RequestStatus;
  priority: Priority | null;
  createdAt: string;
  createdBy?: { name: string };
}

export interface RequestListPage {
  items: RequestListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface RequestListQuery {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'priority';
  order?: 'asc' | 'desc';
  status?: RequestStatus;
  categoryId?: string;
  priority?: PriorityFilter;
  search?: string;
}

export interface AdminRequestUpdate {
  priority?: Priority;
  status?: RequestStatus;
  adminNote?: string;
  resolution?: string;
}

export interface CreateRequestInput {
  title: string;
  categoryId: string;
  description: string;
  files: File[];
}
