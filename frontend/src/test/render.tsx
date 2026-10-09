import { QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { createQueryClient } from '@/lib/query-client';

export function renderWithProviders(
  ui: ReactNode,
  { route = '/' }: { route?: string } = {},
): RenderResult {
  const queryClient = createQueryClient({ retry: false });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}
