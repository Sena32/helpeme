import { appEnv } from '@/config/env';

export const GENERIC_ERROR_MESSAGE = 'Erro inesperado. Tente novamente.';
export const NETWORK_ERROR_MESSAGE = 'Não foi possível conectar ao servidor.';
const NETWORK_FAILURE_STATUS = 0;
const NO_CONTENT_STATUS = 204;

type QueryValue = string | number | boolean | null | undefined;

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: object | FormData;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly messages: string[];
  readonly requestId?: string;

  constructor(statusCode: number, messages: string[], requestId?: string) {
    super(messages[0] ?? GENERIC_ERROR_MESSAGE);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.messages = messages;
    this.requestId = requestId;
  }
}

function buildUrl(path: string, query: ApiRequestOptions['query'] = {}): string {
  const url = new URL(`${appEnv.apiBaseUrl}${path}`, window.location.origin);
  for (const [name, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) url.searchParams.set(name, String(value));
  }
  return url.toString();
}

function toMessages(message: unknown): string[] {
  if (typeof message === 'string') return [message];
  if (Array.isArray(message)) return message.filter((item) => typeof item === 'string');
  return [];
}

async function toApiError(response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => null);
  if (typeof body !== 'object' || body === null) return new ApiError(response.status, []);
  const { message, requestId } = body as { message?: unknown; requestId?: unknown };
  return new ApiError(
    response.status,
    toMessages(message),
    typeof requestId === 'string' ? requestId : undefined,
  );
}

function buildInit({ method = 'GET', body, signal }: ApiRequestOptions): RequestInit {
  const isJson = body !== undefined && !(body instanceof FormData);
  return {
    method,
    signal,
    credentials: 'include',
    headers: isJson ? { 'Content-Type': 'application/json' } : undefined,
    body: isJson ? JSON.stringify(body) : body,
  };
}

// The only place that talks HTTP (rules/03-frontend.md); the session travels in the httpOnly cookie.
export async function apiRequest<T = void>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await fetch(buildUrl(path, options.query), buildInit(options)).catch(() => {
    throw new ApiError(NETWORK_FAILURE_STATUS, [NETWORK_ERROR_MESSAGE]);
  });
  if (!response.ok) throw await toApiError(response);
  if (response.status === NO_CONTENT_STATUS) return undefined as T;
  return (await response.json()) as T;
}

export function isApiError(error: unknown, statusCode?: number): error is ApiError {
  return error instanceof ApiError && (statusCode === undefined || error.statusCode === statusCode);
}
