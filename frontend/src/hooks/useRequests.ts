import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createRequest, getRequest, listRequests, updateRequest } from '@/api/requests';
import type { AdminRequestUpdate } from '@/types/requests';
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

const detailKey = (requestId: string) => [...REQUESTS_QUERY_KEY, 'detail', requestId] as const;

export function useRequestDetails(requestId: string) {
  return useQuery({
    queryKey: detailKey(requestId),
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

export function useUpdateRequest(requestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (update: AdminRequestUpdate) => updateRequest(requestId, update),
    onSuccess: async (updated) => {
      queryClient.setQueryData(detailKey(requestId), updated);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...REQUESTS_QUERY_KEY, 'list'] }),
        queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_QUERY_KEY }),
      ]);
    },
  });
}
