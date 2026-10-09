import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { adminUser } from '@/test/fixtures';
import { apiUrl, mswServer } from '@/test/msw-server';
import { renderWithProviders } from '@/test/render';
import { UsersPage } from './UsersPage';

function setup(respond?: () => Response) {
  const posted: unknown[] = [];
  mswServer.use(
    http.post(apiUrl('/users'), async ({ request }) => {
      posted.push(await request.json());
      return respond
        ? respond()
        : HttpResponse.json({ user: { ...adminUser, name: 'Ana Admin' } }, { status: 201 });
    }),
  );
  renderWithProviders(<UsersPage />);
  return { posted };
}

async function openDialog() {
  await userEvent.click(await screen.findByRole('button', { name: 'Novo usuário' }));
  return screen.findByRole('dialog', { name: 'Novo usuário' });
}

async function fill(dialog: HTMLElement, password = 'Senha123@') {
  await userEvent.type(within(dialog).getByLabelText('Nome'), 'Ana Admin');
  await userEvent.type(within(dialog).getByLabelText('E-mail'), 'ana@example.com');
  await userEvent.type(within(dialog).getByLabelText('Senha'), password);
}

describe('UsersPage (UI-05)', () => {
  it('AC-07: creates an administrator', async () => {
    const { posted } = setup();
    expect(await screen.findByRole('heading', { level: 1, name: 'Usuários' })).toBeInTheDocument();
    const dialog = await openDialog();

    await fill(dialog);
    await userEvent.click(within(dialog).getByRole('combobox', { name: 'Perfil' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Administrador' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Criar usuário' }));

    expect(await screen.findByText('Ana Admin foi criado como Administrador.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(posted).toEqual([
      { name: 'Ana Admin', email: 'ana@example.com', password: 'Senha123@', role: 'ADMIN' },
    ]);
  });

  it('defaults the profile to a regular user', async () => {
    const { posted } = setup();
    const dialog = await openDialog();

    expect(within(dialog).getByRole('combobox', { name: 'Perfil' })).toHaveTextContent('Usuário');
    await fill(dialog);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Criar usuário' }));

    await screen.findByText(/foi criado como/);
    expect(posted).toEqual([expect.objectContaining({ role: 'USER' })]);
  });

  it('RN-02: blocks a weak password and shows the checklist', async () => {
    const { posted } = setup();
    const dialog = await openDialog();

    await fill(dialog, 'abc');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Criar usuário' }));

    expect(
      await within(dialog).findByText(/A senha deve ter no mínimo 8 caracteres/),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('list', { name: 'Requisitos da senha' })).toBeInTheDocument();
    expect(posted).toEqual([]);
  });

  it('keeps the dialog open on a duplicate email (409)', async () => {
    setup(() =>
      HttpResponse.json({ statusCode: 409, message: 'E-mail já cadastrado.' }, { status: 409 }),
    );
    const dialog = await openDialog();

    await fill(dialog);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Criar usuário' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('E-mail já cadastrado.');
  });
});
