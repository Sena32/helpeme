import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { createQueryClient } from '@/lib/query-client';
import { adminUser, regularUser } from '@/test/fixtures';
import { apiUrl, mswServer } from '@/test/msw-server';
import { useCurrentUser, useLogin, useLogout, useRegister } from './useAuth';

function setup() {
  const queryClient = createQueryClient({ retry: false });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

const unauthorized = () =>
  HttpResponse.json({ statusCode: 401, message: 'Sessão inválida.' }, { status: 401 });

describe('auth hooks', () => {
  it('useCurrentUser returns the logged user', async () => {
    mswServer.use(http.get(apiUrl('/auth/me'), () => HttpResponse.json({ user: regularUser })));
    const { wrapper } = setup();

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() => expect(result.current.user).toEqual(regularUser));
    expect(result.current.isLoading).toBe(false);
  });

  it('useCurrentUser resolves to null without a session (401)', async () => {
    mswServer.use(http.get(apiUrl('/auth/me'), unauthorized));
    const { wrapper } = setup();

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it('useLogin stores the returned user as the current session', async () => {
    mswServer.use(
      http.get(apiUrl('/auth/me'), unauthorized),
      http.post(apiUrl('/auth/login'), () => HttpResponse.json({ user: adminUser })),
    );
    const { wrapper } = setup();
    const { result } = renderHook(() => ({ login: useLogin(), session: useCurrentUser() }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.session.isLoading).toBe(false));

    await act(() =>
      result.current.login.mutateAsync({ email: 'admin@example.com', password: 'Senha123@' }),
    );

    await waitFor(() => expect(result.current.session.user).toEqual(adminUser));
  });

  it('useRegister stores the created user as the current session', async () => {
    mswServer.use(
      http.get(apiUrl('/auth/me'), unauthorized),
      http.post(apiUrl('/auth/register'), () =>
        HttpResponse.json({ user: regularUser }, { status: 201 }),
      ),
    );
    const { wrapper } = setup();
    const { result } = renderHook(() => ({ register: useRegister(), session: useCurrentUser() }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.session.isLoading).toBe(false));

    await act(() =>
      result.current.register.mutateAsync({
        name: 'Maria Silva',
        email: 'maria@example.com',
        password: 'Senha123@',
      }),
    );

    await waitFor(() => expect(result.current.session.user).toEqual(regularUser));
  });

  it('useLogout clears the session and every cached query', async () => {
    mswServer.use(
      http.get(apiUrl('/auth/me'), () => HttpResponse.json({ user: regularUser })),
      http.post(apiUrl('/auth/logout'), () => new HttpResponse(null, { status: 204 })),
    );
    const { wrapper, queryClient } = setup();
    queryClient.setQueryData(['requests'], { items: [] });
    const { result } = renderHook(() => ({ logout: useLogout(), session: useCurrentUser() }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.session.user).toEqual(regularUser));

    await act(() => result.current.logout.mutateAsync());

    await waitFor(() => expect(result.current.session.user).toBeNull());
    expect(queryClient.getQueryData(['requests'])).toBeUndefined();
  });
});
