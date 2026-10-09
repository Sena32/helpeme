import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import type { JSDOM } from 'jsdom';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { mockSystemDarkMode } from './match-media';
import { mswServer } from './msw-server';

declare global {
  var jsdom: JSDOM;
}

// Node 22+ ships an experimental global localStorage that shadows jsdom's; use the DOM one.
vi.stubGlobal('localStorage', globalThis.jsdom.window.localStorage);

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }));
// jsdom lacks matchMedia; suites may override it per test.
beforeEach(() => mockSystemDarkMode(false));
afterEach(() => {
  cleanup();
  mswServer.resetHandlers();
});
afterAll(() => mswServer.close());
