import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { requestDetails } from '@/test/fixtures';
import { apiUrl, mswServer } from '@/test/msw-server';
import { renderWithProviders } from '@/test/render';
import type { RequestDetails } from '@/types/requests';
import { AdminRequestPage } from './AdminRequestPage';

type Patch = Record<string, unknown>;

function setup(initial: RequestDetails, respond?: (patch: Patch) => Response) {
  const patches: Patch[] = [];
  let current = initial;
  mswServer.use(
    http.get(apiUrl(`/requests/${initial.id}`), () => HttpResponse.json({ request: current })),
    http.patch(apiUrl(`/requests/${initial.id}`), async ({ request }) => {
      const patch = (await request.json()) as Patch;
      patches.push(patch);
      if (respond) return respond(patch);
      current = { ...current, ...(patch as Partial<RequestDetails>) };
      if (patch.status === 'RESOLVED')
        current = { ...current, resolvedAt: '2026-03-11T13:00:00.000Z' };
      return HttpResponse.json({ request: current });
    }),
  );
  renderWithProviders(
    <Routes>
      <Route path="/admin" element={<p>Painel admin</p>} />
      <Route path="/admin/solicitacoes/:requestId" element={<AdminRequestPage />} />
    </Routes>,
    { route: `/admin/solicitacoes/${initial.id}` },
  );
  return { patches };
}

const handling = () => screen.findByRole('form', { name: 'Classificação e andamento' });

async function choose(comboboxName: string, optionName: string) {
  await userEvent.click(screen.getByRole('combobox', { name: comboboxName }));
  await userEvent.click(await screen.findByRole('option', { name: optionName }));
}

