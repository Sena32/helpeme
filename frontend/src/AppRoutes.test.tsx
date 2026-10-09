import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { regularUser } from '@/test/fixtures';
import { apiUrl, mswServer } from '@/test/msw-server';
import { renderWithProviders } from '@/test/render';
import { AppRoutes } from './AppRoutes';

describe('AppRoutes', () => {
  it('AC-28: sends a visitor without session from / to the login page', async () => {
    mswServer.use(
      http.get(apiUrl('/auth/me'), () =>
        HttpResponse.json({ statusCode: 401, message: 'Sessão inválida.' }, { status: 401 }),
      ),
    );

    renderWithProviders(<AppRoutes />, { route: '/' });

    expect(await screen.findByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument();
  });

  it('AC-29: keeps a regular user out of /admin', async () => {
    mswServer.use(http.get(apiUrl('/auth/me'), () => HttpResponse.json({ user: regularUser })));

    renderWithProviders(<AppRoutes />, { route: '/admin' });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Minhas solicitações' }),
    ).toBeInTheDocument();
  });
});
