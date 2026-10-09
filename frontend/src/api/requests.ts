import { appEnv } from '@/config/env';
import type {
  AdminRequestUpdate,
  CreateRequestInput,
  RequestDetails,
  RequestListPage,
  RequestListQuery,
} from '@/types/requests';
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

export const ATTACHMENTS_FIELD = 'files';

export async function createRequest({
  files,
  ...fields
}: CreateRequestInput): Promise<RequestDetails> {
  const formData = new FormData();
  for (const [name, value] of Object.entries(fields)) formData.append(name, value);
  for (const file of files) formData.append(ATTACHMENTS_FIELD, file, file.name);
  return (
    await apiRequest<{ request: RequestDetails }>('/requests', { method: 'POST', body: formData })
  ).request;
}

export async function updateRequest(
  requestId: string,
  update: AdminRequestUpdate,
): Promise<RequestDetails> {
  const path = `/requests/${encodeURIComponent(requestId)}`;
  return (await apiRequest<{ request: RequestDetails }>(path, { method: 'PATCH', body: update }))
    .request;
}
