import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { apiUrl, mswServer } from '@/test/msw-server';
import { renderWithProviders } from '@/test/render';
import type { Category } from '@/types/categories';
import { CategoriesPage } from './CategoriesPage';

function setup(initial: Category[] = [{ id: 'cat-1', name: 'Infra' }]) {
  const posted: unknown[] = [];
  let categories = initial;
  mswServer.use(
    http.get(apiUrl('/categories'), () => HttpResponse.json(categories)),
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
      categories = [...categories, created];
      return HttpResponse.json(created, { status: 201 });
    }),
  );
  renderWithProviders(<CategoriesPage />);
  return { posted };
}

async function createCategory(name: string) {
  await userEvent.click(await screen.findByRole('button', { name: 'Nova categoria' }));
  const dialog = await screen.findByRole('dialog', { name: 'Nova categoria' });
  await userEvent.type(within(dialog).getByLabelText('Nome'), name);
  await userEvent.click(within(dialog).getByRole('button', { name: 'Criar categoria' }));
  return dialog;
}

describe('CategoriesPage (UI-04)', () => {
  it('lists the active categories', async () => {
    setup([
      { id: 'cat-1', name: 'Infra' },
      { id: 'cat-2', name: 'RH' },
    ]);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Categorias' }),
    ).toBeInTheDocument();
    const list = await screen.findByRole('list', { name: 'Categorias ativas' });
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Infra', 'RH']);
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
      await within(screen.getByRole('list', { name: 'Categorias ativas' })).findByText('Segurança'),
    ).toBeInTheDocument();
  });

  it('AC-24: keeps the dialog open and explains a duplicate name (409)', async () => {
    setup([{ id: 'cat-1', name: 'Segurança' }]);

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
