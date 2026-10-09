import type { DashboardSummary } from '@/types/dashboard';
import { apiRequest } from './http-client';

export function fetchDashboardSummary(signal?: AbortSignal): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>('/dashboard/summary', { signal });
}
