import { QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/hooks/useTheme';
import { createQueryClient } from '@/lib/query-client';

export function renderWithProviders(
  ui: ReactNode,
  { route = '/', state }: { route?: string; state?: unknown } = {},
): RenderResult {
  const queryClient = createQueryClient({ retry: false });
  return render(
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[{ pathname: route, state }]}>{ui}</MemoryRouter>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}
