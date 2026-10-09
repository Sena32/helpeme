import type { Category } from '@/types/categories';
import { apiRequest } from './http-client';

export function listCategories(signal?: AbortSignal): Promise<Category[]> {
  return apiRequest<Category[]>('/categories', { signal });
}

export function createCategory(name: string): Promise<Category> {
  return apiRequest<Category>('/categories', { method: 'POST', body: { name } });
}
