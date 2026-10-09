import type { User } from '@/types/auth';

export const regularUser: User = {
  id: 'user-1',
  name: 'Maria Silva',
  email: 'maria@example.com',
  role: 'USER',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const adminUser: User = { ...regularUser, id: 'admin-1', name: 'Admin', role: 'ADMIN' };
