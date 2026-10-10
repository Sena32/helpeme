import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { apiUrl, mswServer } from '@/test/msw-server';
import { renderWithProviders } from '@/test/render';
import type { CategoryWithStatus } from '@/types/categories';
import { CategoriesPage } from './CategoriesPage';

function setup(initial: CategoryWithStatus[] = [{ id: 'cat-1', name: 'Infra', isActive: true }]) {
  const posted: unknown[] = [];
  const deactivated: string[] = [];
  const listQueries: string[] = [];
  let categories = initial;
  mswServer.use(
    http.get(apiUrl('/categories'), ({ request }) => {
      listQueries.push(new URL(request.url).search);
      return HttpResponse.json(categories);
    }),
    http.patch(apiUrl('/categories/:categoryId/deactivate'), ({ params }) => {
      deactivated.push(String(params.categoryId));
      categories = categories.map((category) =>
        category.id === params.categoryId ? { ...category, isActive: false } : category,
      );
      return HttpResponse.json(categories.find((category) => category.id === params.categoryId));
    }),
    http.post(apiUrl('/categories'), async ({ request }) => {
      const body = (await request.json()) as { name: string };
      posted.push(body);
      if (categories.some((category) => category.name.toLowerCase() === body.name.toLowerCase())) {
        return HttpResponse.json(
          { statusCode: 409, message: 'Já existe uma categoria com este nome.' },
          { status: 409 },
        );
      }
      const created = { id: `cat-${categories.length + 1}`, name: body.name };
      categories = [...categories, { ...created, isActive: true }];
      return HttpResponse.json(created, { status: 201 });
    }),
  );
  renderWithProviders(<CategoriesPage />);
  return { posted, deactivated, listQueries };
}

async function createCategory(name: string) {
  await userEvent.click(await screen.findByRole('button', { name: 'Nova categoria' }));
  const dialog = await screen.findByRole('dialog', { name: 'Nova categoria' });
  await userEvent.type(within(dialog).getByLabelText('Nome'), name);
  await userEvent.click(within(dialog).getByRole('button', { name: 'Criar categoria' }));
  return dialog;
}

describe('CategoriesPage (UI-04)', () => {
  it('AC-36: lists every category with its status, asking the API for inactive ones too', async () => {
    const { listQueries } = setup([
      { id: 'cat-1', name: 'Infra', isActive: true },
      { id: 'cat-2', name: 'RH', isActive: false },
    ]);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Categorias' }),
    ).toBeInTheDocument();
    const list = await screen.findByRole('list', { name: 'Categorias' });
    const rows = within(list).getAllByRole('listitem');
    expect(within(rows[0]).getByText('Infra')).toBeInTheDocument();
    expect(within(rows[0]).getByText('Ativa')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Inativa')).toBeInTheDocument();
    expect(within(rows[0]).getByRole('button', { name: 'Desativar Infra' })).toBeInTheDocument();
    expect(within(rows[1]).queryByRole('button', { name: /Desativar/ })).not.toBeInTheDocument();
    expect(listQueries).toContain('?includeInactive=true');
  });

  it('AC-34: deactivates a category after confirmation', async () => {
    const { deactivated } = setup([{ id: 'cat-2', name: 'RH', isActive: true }]);

    await userEvent.click(await screen.findByRole('button', { name: 'Desativar RH' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Desativar a categoria "RH"?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Desativar' }));

    expect(await screen.findByText('Categoria "RH" desativada.')).toBeInTheDocument();
    expect(deactivated).toEqual(['cat-2']);
    expect(await screen.findByText('Inativa')).toBeInTheDocument();
  });

  it('does nothing when the deactivation is cancelled', async () => {
    const { deactivated } = setup([{ id: 'cat-2', name: 'RH', isActive: true }]);

    await userEvent.click(await screen.findByRole('button', { name: 'Desativar RH' }));
    await userEvent.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Cancelar' }),
    );

    expect(deactivated).toEqual([]);
  });

  it('shows an empty state', async () => {
    setup([]);

    expect(await screen.findByText('Nenhuma categoria cadastrada.')).toBeInTheDocument();
  });

  it('AC-24: creates "Segurança", closes the dialog and refreshes the list', async () => {
    const { posted } = setup();

    await createCategory('  Segurança ');

    expect(await screen.findByText('Categoria "Segurança" criada.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(posted).toEqual([{ name: 'Segurança' }]);
    expect(
      await within(screen.getByRole('list', { name: 'Categorias' })).findByText('Segurança'),
    ).toBeInTheDocument();
  });

  it('AC-24: keeps the dialog open and explains a duplicate name (409)', async () => {
    setup([{ id: 'cat-1', name: 'Segurança', isActive: true }]);

    const dialog = await createCategory('segurança');

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Já existe uma categoria com este nome.',
    );
  });

  it('RN-04: validates the name length before calling the API', async () => {
    const { posted } = setup();

    const dialog = await createCategory('a');

    expect(
      await within(dialog).findByText('O nome da categoria deve ter entre 2 e 50 caracteres.'),
    ).toBeInTheDocument();
    expect(posted).toEqual([]);
  });
});
