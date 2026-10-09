import type { LoginInput, RegisterInput, User } from '@/types/auth';
import { apiRequest, isApiError } from './http-client';

const UNAUTHORIZED_STATUS = 401;

type UserResponse = { user: User };

export async function login(input: LoginInput): Promise<User> {
  return (await apiRequest<UserResponse>('/auth/login', { method: 'POST', body: input })).user;
}

export async function register(input: RegisterInput): Promise<User> {
  return (await apiRequest<UserResponse>('/auth/register', { method: 'POST', body: input })).user;
}

export function logout(): Promise<void> {
  return apiRequest('/auth/logout', { method: 'POST' });
}

// No session is an expected state, not an error: resolves to null on 401.
export async function fetchCurrentUser(): Promise<User | null> {
  try {
    return (await apiRequest<UserResponse>('/auth/me')).user;
  } catch (error) {
    if (isApiError(error, UNAUTHORIZED_STATUS)) return null;
    throw error;
  }
}
