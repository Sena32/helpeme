import type {
  CreateUserInput,
  UpdateUserInput,
  User,
  UserListPage,
  UserListQuery,
} from '@/types/auth';
import { apiRequest } from './http-client';

export async function createUser(input: CreateUserInput): Promise<User> {
  return (await apiRequest<{ user: User }>('/users', { method: 'POST', body: input })).user;
}

export function listUsers(query: UserListQuery, signal?: AbortSignal): Promise<UserListPage> {
  return apiRequest<UserListPage>('/users', { query: { ...query }, signal });
}

export async function updateUser(userId: string, input: UpdateUserInput): Promise<User> {
  const path = `/users/${encodeURIComponent(userId)}`;
  return (await apiRequest<{ user: User }>(path, { method: 'PATCH', body: input })).user;
}
