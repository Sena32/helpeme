import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getRequest, listRequests } from '@/api/requests';
import type { RequestListQuery } from '@/types/requests';

export const REQUESTS_QUERY_KEY = ['requests'] as const;

export function useRequestList(query: RequestListQuery) {
  return useQuery({
    queryKey: [...REQUESTS_QUERY_KEY, 'list', query],
    queryFn: ({ signal }) => listRequests(query, signal),
    placeholderData: keepPreviousData,
  });
}

export function useRequestDetails(requestId: string) {
  return useQuery({
    queryKey: [...REQUESTS_QUERY_KEY, 'detail', requestId],
    queryFn: ({ signal }) => getRequest(requestId, signal),
  });
}
