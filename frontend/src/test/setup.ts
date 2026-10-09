import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { toast } from 'sonner';
import type { JSDOM } from 'jsdom';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { mockSystemDarkMode } from './match-media';
import { mswServer } from './msw-server';

declare global {
  var jsdom: JSDOM;
}

// Node 22+ ships an experimental global localStorage that shadows jsdom's; use the DOM one.
vi.stubGlobal('localStorage', globalThis.jsdom.window.localStorage);

// jsdom gaps used by Radix (Select) and file previews.
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => undefined;
Element.prototype.scrollIntoView ??= () => undefined;
URL.createObjectURL = (blob: Blob) => `blob:preview/${blob instanceof File ? blob.name : 'blob'}`;
URL.revokeObjectURL = () => undefined;
// Node's fetch streams FormData files via Blob#stream, which jsdom's Blob lacks.
Blob.prototype.stream ??= function stream(this: Blob): ReadableStream<Uint8Array<ArrayBuffer>> {
  const readBytes = () => this.arrayBuffer();
  return new ReadableStream({
    async start(controller) {
      controller.enqueue(new Uint8Array(await readBytes()));
      controller.close();
    },
  });
};

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }));
// jsdom lacks matchMedia; suites may override it per test.
beforeEach(() => mockSystemDarkMode(false));
afterEach(() => {
  cleanup();
  // Sonner keeps toasts in module state and replays active ones to the next Toaster.
  toast.dismiss();
  mswServer.resetHandlers();
});
afterAll(() => mswServer.close());
