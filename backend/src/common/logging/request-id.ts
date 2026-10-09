export const REQUEST_ID_HEADER = 'X-Request-Id';

// Accept upstream ids (proxy, client) only when they are short and safe to echo in logs/headers.
const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]{1,128}$/;

export function resolveRequestId(
  incomingHeader: string | string[] | undefined,
  generateId: () => string,
): string {
  return typeof incomingHeader === 'string' && SAFE_REQUEST_ID.test(incomingHeader)
    ? incomingHeader
    : generateId();
}
