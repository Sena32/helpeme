import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { isApiError } from '@/api/http-client';
import { CURRENT_USER_QUERY_KEY } from './query-keys';

const UNAUTHORIZED_STATUS = 401;
const MAX_RETRIES = 2;
const CLIENT_ERROR_MIN = 400;
const SERVER_ERROR_MIN = 500;

function shouldRetry(failureCount: number, error: unknown): boolean {
  const isClientError =
    isApiError(error) &&
    error.statusCode >= CLIENT_ERROR_MIN &&
    error.statusCode < SERVER_ERROR_MIN;
  return !isClientError && failureCount < MAX_RETRIES;
}

// AC-28: any 401 means the cookie expired, so the session is dropped and guards redirect to login.
export function createQueryClient({ retry = true }: { retry?: boolean } = {}): QueryClient {
  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError: (error) => dropSessionOnUnauthorized(error) }),
    mutationCache: new MutationCache({ onError: (error) => dropSessionOnUnauthorized(error) }),
    defaultOptions: {
      queries: { retry: retry ? shouldRetry : false },
      mutations: { retry: false },
    },
  });

  function dropSessionOnUnauthorized(error: unknown): void {
    if (isApiError(error, UNAUTHORIZED_STATUS)) {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
    }
  }

  return queryClient;
}
