import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createUser, listUsers, updateUser } from '@/api/users';
import { CURRENT_USER_QUERY_KEY } from '@/lib/query-keys';
import type { UpdateUserInput, User, UserListQuery } from '@/types/auth';

const USERS_QUERY_KEY = ['users'] as const;

export function useUserList(query: UserListQuery) {
  return useQuery({
    queryKey: [...USERS_QUERY_KEY, 'list', query],
    queryFn: ({ signal }) => listUsers(query, signal),
  });
}

function useRefreshUsers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
}

export function useCreateUser() {
  return useMutation({ mutationFn: createUser, onSuccess: useRefreshUsers() });
}

// Editing the own account also refreshes the session shown in the top bar.
export function useUpdateUser(userId: string) {
  const queryClient = useQueryClient();
  const refreshUsers = useRefreshUsers();
  return useMutation({
    mutationFn: (input: UpdateUserInput) => updateUser(userId, input),
    onSuccess: (updated) => {
      queryClient.setQueryData<User | null>(CURRENT_USER_QUERY_KEY, (current) =>
        current?.id === updated.id ? updated : current,
      );
      return refreshUsers();
    },
  });
}
