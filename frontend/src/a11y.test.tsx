import { screen } from '@testing-library/react';
import axe from 'axe-core';
import { http, HttpResponse } from 'msw';
import { THEME_STORAGE_KEY } from '@/lib/theme';
import {
  adminUser,
  listItem,
  listPage,
  regularUser,
  requestDetails,
  summary,
} from '@/test/fixtures';
import { apiUrl, mswServer } from '@/test/msw-server';
import { renderWithProviders } from '@/test/render';
import type { User } from '@/types/auth';
import { AppRoutes } from './AppRoutes';

// jsdom has no layout engine: contrast is verified on the tokens (design-tokens.test.ts) instead.
const AXE_OPTIONS: axe.RunOptions = { rules: { 'color-contrast': { enabled: false } } };

function apiAs(user: User | null) {
  mswServer.use(
    http.get(apiUrl('/auth/me'), () =>
      user
        ? HttpResponse.json({ user })
        : HttpResponse.json({ statusCode: 401, message: 'Sessão inválida.' }, { status: 401 }),
    ),
    http.get(apiUrl('/dashboard/summary'), () =>
      HttpResponse.json(
        summary({ byCategory: [{ categoryId: 'cat-1', name: 'Infra', count: 4 }] }),
      ),
    ),
    http.get(apiUrl('/requests'), () =>
      HttpResponse.json(
        listPage([listItem({ priority: 'HIGH', createdBy: { name: 'Maria Silva' } })]),
      ),
    ),
    http.get(apiUrl('/requests/req-1'), () =>
      HttpResponse.json({
        request: requestDetails({
          attachments: [
            { id: 'att-1', originalName: 'tela.png', mimeType: 'image/png', sizeBytes: 2048 },
          ],
        }),
      }),
    ),
    http.get(apiUrl('/categories'), () => HttpResponse.json([{ id: 'cat-1', name: 'Infra' }])),
  );
}

const SCREENS: Array<[string, User | null, string, string]> = [
  ['UI-01 login/cadastro', null, '/login', 'Portal de solicitações de TI'],
  ['UI-06 painel do usuário', regularUser, '/', 'Meu painel'],
  ['UI-07 nova solicitação', regularUser, '/solicitacoes/nova', 'Nova solicitação'],
  ['UI-08 detalhe (user)', regularUser, '/solicitacoes/req-1', 'Notebook sem rede'],
  ['UI-02 painel admin', adminUser, '/admin', 'Painel administrativo'],
  ['UI-03 tratamento', adminUser, '/admin/solicitacoes/req-1', 'Notebook sem rede'],
  ['UI-04 categorias', adminUser, '/admin/categorias', 'Categorias'],
  ['UI-05 usuários', adminUser, '/admin/usuarios', 'Usuários'],
  ['UI-09 404', regularUser, '/nao-existe', 'Página não encontrada'],
];

describe('AC-32: every screen in dark mode has no axe violations', () => {
  beforeEach(() => localStorage.setItem(THEME_STORAGE_KEY, 'dark'));
  afterEach(() => localStorage.clear());

  it.each(SCREENS)('%s', async (_name, user, route, heading) => {
    apiAs(user);
    renderWithProviders(<AppRoutes />, { route });
    await screen.findByRole('heading', { level: 1, name: heading });
    await screen.findAllByText(/./);

    expect(document.documentElement).toHaveClass('dark');
    const results = await axe.run(document.body, AXE_OPTIONS);
    expect(
      results.violations.map(
        ({ id, nodes }) => `${id}: ${nodes.map((node) => node.target.join(' ')).join(', ')}`,
      ),
    ).toEqual([]);
  });
});
