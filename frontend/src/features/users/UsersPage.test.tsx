import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { formatDate } from '@/lib/format';
import { adminUser, regularUser } from '@/test/fixtures';
import type { User } from '@/types/auth';
import { apiUrl, mswServer } from '@/test/msw-server';
import { renderWithProviders } from '@/test/render';
import { UsersPage } from './UsersPage';

const ana: User = { ...regularUser, id: 'user-ana', name: 'Ana Souza', email: 'ana@example.com' };

interface SetupOptions {
  respond?: () => Response;
  respondPatch?: () => Response;
  users?: User[];
  route?: string;
}

function setup({ respond, respondPatch, users = [adminUser, ana], route }: SetupOptions = {}) {
  const posted: unknown[] = [];
  const patched: { userId: string; body: unknown }[] = [];
  const listQueries: string[] = [];
  let stored = users;
  mswServer.use(
    http.get(apiUrl('/auth/me'), () => HttpResponse.json({ user: adminUser })),
    http.get(apiUrl('/users'), ({ request }) => {
      listQueries.push(new URL(request.url).search);
      return HttpResponse.json({ items: stored, total: stored.length, page: 1, limit: 10 });
    }),
    http.patch(apiUrl('/users/:userId'), async ({ params, request }) => {
      const body = (await request.json()) as Partial<User>;
      patched.push({ userId: String(params.userId), body });
      if (respondPatch) return respondPatch();
      stored = stored.map((user) => (user.id === params.userId ? { ...user, ...body } : user));
      return HttpResponse.json({ user: stored.find((user) => user.id === params.userId) });
    }),
    http.post(apiUrl('/users'), async ({ request }) => {
      posted.push(await request.json());
      return respond
        ? respond()
        : HttpResponse.json({ user: { ...adminUser, name: 'Ana Admin' } }, { status: 201 });
    }),
  );
  renderWithProviders(<UsersPage />, { route });
  return { posted, patched, listQueries };
}

async function openEditDialog(name: string) {
  const table = await screen.findByRole('table', { name: 'Usuários' });
  await userEvent.click(await within(table).findByRole('button', { name: `Editar ${name}` }));
  return screen.findByRole('dialog', { name: 'Editar usuário' });
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
    setup({
      respond: () =>
        HttpResponse.json({ statusCode: 409, message: 'E-mail já cadastrado.' }, { status: 409 }),
    });
    const dialog = await openDialog();

    await fill(dialog);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Criar usuário' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('E-mail já cadastrado.');
  });

  it('AC-37: validates the e-mail while typing', async () => {
    setup();
    const dialog = await openDialog();
    const email = within(dialog).getByLabelText('E-mail');

    await userEvent.type(email, 'ana@');
    expect(await within(dialog).findByText('Informe um e-mail válido.')).toBeInTheDocument();

    await userEvent.type(email, 'example.com');
    expect(within(dialog).queryByText('Informe um e-mail válido.')).not.toBeInTheDocument();
  });

  describe('listing (RF-16)', () => {
    it('AC-45: shows name, e-mail, profile and sign-up date of each user', async () => {
      const { listQueries } = setup();

      const table = await screen.findByRole('table', { name: 'Usuários' });
      const anaRow = (await within(table).findByText('Ana Souza')).closest('tr');
      expect(anaRow).not.toBeNull();
      expect(within(anaRow as HTMLElement).getByText('ana@example.com')).toBeInTheDocument();
      expect(within(anaRow as HTMLElement).getByText('Usuário')).toBeInTheDocument();
      expect(within(anaRow as HTMLElement).getByText(formatDate(ana.createdAt))).toBeInTheDocument();
      expect(listQueries).toContain('?page=1&limit=10');
    });

    it('AC-45: searches by name or e-mail and filters by profile, back on page 1', async () => {
      const { listQueries } = setup({ route: '/?page=2' });

      await userEvent.type(
        await screen.findByRole('searchbox', { name: 'Buscar por nome ou e-mail' }),
        'ana',
      );
      await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
      await userEvent.click(screen.getByRole('combobox', { name: 'Perfil' }));
      await userEvent.click(await screen.findByRole('option', { name: 'Administrador' }));

      await waitFor(() => expect(listQueries).toContain('?page=1&limit=10&search=ana&role=ADMIN'));
    });

    it('shows an empty state', async () => {
      setup({ users: [] });

      expect(await screen.findByText('Nenhum usuário encontrado.')).toBeInTheDocument();
    });
  });

  describe('editing (RF-17)', () => {
    it('AC-45: opens a prefilled dialog and saves the changes', async () => {
      const { patched } = setup();
      const dialog = await openEditDialog('Ana Souza');

      expect(within(dialog).getByLabelText('E-mail')).toHaveValue('ana@example.com');
      const name = within(dialog).getByLabelText('Nome');
      await userEvent.clear(name);
      await userEvent.type(name, 'Ana Lima');
      await userEvent.click(within(dialog).getByRole('combobox', { name: 'Perfil' }));
      await userEvent.click(await screen.findByRole('option', { name: 'Administrador' }));
      await userEvent.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }));

      expect(await screen.findByText('Usuário "Ana Lima" atualizado.')).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(patched).toEqual([
        {
          userId: 'user-ana',
          body: { name: 'Ana Lima', email: 'ana@example.com', role: 'ADMIN' },
        },
      ]);
      expect(
        await within(screen.getByRole('table', { name: 'Usuários' })).findByText('Ana Lima'),
      ).toBeInTheDocument();
    });

    it('RN-14: the profile of the own account cannot be edited', async () => {
      setup();
      const dialog = await openEditDialog('Admin');

      expect(within(dialog).getByRole('combobox', { name: 'Perfil' })).toBeDisabled();
      expect(
        within(dialog).getByText('Você não pode alterar o seu próprio perfil.'),
      ).toBeInTheDocument();
    });

    it('AC-44: keeps the dialog open on a duplicate e-mail (409)', async () => {
      setup({
        respondPatch: () =>
          HttpResponse.json({ statusCode: 409, message: 'E-mail já cadastrado.' }, { status: 409 }),
      });
      const dialog = await openEditDialog('Ana Souza');

      await userEvent.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }));

      expect(await within(dialog).findByRole('alert')).toHaveTextContent('E-mail já cadastrado.');
    });

    it('AC-37: validates the name while typing', async () => {
      const { patched } = setup();
      const dialog = await openEditDialog('Ana Souza');
      const name = within(dialog).getByLabelText('Nome');

      await userEvent.clear(name);
      await userEvent.type(name, 'A');

      expect(
        await within(dialog).findByText('O nome deve ter entre 2 e 100 caracteres.'),
      ).toBeInTheDocument();
      await userEvent.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }));
      expect(patched).toEqual([]);
    });
  });
});
