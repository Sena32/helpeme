import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { adminUser, regularUser } from '@/test/fixtures';
import { apiUrl, mswServer } from '@/test/msw-server';
import { renderWithProviders } from '@/test/render';
import type { User } from '@/types/auth';
import { AppLayout } from './AppLayout';

function renderLayoutAs(user: User, route = '/') {
  mswServer.use(http.get(apiUrl('/auth/me'), () => HttpResponse.json({ user })));
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<p>Tela de login</p>} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<h1>Conteúdo da página</h1>} />
        <Route path="/admin" element={<h1>Conteúdo admin</h1>} />
      </Route>
    </Routes>,
    { route },
  );
}

const sidebar = () => screen.getByRole('navigation', { name: 'Menu principal' });

describe('AppLayout', () => {
  it('shows only user links to a regular user', async () => {
    renderLayoutAs(regularUser);

    await screen.findByText('Conteúdo da página');
    expect(within(sidebar()).getByRole('link', { name: 'Meu painel' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(sidebar()).getByRole('link', { name: 'Nova solicitação' })).toBeInTheDocument();
    expect(within(sidebar()).queryByRole('link', { name: 'Categorias' })).not.toBeInTheDocument();
  });

  it('shows only admin links to an admin', async () => {
    renderLayoutAs(adminUser, '/admin');

    await screen.findByText('Conteúdo admin');
    expect(within(sidebar()).getByRole('link', { name: 'Painel' })).toBeInTheDocument();
    expect(within(sidebar()).getByRole('link', { name: 'Categorias' })).toBeInTheDocument();
    expect(within(sidebar()).getByRole('link', { name: 'Usuários' })).toBeInTheDocument();
    expect(
      within(sidebar()).queryByRole('link', { name: 'Nova solicitação' }),
    ).not.toBeInTheDocument();
  });

  it('offers the theme toggle in the top bar', async () => {
    renderLayoutAs(regularUser);

    expect(await screen.findByRole('button', { name: 'Tema: Sistema' })).toBeInTheDocument();
  });

  it('collapses the sidebar keeping links reachable by name', async () => {
    renderLayoutAs(regularUser);
    const collapse = await screen.findByRole('button', { name: 'Recolher menu' });

    await userEvent.click(collapse);

    expect(screen.getByRole('button', { name: 'Expandir menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(within(sidebar()).getByRole('link', { name: 'Meu painel' })).toBeInTheDocument();
  });

  it('opens the navigation drawer from the mobile menu button', async () => {
    renderLayoutAs(regularUser);

    await userEvent.click(await screen.findByRole('button', { name: 'Abrir menu' }));

    const drawer = await screen.findByRole('dialog', { name: 'Menu' });
    expect(within(drawer).getByRole('link', { name: 'Nova solicitação' })).toBeInTheDocument();
  });

  it('shows the user menu and logs out to the login page', async () => {
    mswServer.use(http.post(apiUrl('/auth/logout'), () => new HttpResponse(null, { status: 204 })));
    renderLayoutAs(regularUser);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Menu do usuário: Maria Silva' }),
    );
    expect(await screen.findByText('maria@example.com')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Sair' }));

    expect(await screen.findByText('Tela de login')).toBeInTheDocument();
  });
});
