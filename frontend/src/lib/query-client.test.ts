import { http, HttpResponse } from 'msw';
import { CURRENT_USER_QUERY_KEY } from '@/hooks/useAuth';
import { regularUser } from '@/test/fixtures';
import { apiUrl, mswServer } from '@/test/msw-server';
import { apiRequest } from '@/api/http-client';
import { createQueryClient } from './query-client';

describe('createQueryClient', () => {
  it('AC-28: drops the session when any query answers 401 (expired cookie)', async () => {
    mswServer.use(
      http.get(apiUrl('/requests'), () =>
        HttpResponse.json({ statusCode: 401, message: 'Sessão expirada.' }, { status: 401 }),
      ),
    );
    const queryClient = createQueryClient({ retry: false });
    queryClient.setQueryData(CURRENT_USER_QUERY_KEY, regularUser);

    await queryClient
      .fetchQuery({ queryKey: ['requests'], queryFn: () => apiRequest('/requests') })
      .catch(() => undefined);

    expect(queryClient.getQueryData(CURRENT_USER_QUERY_KEY)).toBeNull();
  });
});
