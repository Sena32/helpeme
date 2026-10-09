import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCurrentUser, login, logout, register } from '@/api/auth';
import { CURRENT_USER_QUERY_KEY } from '@/lib/query-keys';
import type { User } from '@/types/auth';

export { CURRENT_USER_QUERY_KEY };

export function useCurrentUser(): { user: User | null; isLoading: boolean } {
  const { data, isPending } = useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: fetchCurrentUser,
    staleTime: Infinity,
  });
  return { user: data ?? null, isLoading: isPending };
}

function useStoreSession() {
  const queryClient = useQueryClient();
  return (user: User) => queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
}

export function useLogin() {
  return useMutation({ mutationFn: login, onSuccess: useStoreSession() });
}

export function useRegister() {
  return useMutation({ mutationFn: register, onSuccess: useStoreSession() });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== CURRENT_USER_QUERY_KEY[0],
      });
    },
  });
}
