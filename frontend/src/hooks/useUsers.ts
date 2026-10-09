import { useMutation } from '@tanstack/react-query';
import { createUser } from '@/api/users';

export function useCreateUser() {
  return useMutation({ mutationFn: createUser });
}
