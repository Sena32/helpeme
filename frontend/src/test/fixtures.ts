import type { User } from '@/types/auth';
import type { DashboardSummary } from '@/types/dashboard';
import type { RequestDetails, RequestListItem, RequestListPage } from '@/types/requests';

export const regularUser: User = {
  id: 'user-1',
  name: 'Maria Silva',
  email: 'maria@example.com',
  role: 'USER',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const adminUser: User = { ...regularUser, id: 'admin-1', name: 'Admin', role: 'ADMIN' };

export const listItem = (overrides: Partial<RequestListItem> = {}): RequestListItem => ({
  id: 'req-1',
  title: 'Notebook sem rede',
  categoryName: 'Infra',
  status: 'OPEN',
  priority: null,
  createdAt: '2026-03-10T15:30:00.000Z',
  ...overrides,
});

export const listPage = (
  items: RequestListItem[],
  overrides: Partial<RequestListPage> = {},
): RequestListPage => ({
  items,
  total: items.length,
  page: 1,
  limit: 10,
  ...overrides,
});

export const summary = (overrides: Partial<DashboardSummary> = {}): DashboardSummary => ({
  total: 6,
  byStatus: { OPEN: 3, IN_PROGRESS: 2, RESOLVED: 1 },
  byPriority: { HIGH: 1, MEDIUM: 2, LOW: 1, UNSET: 2 },
  byCategory: [],
  recent: [],
  ...overrides,
});

export const requestDetails = (overrides: Partial<RequestDetails> = {}): RequestDetails => ({
  id: 'req-1',
  title: 'Notebook sem rede',
  description: 'O notebook do setor financeiro não conecta na rede desde ontem pela manhã.',
  category: { id: 'cat-1', name: 'Infra' },
  createdBy: { id: 'user-1', name: 'Maria Silva' },
  status: 'OPEN',
  priority: null,
  adminNote: null,
  resolution: null,
  resolvedAt: null,
  attachments: [],
  createdAt: '2026-03-10T15:30:00.000Z',
  updatedAt: '2026-03-10T15:30:00.000Z',
  ...overrides,
});
