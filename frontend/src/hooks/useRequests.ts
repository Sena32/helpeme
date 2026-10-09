import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createRequest, getRequest, listRequests } from '@/api/requests';
import { DASHBOARD_SUMMARY_QUERY_KEY } from './useDashboard';
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

export function useCreateRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRequest,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: REQUESTS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_QUERY_KEY }),
      ]);
    },
  });
}
