import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { requestDetails } from '@/test/fixtures';
import { disguisedExecutable, jpegFile, pdfFile, pngFile } from '@/test/files';
import { apiUrl, mswServer } from '@/test/msw-server';
import { renderWithProviders } from '@/test/render';
import { NewRequestPage } from './NewRequestPage';

const categories = [
  { id: 'cat-1', name: 'Infra' },
  { id: 'cat-2', name: 'RH' },
];
const user = () => userEvent.setup({ applyAccept: false });

function renderPage() {
  mswServer.use(http.get(apiUrl('/categories'), () => HttpResponse.json(categories)));
  return renderWithProviders(
    <Routes>
      <Route path="/solicitacoes/nova" element={<NewRequestPage />} />
      <Route path="/solicitacoes/:requestId" element={<p>Detalhe da solicitação criada</p>} />
    </Routes>,
    { route: '/solicitacoes/nova' },
  );
}

async function fillValidFields(actor: ReturnType<typeof user>) {
  await actor.type(screen.getByLabelText('Título'), 'Notebook sem rede');
  await actor.click(screen.getByRole('combobox', { name: 'Categoria' }));
  await actor.click(await screen.findByRole('option', { name: 'Infra' }));
  await actor.type(
    screen.getByLabelText('Descrição'),
    'O notebook do financeiro não conecta na rede desde ontem cedo.',
  );
}

const attachmentsInput = () => screen.getByLabelText('Anexos (opcional)');
const fileErrors = () => screen.getByRole('alert', { name: 'Problemas com os anexos' });

describe('NewRequestPage (UI-07)', () => {
  it('shows the form with a live description counter', async () => {
    const actor = user();
    renderPage();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Nova solicitação' }),
    ).toBeInTheDocument();
    expect(screen.getByText('0/1000')).toBeInTheDocument();
    await actor.type(screen.getByLabelText('Descrição'), 'abc');
    expect(screen.getByText('3/1000')).toBeInTheDocument();
  });

  it('AC-11: blocks a 49-char description without calling the API', async () => {
    const actor = user();
    let posted = false;
    mswServer.use(http.post(apiUrl('/requests'), () => ((posted = true), HttpResponse.json({}))));
    renderPage();
    await screen.findByLabelText('Título');
    await fillValidFields(actor);
    await actor.clear(screen.getByLabelText('Descrição'));
    await actor.type(screen.getByLabelText('Descrição'), 'd'.repeat(49));

    await actor.click(screen.getByRole('button', { name: 'Enviar solicitação' }));

    expect(
      await screen.findByText('A descrição deve ter entre 50 e 1000 caracteres.'),
    ).toBeInTheDocument();
    expect(posted).toBe(false);
  });

  it('shows previews of selected images and lets the user remove one', async () => {
    const actor = user();
    renderPage();

    await actor.upload(await screen.findByLabelText('Anexos (opcional)'), [
      pngFile('tela.png'),
      jpegFile('foto.jpg'),
    ]);

    expect(
      await screen.findByRole('img', { name: 'Pré-visualização de tela.png' }),
    ).toHaveAttribute('src', 'blob:preview/tela.png');
    await actor.click(screen.getByRole('button', { name: 'Remover tela.png' }));
    expect(
      screen.queryByRole('img', { name: 'Pré-visualização de tela.png' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Pré-visualização de foto.jpg' })).toBeInTheDocument();
  });

  it('AC-12: refuses a PDF and a renamed executable', async () => {
    const actor = user();
    renderPage();

    await actor.upload(await screen.findByLabelText('Anexos (opcional)'), [
      pdfFile(),
      disguisedExecutable(),
    ]);

    expect(
      await within(fileErrors()).findByText('doc.pdf: envie apenas imagens JPG ou PNG.'),
    ).toBeInTheDocument();
    expect(
      within(fileErrors()).getByText('virus.png: o conteúdo não é uma imagem JPG ou PNG válida.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('AC-13: refuses an image of 5 MB + 1 byte', async () => {
    const actor = user();
    renderPage();

    await actor.upload(
      await screen.findByLabelText('Anexos (opcional)'),
      pngFile('grande.png', 5 * 1024 * 1024 + 1),
    );

    expect(
      await within(fileErrors()).findByText('grande.png: o arquivo excede 5 MB.'),
    ).toBeInTheDocument();
  });

  it('AC-14: keeps at most 5 attachments', async () => {
    const actor = user();
    renderPage();
    const files = Array.from({ length: 6 }, (_unused, index) => pngFile(`tela-${index}.png`));

    await actor.upload(await screen.findByLabelText('Anexos (opcional)'), files);

    expect(
      await within(fileErrors()).findByText('tela-5.png: limite de 5 anexos por solicitação.'),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(5);
    expect(screen.getByText('5 de 5 anexos')).toBeInTheDocument();
  });

  it('sends a multipart request, confirms with a toast and opens the new request', async () => {
    const actor = user();
    let multipartBody = '';
    let contentType: string | null = null;
    mswServer.use(
      // Parsed as text: MSW's formData() cannot read jsdom File instances.
      http.post(apiUrl('/requests'), async ({ request }) => {
        contentType = request.headers.get('content-type');
        multipartBody = await request.text();
        return HttpResponse.json({ request: requestDetails({ id: 'req-42' }) }, { status: 201 });
      }),
    );
    renderPage();
    await screen.findByLabelText('Título');
    await fillValidFields(actor);
    await actor.upload(attachmentsInput(), pngFile('tela.png'));
    await screen.findByRole('img', { name: 'Pré-visualização de tela.png' });

    await actor.click(screen.getByRole('button', { name: 'Enviar solicitação' }));

    expect(await screen.findByText('Detalhe da solicitação criada')).toBeInTheDocument();
    expect(await screen.findByText('Solicitação enviada com sucesso.')).toBeInTheDocument();
    expect(contentType).toMatch(/^multipart\/form-data; boundary=/);
    expect(multipartBody).toContain('name="title"\r\n\r\nNotebook sem rede');
    expect(multipartBody).toContain('name="categoryId"\r\n\r\ncat-1');
    expect(multipartBody).toContain('name="description"\r\n\r\nO notebook do financeiro');
    // Node's fetch cannot read jsdom File names, so only the part and its type are asserted here.
    expect(multipartBody).toMatch(/name="files"; filename="[^"]+"\r\nContent-Type: image\/png/);
  });

  it('shows the API error when the server refuses the upload', async () => {
    const actor = user();
    mswServer.use(
      http.post(apiUrl('/requests'), () =>
        HttpResponse.json(
          { statusCode: 413, message: 'Arquivo excede o tamanho máximo permitido.' },
          { status: 413 },
        ),
      ),
    );
    renderPage();
    await screen.findByLabelText('Título');
    await fillValidFields(actor);

    await actor.click(screen.getByRole('button', { name: 'Enviar solicitação' }));

    expect(
      await screen.findByText('Arquivo excede o tamanho máximo permitido.'),
    ).toBeInTheDocument();
  });
});
