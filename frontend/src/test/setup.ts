import '@testing-library/jest-dom/vitest';
import type { JSDOM } from 'jsdom';
import { vi } from 'vitest';

declare global {
  var jsdom: JSDOM;
}

// Node 22+ ships an experimental global localStorage that shadows jsdom's; use the DOM one.
vi.stubGlobal('localStorage', globalThis.jsdom.window.localStorage);
