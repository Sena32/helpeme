import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCategory,
  deactivateCategory,
  listAllCategories,
  listCategories,
} from '@/api/categories';

export const CATEGORIES_QUERY_KEY = ['categories'] as const;

export function useCategories() {
  return useQuery({
    queryKey: [...CATEGORIES_QUERY_KEY, 'active'],
    queryFn: ({ signal }) => listCategories(signal),
  });
}

export function useAllCategories() {
  return useQuery({
    queryKey: [...CATEGORIES_QUERY_KEY, 'all'],
    queryFn: ({ signal }) => listAllCategories(signal),
  });
}

function useInvalidateCategories() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
}

export function useCreateCategory() {
  return useMutation({ mutationFn: createCategory, onSuccess: useInvalidateCategories() });
}

export function useDeactivateCategory() {
  return useMutation({ mutationFn: deactivateCategory, onSuccess: useInvalidateCategories() });
}
