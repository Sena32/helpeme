import { http, HttpResponse } from 'msw';
import { apiUrl, mswServer } from '@/test/msw-server';
import { ApiError, apiRequest } from './http-client';

describe('apiRequest', () => {
  it('returns parsed JSON and sends cookies with the request', async () => {
    let credentials: RequestCredentials | undefined;
    mswServer.use(
      http.get(apiUrl('/health'), ({ request }) => {
        credentials = request.credentials;
        return HttpResponse.json({ status: 'ok' });
      }),
    );

    await expect(apiRequest<{ status: string }>('/health')).resolves.toEqual({ status: 'ok' });
    expect(credentials).toBe('include');
  });

  it('serializes defined query params only', async () => {
    let search = '';
    mswServer.use(
      http.get(apiUrl('/requests'), ({ request }) => {
        search = new URL(request.url).search;
        return HttpResponse.json({});
      }),
    );

    await apiRequest('/requests', { query: { page: 2, status: undefined, search: 'rede wi-fi' } });

    expect(search).toBe('?page=2&search=rede+wi-fi');
  });

  it('sends JSON bodies with the JSON content type', async () => {
    let received: { contentType: string | null; body: unknown } | undefined;
    mswServer.use(
      http.post(apiUrl('/auth/login'), async ({ request }) => {
        received = { contentType: request.headers.get('content-type'), body: await request.json() };
        return HttpResponse.json({});
      }),
    );

    await apiRequest('/auth/login', { method: 'POST', body: { email: 'a@b.com' } });

    expect(received).toEqual({ contentType: 'application/json', body: { email: 'a@b.com' } });
  });

  it('lets the browser set the multipart boundary for FormData bodies', async () => {
    let contentType: string | null = null;
    mswServer.use(
      http.post(apiUrl('/requests'), ({ request }) => {
        contentType = request.headers.get('content-type');
        return HttpResponse.json({});
      }),
    );
    const formData = new FormData();
    formData.append('title', 'Teste');

    await apiRequest('/requests', { method: 'POST', body: formData });

    expect(contentType).toMatch(/^multipart\/form-data; boundary=/);
  });

  it('resolves 204 responses to undefined', async () => {
    mswServer.use(http.post(apiUrl('/auth/logout'), () => new HttpResponse(null, { status: 204 })));

    await expect(apiRequest('/auth/logout', { method: 'POST' })).resolves.toBeUndefined();
  });

  it('turns the standard error body into an ApiError', async () => {
    mswServer.use(
      http.post(apiUrl('/auth/login'), () =>
        HttpResponse.json(
          {
            statusCode: 401,
            error: 'Unauthorized',
            message: 'E-mail ou senha inválidos.',
            requestId: 'req-9',
          },
          { status: 401 },
        ),
      ),
    );

    const error = await apiRequest('/auth/login', { method: 'POST', body: {} }).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      statusCode: 401,
      messages: ['E-mail ou senha inválidos.'],
      message: 'E-mail ou senha inválidos.',
      requestId: 'req-9',
    });
  });

  it('keeps every validation message', async () => {
    mswServer.use(
      http.post(apiUrl('/auth/register'), () =>
        HttpResponse.json(
          { statusCode: 400, message: ['nome curto', 'e-mail inválido'] },
          { status: 400 },
        ),
      ),
    );

    const error = await apiRequest('/auth/register', { method: 'POST', body: {} }).catch(
      (caught: unknown) => caught,
    );

    expect(error).toMatchObject({
      messages: ['nome curto', 'e-mail inválido'],
      message: 'nome curto',
    });
  });

  it('uses a generic message when the error body is not the standard JSON', async () => {
    mswServer.use(
      http.get(
        apiUrl('/health'),
        () => new HttpResponse('<html>bad gateway</html>', { status: 502 }),
      ),
    );

    await expect(apiRequest('/health')).rejects.toMatchObject({
      statusCode: 502,
      message: 'Erro inesperado. Tente novamente.',
    });
  });

  it('reports network failures as status 0', async () => {
    mswServer.use(http.get(apiUrl('/health'), () => HttpResponse.error()));

    await expect(apiRequest('/health')).rejects.toMatchObject({
      statusCode: 0,
      message: 'Não foi possível conectar ao servidor.',
    });
  });
});
