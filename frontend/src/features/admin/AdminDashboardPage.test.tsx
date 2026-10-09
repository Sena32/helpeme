import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { listItem, listPage, summary } from '@/test/fixtures';
import { apiUrl, mswServer } from '@/test/msw-server';
import { renderWithProviders } from '@/test/render';
import { AdminDashboardPage } from './AdminDashboardPage';

const categories = [
  { id: 'cat-1', name: 'Infra' },
  { id: 'cat-2', name: 'RH' },
];

function setup({ listResponse = listPage([listItem({ createdBy: { name: 'Bruno' } })]) } = {}) {
  const queries: string[] = [];
  mswServer.use(
    http.get(apiUrl('/categories'), () => HttpResponse.json(categories)),
    http.get(apiUrl('/dashboard/summary'), () =>
      HttpResponse.json(
        summary({
          byCategory: [
            { categoryId: 'cat-1', name: 'Infra', count: 4 },
            { categoryId: 'cat-2', name: 'RH', count: 2 },
          ],
        }),
      ),
    ),
    http.get(apiUrl('/requests'), ({ request }) => {
      queries.push(new URL(request.url).search);
      return HttpResponse.json(listResponse);
    }),
  );
  renderWithProviders(
    <Routes>
      <Route path="/admin" element={<AdminDashboardPage />} />
      <Route path="/admin/solicitacoes/:requestId" element={<p>Tratamento da solicitação</p>} />
    </Routes>,
    { route: '/admin' },
  );
  return { queries, lastQuery: () => queries.at(-1) ?? '' };
}

const table = () => screen.findByRole('table', { name: 'Solicitações' });

describe('AdminDashboardPage (UI-02)', () => {
  it('shows the five global KPIs', async () => {
    setup();

    const kpis = await screen.findByRole('region', { name: 'Indicadores gerais' });
    const valueOf = (label: string) => within(kpis).getByText(label).nextSibling?.textContent;
    expect([
      valueOf('Total'),
      valueOf('Abertas'),
      valueOf('Em resolução'),
      valueOf('Finalizadas'),
      valueOf('Alta prioridade'),
    ]).toEqual(['6', '3', '2', '1', '1']);
  });

  it('charts requests by status and by category with text labels', async () => {
    setup();

    const byStatus = await screen.findByRole('figure', { name: 'Solicitações por status' });
    expect(
      within(byStatus)
        .getAllByRole('listitem')
        .map((row) => row.textContent),
    ).toEqual(['Aberta3', 'Em resolução2', 'Finalizada1']);
    const byCategory = screen.getByRole('figure', { name: 'Solicitações por categoria' });
    expect(
      within(byCategory)
        .getAllByRole('listitem')
        .map((row) => row.textContent),
    ).toEqual(['Infra4', 'RH2']);
  });

  it('lists every request with requester, sorted by priority by default', async () => {
    const { lastQuery } = setup();

    const requestsTable = await table();
    expect(await within(requestsTable).findByText('Bruno')).toBeInTheDocument();
    expect(within(requestsTable).getByRole('columnheader', { name: /Prioridade/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    expect(lastQuery()).toBe('?page=1&limit=10');
  });

  it('sorts by creation date, toggling the order', async () => {
    const { lastQuery } = setup();
    await table();

    await userEvent.click(screen.getByRole('button', { name: 'Ordenar por data de criação' }));
    expect(lastQuery()).toBe('?page=1&limit=10&sortBy=createdAt&order=desc');
    expect(screen.getByRole('columnheader', { name: /Criada em/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Ordenar por data de criação' }));
    expect(lastQuery()).toBe('?page=1&limit=10&sortBy=createdAt&order=asc');
    expect(screen.getByRole('columnheader', { name: /Criada em/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
  });

  it('filters by status, priority and category', async () => {
    const { lastQuery } = setup();
    await table();

    await userEvent.click(screen.getByRole('combobox', { name: 'Status' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Em resolução' }));
    await userEvent.click(screen.getByRole('combobox', { name: 'Prioridade' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Sem prioridade' }));
    await userEvent.click(screen.getByRole('combobox', { name: 'Categoria' }));
    await userEvent.click(await screen.findByRole('option', { name: 'RH' }));

    expect(lastQuery()).toBe('?page=1&limit=10&status=IN_PROGRESS&categoryId=cat-2&priority=UNSET');
  });

  it('searches by title', async () => {
    const { lastQuery } = setup();
    await table();

    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Buscar por título' }),
      'rede{Enter}',
    );

    expect(lastQuery()).toBe('?page=1&limit=10&search=rede');
  });

  it('shows an empty state for filters without results and clears them', async () => {
    const { lastQuery } = setup({ listResponse: listPage([]) });
    await screen.findByText('Nenhuma solicitação encontrada.');
    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Buscar por título' }),
      'xyz{Enter}',
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Limpar filtros' }));

    expect(lastQuery()).toBe('?page=1&limit=10');
    expect(screen.getByRole('searchbox', { name: 'Buscar por título' })).toHaveValue('');
  });

  it('paginates', async () => {
    const { lastQuery } = setup({ listResponse: listPage([listItem()], { total: 25 }) });
    await table();

    await userEvent.click(await screen.findByRole('button', { name: 'Próxima página' }));

    expect(lastQuery()).toBe('?page=2&limit=10');
  });

  it('opens the handling page from a row', async () => {
    setup();

    await userEvent.click(await screen.findByRole('link', { name: 'Notebook sem rede' }));

    expect(await screen.findByText('Tratamento da solicitação')).toBeInTheDocument();
  });
});
