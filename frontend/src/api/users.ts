import type { CreateUserInput, User } from '@/types/auth';
import { apiRequest } from './http-client';

export async function createUser(input: CreateUserInput): Promise<User> {
  return (await apiRequest<{ user: User }>('/users', { method: 'POST', body: input })).user;
}