describe('AdminRequestPage (UI-03)', () => {
  it('shows request data, requester and the handling controls', async () => {
    setup(
      requestDetails({
        attachments: [
          { id: 'att-1', originalName: 'tela.png', mimeType: 'image/png', sizeBytes: 2048 },
        ],
      }),
    );

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Notebook sem rede' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByText('Solicitado por Maria Silva')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'tela.png' })).toBeInTheDocument();
    const form = await handling();
    expect(within(form).getByRole('combobox', { name: 'Prioridade' })).toHaveTextContent(
      'Sem prioridade',
    );
    expect(within(form).getByRole('combobox', { name: 'Status' })).toHaveTextContent('Aberta');
    expect(within(form).getByRole('button', { name: 'Salvar alterações' })).toBeDisabled();
  });

  it('AC-19: classifies the priority and sends only what changed', async () => {
    const { patches } = setup(requestDetails());
    await handling();

    await choose('Prioridade', 'Alta');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('Alterações salvas.')).toBeInTheDocument();
    expect(patches).toEqual([{ priority: 'HIGH' }]);
  });

  it('AC-20: moves to "Em resolução" with a note', async () => {
    const { patches } = setup(requestDetails());
    await handling();

    await choose('Status', 'Em resolução');
    await userEvent.type(screen.getByLabelText('Observação'), 'Analisando os logs do switch.');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('Alterações salvas.')).toBeInTheDocument();
    expect(patches).toEqual([
      { status: 'IN_PROGRESS', adminNote: 'Analisando os logs do switch.' },
    ]);
  });

  it('RN-07: does not offer moving an in-progress request back to open', async () => {
    setup(requestDetails({ status: 'IN_PROGRESS' }));
    await handling();

    await userEvent.click(screen.getByRole('combobox', { name: 'Status' }));

    expect(await screen.findByRole('option', { name: 'Em resolução' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Aberta' })).not.toBeInTheDocument();
  });

  it('validates the 500-char limit of the note', async () => {
    const { patches } = setup(requestDetails());
    await handling();

    await userEvent.click(screen.getByLabelText('Observação'));
    await userEvent.paste('n'.repeat(501));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(
      await screen.findByText('A observação deve ter no máximo 500 caracteres.'),
    ).toBeInTheDocument();
    expect(patches).toEqual([]);
  });

  it('AC-21: does not finalize without a resolution', async () => {
    const { patches } = setup(requestDetails({ status: 'IN_PROGRESS' }));
    await handling();

    await userEvent.click(screen.getByRole('button', { name: 'Finalizar solicitação' }));

    expect(await screen.findByText('Informe a resolução para finalizar.')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(patches).toEqual([]);
  });

  it('AC-22: finalizes after confirmation and becomes read-only', async () => {
    const { patches } = setup(requestDetails({ status: 'IN_PROGRESS' }));
    await handling();

    await userEvent.type(screen.getByLabelText('Resolução'), 'Cabo substituído.');
    await userEvent.click(screen.getByRole('button', { name: 'Finalizar solicitação' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Finalizar solicitação?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Finalizar' }));

    expect(await screen.findByText('Solicitação finalizada.')).toBeInTheDocument();
    expect(patches).toEqual([{ status: 'RESOLVED', resolution: 'Cabo substituído.' }]);
    expect(await screen.findByText('Finalizada em 11/03/2026, 10:00')).toBeInTheDocument();
    expect(
      screen.queryByRole('form', { name: 'Classificação e andamento' }),
    ).not.toBeInTheDocument();
  });

  it('lets the admin cancel the finalization', async () => {
    const { patches } = setup(requestDetails());
    await handling();

    await userEvent.type(screen.getByLabelText('Resolução'), 'Resolvido.');
    await userEvent.click(screen.getByRole('button', { name: 'Finalizar solicitação' }));
    await userEvent.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Cancelar' }),
    );

    expect(patches).toEqual([]);
  });

  it('AC-23: shows a resolved request read-only', async () => {
    setup(
      requestDetails({
        status: 'RESOLVED',
        adminNote: 'Cabo danificado.',
        resolution: 'Cabo substituído.',
        resolvedAt: '2026-03-11T13:00:00.000Z',
      }),
    );

    expect(
      await screen.findByText('Esta solicitação foi finalizada e não pode mais ser alterada.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Cabo substituído.')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Finalizar solicitação' })).not.toBeInTheDocument();
  });

  it('shows API conflicts (409) to the admin', async () => {
    setup(requestDetails(), () =>
      HttpResponse.json(
        {
          statusCode: 409,
          message: 'A solicitação foi alterada por outra pessoa. Recarregue e tente novamente.',
        },
        { status: 409 },
      ),
    );
    await handling();

    await choose('Prioridade', 'Baixa');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A solicitação foi alterada por outra pessoa.',
    );
  });

  it('shows not found with a way back to the admin panel', async () => {
    mswServer.use(
      http.get(apiUrl('/requests/missing'), () =>
        HttpResponse.json(
          { statusCode: 404, message: 'Solicitação não encontrada.' },
          { status: 404 },
        ),
      ),
    );
    renderWithProviders(
      <Routes>
        <Route path="/admin" element={<p>Painel admin</p>} />
        <Route path="/admin/solicitacoes/:requestId" element={<AdminRequestPage />} />
      </Routes>,
      { route: '/admin/solicitacoes/missing' },
    );

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Solicitação não encontrada' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Voltar ao painel' }));
    expect(await screen.findByText('Painel admin')).toBeInTheDocument();
  });

  it('AC-37: validates the note and the resolution while typing', async () => {
    setup(requestDetails());
    await handling();
    const note = screen.getByLabelText('Observação');
    const resolution = screen.getByLabelText('Resolução');

    await userEvent.click(note);
    await userEvent.paste('n'.repeat(501));
    expect(
      await screen.findByText('A observação deve ter no máximo 500 caracteres.'),
    ).toBeInTheDocument();
    await userEvent.type(note, '{Backspace}');
    expect(
      screen.queryByText('A observação deve ter no máximo 500 caracteres.'),
    ).not.toBeInTheDocument();

    await userEvent.type(resolution, 'x');
    await userEvent.clear(resolution);
    expect(await screen.findByText('Informe a resolução para finalizar.')).toBeInTheDocument();
  });
});
