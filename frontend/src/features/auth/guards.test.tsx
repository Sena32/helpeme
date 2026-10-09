import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { Route, Routes, useLocation } from 'react-router';
import { adminUser, regularUser } from '@/test/fixtures';
import { apiUrl, mswServer } from '@/test/msw-server';
import { renderWithProviders } from '@/test/render';
import type { User } from '@/types/auth';
import { AuthGuard, RoleGuard } from './guards';

function LoginProbe() {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  return <p>Tela de login (voltar para {from})</p>;
}

function renderRoutes(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginProbe />} />
      <Route element={<AuthGuard />}>
        <Route path="/" element={<p>Painel do usuário</p>} />
        <Route path="/minhas" element={<p>Minhas solicitações</p>} />
        <Route element={<RoleGuard allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<p>Painel administrativo</p>} />
        </Route>
      </Route>
    </Routes>,
    { route },
  );
}

const sessionAs = (user: User | null) =>
  mswServer.use(
    http.get(apiUrl('/auth/me'), () =>
      user
        ? HttpResponse.json({ user })
        : HttpResponse.json({ statusCode: 401, message: 'Sessão inválida.' }, { status: 401 }),
    ),
  );

describe('route guards', () => {
  it('AC-28: redirects to login without a session, remembering the requested page', async () => {
    sessionAs(null);

    renderRoutes('/minhas');

    expect(await screen.findByText('Tela de login (voltar para /minhas)')).toBeInTheDocument();
  });

  it('shows the protected page to a logged user', async () => {
    sessionAs(regularUser);

    renderRoutes('/minhas');

    expect(await screen.findByText('Minhas solicitações')).toBeInTheDocument();
  });

  it('shows an accessible loading state while the session is checked', () => {
    sessionAs(regularUser);

    renderRoutes('/minhas');

    expect(screen.getByRole('status', { name: 'Verificando sessão' })).toBeInTheDocument();
  });

  it('AC-29: redirects a regular user away from /admin', async () => {
    sessionAs(regularUser);

    renderRoutes('/admin');

    expect(await screen.findByText('Painel do usuário')).toBeInTheDocument();
    expect(screen.queryByText('Painel administrativo')).not.toBeInTheDocument();
  });

  it('lets an admin open /admin', async () => {
    sessionAs(adminUser);

    renderRoutes('/admin');

    expect(await screen.findByText('Painel administrativo')).toBeInTheDocument();
  });
});
