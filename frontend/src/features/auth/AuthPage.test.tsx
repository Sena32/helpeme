import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { adminUser, regularUser } from '@/test/fixtures';
import { apiUrl, mswServer } from '@/test/msw-server';
import { renderWithProviders } from '@/test/render';
import { AuthPage } from './AuthPage';

const noSession = () =>
  mswServer.use(
    http.get(apiUrl('/auth/me'), () =>
      HttpResponse.json({ statusCode: 401, message: 'Sessão inválida.' }, { status: 401 }),
    ),
  );

function renderAuthPage(state?: unknown) {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/" element={<p>Home do usuário</p>} />
      <Route path="/admin" element={<p>Home do admin</p>} />
      <Route path="/solicitacoes/nova" element={<p>Nova solicitação</p>} />
    </Routes>,
    { route: '/login', state },
  );
}

async function fillLogin(email: string, password: string) {
  await userEvent.type(await screen.findByLabelText('E-mail'), email);
  await userEvent.type(screen.getByLabelText('Senha'), password);
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
}

describe('AuthPage (UI-01)', () => {
  beforeEach(noSession);

  it('shows the logo, a single h1 and the Entrar/Cadastrar tabs', async () => {
    renderAuthPage();

    expect(await screen.findByRole('tab', { name: 'Entrar', selected: true })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'HelpeMe' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('tab', { name: 'Cadastrar' })).toBeInTheDocument();
  });

  it('validates the login form before calling the API', async () => {
    renderAuthPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Informe um e-mail válido.')).toBeInTheDocument();
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true');
  });

  it('logs a user in and returns to the page they asked for', async () => {
    mswServer.use(http.post(apiUrl('/auth/login'), () => HttpResponse.json({ user: regularUser })));
    renderAuthPage({ from: '/solicitacoes/nova' });

    await fillLogin('maria@example.com', 'Senha123@');

    expect(await screen.findByText('Nova solicitação')).toBeInTheDocument();
  });

  it('sends an admin to the admin home', async () => {
    mswServer.use(http.post(apiUrl('/auth/login'), () => HttpResponse.json({ user: adminUser })));
    renderAuthPage();

    await fillLogin('admin@example.com', 'Senha123@');

    expect(await screen.findByText('Home do admin')).toBeInTheDocument();
  });

  it('AC-06: shows the generic error message for wrong credentials', async () => {
    mswServer.use(
      http.post(apiUrl('/auth/login'), () =>
        HttpResponse.json(
          { statusCode: 401, message: 'E-mail ou senha inválidos.' },
          { status: 401 },
        ),
      ),
    );
    renderAuthPage();

    await fillLogin('maria@example.com', 'Errada123@');

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.');
  });

  it('RN-02: shows the live password checklist and blocks a weak password on sign up', async () => {
    renderAuthPage();
    await userEvent.click(await screen.findByRole('tab', { name: 'Cadastrar' }));

    await userEvent.type(screen.getByLabelText('Nome'), 'Maria');
    await userEvent.type(screen.getByLabelText('E-mail'), 'maria@example.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'abc');
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    const checklist = screen.getByRole('list', { name: 'Requisitos da senha' });
    expect(within(checklist).getByText('Uma letra minúscula').closest('li')).toHaveAttribute(
      'data-met',
      'true',
    );
    expect(within(checklist).getByText('Um número').closest('li')).toHaveAttribute(
      'data-met',
      'false',
    );
    expect(await screen.findByText(/A senha deve ter no mínimo 8 caracteres/)).toBeInTheDocument();
  });

  it('creates the account, confirms with a toast and opens the user home', async () => {
    mswServer.use(
      http.post(apiUrl('/auth/register'), () =>
        HttpResponse.json({ user: regularUser }, { status: 201 }),
      ),
    );
    renderAuthPage();
    await userEvent.click(await screen.findByRole('tab', { name: 'Cadastrar' }));

    await userEvent.type(screen.getByLabelText('Nome'), 'Maria Silva');
    await userEvent.type(screen.getByLabelText('E-mail'), 'maria@example.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'Senha123@');
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByText('Home do usuário')).toBeInTheDocument();
    expect(await screen.findByText('Conta criada com sucesso.')).toBeInTheDocument();
  });

  it('AC-02: shows the conflict message when the email is taken', async () => {
    mswServer.use(
      http.post(apiUrl('/auth/register'), () =>
        HttpResponse.json({ statusCode: 409, message: 'E-mail já cadastrado.' }, { status: 409 }),
      ),
    );
    renderAuthPage();
    await userEvent.click(await screen.findByRole('tab', { name: 'Cadastrar' }));

    await userEvent.type(screen.getByLabelText('Nome'), 'Maria Silva');
    await userEvent.type(screen.getByLabelText('E-mail'), 'maria@example.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'Senha123@');
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail já cadastrado.');
  });

  it('redirects an already logged user to their home', async () => {
    mswServer.use(http.get(apiUrl('/auth/me'), () => HttpResponse.json({ user: adminUser })));

    renderAuthPage();

    expect(await screen.findByText('Home do admin')).toBeInTheDocument();
  });
});
