import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { requestDetails } from '@/test/fixtures';
import { apiUrl, mswServer } from '@/test/msw-server';
import { renderWithProviders } from '@/test/render';
import { RequestDetailPage } from './RequestDetailPage';

function renderDetail(id = 'req-1') {
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<p>Meu painel</p>} />
      <Route path="/solicitacoes/:requestId" element={<RequestDetailPage />} />
    </Routes>,
    { route: `/solicitacoes/${id}` },
  );
}

const detailReturns = (details: ReturnType<typeof requestDetails>) =>
  mswServer.use(
    http.get(apiUrl(`/requests/${details.id}`), () => HttpResponse.json({ request: details })),
  );

describe('RequestDetailPage (UI-08)', () => {
  it('shows the request data read-only, waiting for the admin', async () => {
    detailReturns(requestDetails());

    renderDetail();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Notebook sem rede' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Aberta')).toBeInTheDocument();
    expect(screen.getByText('Sem prioridade')).toBeInTheDocument();
    expect(screen.getByText('Infra')).toBeInTheDocument();
    expect(screen.getByText('10/03/2026, 12:30')).toBeInTheDocument();
    expect(screen.getByText(/não conecta na rede/)).toBeInTheDocument();
    expect(
      screen.getByText('O administrador ainda não adicionou observações.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Resolução' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /editar|salvar/i })).not.toBeInTheDocument();
  });

  it('shows the admin note, resolution and resolution date when resolved', async () => {
    detailReturns(
      requestDetails({
        status: 'RESOLVED',
        priority: 'HIGH',
        adminNote: 'Cabo de rede danificado.',
        resolution: 'Cabo substituído e conexão testada.',
        resolvedAt: '2026-03-11T13:00:00.000Z',
      }),
    );

    renderDetail();

    expect(await screen.findByText('Finalizada')).toBeInTheDocument();
    expect(screen.getByText('Alta')).toBeInTheDocument();
    expect(screen.getByText('Cabo de rede danificado.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Resolução' })).toBeInTheDocument();
    expect(screen.getByText('Cabo substituído e conexão testada.')).toBeInTheDocument();
    expect(screen.getByText('Finalizada em 11/03/2026, 10:00')).toBeInTheDocument();
  });

  it('shows attachment thumbnails served by the protected endpoint', async () => {
    detailReturns(
      requestDetails({
        attachments: [
          { id: 'att-1', originalName: 'tela.png', mimeType: 'image/png', sizeBytes: 2048 },
        ],
      }),
    );

    renderDetail();

    const thumbnail = await screen.findByRole('img', { name: 'tela.png' });
    expect(thumbnail).toHaveAttribute('src', '/api/requests/req-1/attachments/att-1');
    expect(screen.queryByRole('link', { name: /nova aba/ })).not.toBeInTheDocument();
  });

  it('AC-40: opens the image enlarged in a modal on the same page and closes it', async () => {
    detailReturns(
      requestDetails({
        attachments: [
          { id: 'att-1', originalName: 'tela.png', mimeType: 'image/png', sizeBytes: 2048 },
        ],
      }),
    );
    renderDetail();
    const thumbnailButton = await screen.findByRole('button', { name: 'Ampliar tela.png (2 KB)' });

    await userEvent.click(thumbnailButton);

    const dialog = await screen.findByRole('dialog', { name: 'tela.png' });
    expect(within(dialog).getByRole('img', { name: 'tela.png' })).toHaveAttribute(
      'src',
      '/api/requests/req-1/attachments/att-1',
    );
    expect(within(dialog).getByText('2 KB')).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Fechar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(thumbnailButton).toHaveFocus();
  });

  it('AC-40: closes the modal with Escape', async () => {
    detailReturns(
      requestDetails({
        attachments: [
          { id: 'att-1', originalName: 'tela.png', mimeType: 'image/png', sizeBytes: 2048 },
        ],
      }),
    );
    renderDetail();

    await userEvent.click(await screen.findByRole('button', { name: 'Ampliar tela.png (2 KB)' }));
    await screen.findByRole('dialog', { name: 'tela.png' });
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('says when there are no attachments', async () => {
    detailReturns(requestDetails());

    renderDetail();

    expect(await screen.findByText('Nenhum anexo enviado.')).toBeInTheDocument();
  });

  it('AC-15: shows not found (with a way back) for a request the user cannot see', async () => {
    mswServer.use(
      http.get(apiUrl('/requests/req-9'), () =>
        HttpResponse.json(
          { statusCode: 404, message: 'Solicitação não encontrada.' },
          { status: 404 },
        ),
      ),
    );

    renderDetail('req-9');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Solicitação não encontrada' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Voltar ao painel' }));
    expect(await screen.findByText('Meu painel')).toBeInTheDocument();
  });

  it('offers retry on unexpected errors', async () => {
    let attempts = 0;
    mswServer.use(
      http.get(apiUrl('/requests/req-1'), () => {
        attempts += 1;
        return attempts === 1
          ? HttpResponse.json({ statusCode: 500, message: 'Erro.' }, { status: 500 })
          : HttpResponse.json({ request: requestDetails() });
      }),
    );
    renderDetail();

    await userEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Notebook sem rede' }),
    ).toBeInTheDocument();
  });
});
