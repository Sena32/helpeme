import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { listItem, listPage, summary } from '@/test/fixtures';
import { apiUrl, mswServer } from '@/test/msw-server';
import { renderWithProviders } from '@/test/render';
import { UserDashboardPage } from './UserDashboardPage';

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<UserDashboardPage />} />
      <Route path="/solicitacoes/nova" element={<p>Formulário de nova solicitação</p>} />
      <Route path="/solicitacoes/:requestId" element={<p>Detalhe aberto</p>} />
    </Routes>,
  );
}

const summaryHandler = () =>
  http.get(apiUrl('/dashboard/summary'), () => HttpResponse.json(summary()));

describe('UserDashboardPage (UI-06)', () => {
  it('shows own KPIs and the request list with status and priority', async () => {
    let requestedQuery = '';
    mswServer.use(
      summaryHandler(),
      http.get(apiUrl('/requests'), ({ request }) => {
        requestedQuery = new URL(request.url).search;
        return HttpResponse.json(
          listPage([
            listItem(),
            listItem({
              id: 'req-2',
              title: 'Senha expirada',
              status: 'RESOLVED',
              priority: 'HIGH',
            }),
          ]),
        );
      }),
    );

    renderPage();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Meu painel' }),
    ).toBeInTheDocument();
    const kpis = await screen.findByRole('region', { name: 'Resumo das suas solicitações' });
    expect(within(kpis).getByText('Total').nextSibling).toHaveTextContent('6');
    expect(within(kpis).getByText('Abertas').nextSibling).toHaveTextContent('3');
    expect(within(kpis).getByText('Em resolução').nextSibling).toHaveTextContent('2');
    expect(within(kpis).getByText('Finalizadas').nextSibling).toHaveTextContent('1');

    const table = await screen.findByRole('table', { name: 'Minhas solicitações' });
    const row = within(table).getByRole('row', { name: /Senha expirada/ });
    expect(within(row).getByText('Finalizada')).toBeInTheDocument();
    expect(within(row).getByText('Alta')).toBeInTheDocument();
    expect(requestedQuery).toBe('?page=1&limit=10&sortBy=createdAt&order=desc');
  });

  it('opens the request detail from the list', async () => {
    mswServer.use(
      summaryHandler(),
      http.get(apiUrl('/requests'), () => HttpResponse.json(listPage([listItem()]))),
    );
    renderPage();

    await userEvent.click(await screen.findByRole('link', { name: 'Notebook sem rede' }));

    expect(await screen.findByText('Detalhe aberto')).toBeInTheDocument();
  });

  it('shows an empty state inviting to open the first request', async () => {
    mswServer.use(
      summaryHandler(),
      http.get(apiUrl('/requests'), () => HttpResponse.json(listPage([]))),
    );
    renderPage();

    expect(await screen.findByText('Você ainda não abriu solicitações.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Abrir solicitação' }));
    expect(await screen.findByText('Formulário de nova solicitação')).toBeInTheDocument();
  });

  it('shows an error with retry that reloads the list', async () => {
    let attempts = 0;
    mswServer.use(
      summaryHandler(),
      http.get(apiUrl('/requests'), () => {
        attempts += 1;
        return attempts === 1
          ? HttpResponse.json({ statusCode: 500, message: 'Erro interno.' }, { status: 500 })
          : HttpResponse.json(listPage([listItem()]));
      }),
    );
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('link', { name: 'Notebook sem rede' })).toBeInTheDocument();
  });

  it('paginates the list', async () => {
    const pagesRequested: string[] = [];
    mswServer.use(
      summaryHandler(),
      http.get(apiUrl('/requests'), ({ request }) => {
        const page = new URL(request.url).searchParams.get('page') ?? '';
        pagesRequested.push(page);
        return HttpResponse.json(
          listPage([listItem({ id: `req-${page}`, title: `Solicitação da página ${page}` })], {
            total: 12,
            page: Number(page),
          }),
        );
      }),
    );
    renderPage();

    expect(await screen.findByText('Página 1 de 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Próxima página' }));

    expect(await screen.findByText('Solicitação da página 2')).toBeInTheDocument();
    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument();
    expect(pagesRequested).toEqual(['1', '2']);
  });

  it('shows skeletons while loading', () => {
    mswServer.use(
      summaryHandler(),
      http.get(apiUrl('/requests'), () => HttpResponse.json(listPage([]))),
    );

    renderPage();

    expect(screen.getAllByRole('status', { name: 'Carregando' }).length).toBeGreaterThan(0);
  });
});
