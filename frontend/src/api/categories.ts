import type { Category, CategoryWithStatus } from '@/types/categories';
import { apiRequest } from './http-client';

// API-06: active categories only, as used by every category select (RF-15).
export function listCategories(signal?: AbortSignal): Promise<Category[]> {
  return apiRequest<Category[]>('/categories', { signal });
}

// API-06 with includeInactive (admin): every category with its status, for UI-04.
export function listAllCategories(signal?: AbortSignal): Promise<CategoryWithStatus[]> {
  return apiRequest<CategoryWithStatus[]>('/categories', {
    query: { includeInactive: true },
    signal,
  });
}

export function createCategory(name: string): Promise<Category> {
  return apiRequest<Category>('/categories', { method: 'POST', body: { name } });
}

// API-15
export function deactivateCategory(categoryId: string): Promise<CategoryWithStatus> {
  return apiRequest<CategoryWithStatus>(
    `/categories/${encodeURIComponent(categoryId)}/deactivate`,
    {
      method: 'PATCH',
    },
  );
}
