import { appEnv } from '@/config/env';
import type { RequestDetails, RequestListPage, RequestListQuery } from '@/types/requests';
import { apiRequest } from './http-client';

export function listRequests(
  query: RequestListQuery,
  signal?: AbortSignal,
): Promise<RequestListPage> {
  return apiRequest<RequestListPage>('/requests', { query: { ...query }, signal });
}

export async function getRequest(requestId: string, signal?: AbortSignal): Promise<RequestDetails> {
  const path = `/requests/${encodeURIComponent(requestId)}`;
  return (await apiRequest<{ request: RequestDetails }>(path, { signal })).request;
}

// Served by the protected endpoint (API-12); the session cookie travels with <img>/<a> requests.
export function attachmentUrl(requestId: string, attachmentId: string): string {
  return `${appEnv.apiBaseUrl}/requests/${encodeURIComponent(requestId)}/attachments/${encodeURIComponent(attachmentId)}`;
}
