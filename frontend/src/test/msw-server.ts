import { setupServer } from 'msw/node';

export const mswServer = setupServer();

// Mirrors the backend contract (SPEC-05): every API path lives under the /api prefix.
export const apiUrl = (path: string) => new URL(`/api${path}`, window.location.origin).toString();
