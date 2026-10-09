import { INestApplication } from '@nestjs/common';
import { Writable } from 'node:stream';
import request from 'supertest';
import { App } from 'supertest/types';
import { UsersService } from '../src/modules/users/users.service';
import { createTestApp } from './create-test-app';

const PASSWORD = 'Senha123@';
type LogLine = Record<string, unknown> & { requestId?: string; userId?: string; msg?: string };

class CapturedLog extends Writable {
  readonly lines: string[] = [];

  override _write(chunk: Buffer, _encoding: BufferEncoding, done: () => void): void {
    this.lines.push(...chunk.toString().split('\n').filter(Boolean));
    done();
  }

  entriesFor(requestId: string): LogLine[] {
    return this.lines
      .map((line) => JSON.parse(line) as LogLine)
      .filter((entry) => entry.requestId === requestId);
  }
}

describe('Structured logs and error format (AC-31)', () => {
  let app: INestApplication<App>;
  const capturedLog = new CapturedLog();

  beforeAll(async () => {
    process.env.LOG_LEVEL = 'info';
    app = await createTestApp({ logDestination: capturedLog });
    await app
      .get(UsersService)
      .create({ name: 'Maria', email: 'maria@example.com', password: PASSWORD });
  });

  afterAll(async () => {
    await app.close();
  });

  it('AC-31: logs the login as JSON with requestId and without password or token', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'maria@example.com', password: PASSWORD });
    const requestId = String(response.headers['x-request-id']);
    const token = String(response.headers['set-cookie']).split(';')[0].split('=')[1];

    const entries = capturedLog.entriesFor(requestId);

    expect(entries.length).toBeGreaterThan(0);
    expect(entries.at(-1)).toMatchObject({
      requestId,
      req: { method: 'POST', url: '/api/auth/login' },
      res: { statusCode: 200 },
      responseTime: expect.any(Number),
    });
    const serialized = JSON.stringify(entries);
    expect(serialized).not.toContain(PASSWORD);
    expect(serialized).not.toContain(token);
    expect(serialized).not.toContain('access_token');
  });

  it('includes the userId of authenticated requests', async () => {
    const agent = request.agent(app.getHttpServer());
    const login = await agent
      .post('/api/auth/login')
      .send({ email: 'maria@example.com', password: PASSWORD });
    const userId = (login.body as { user: { id: string } }).user.id;

    const response = await agent.get('/api/auth/me');

    expect(capturedLog.entriesFor(String(response.headers['x-request-id'])).at(-1)).toMatchObject({
      userId,
    });
  });

  it('reuses a well-formed incoming X-Request-Id', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .set('X-Request-Id', 'trace-42');

    expect(response.headers['x-request-id']).toBe('trace-42');
    expect(capturedLog.entriesFor('trace-42')).not.toHaveLength(0);
  });

  it('answers errors as { statusCode, error, message, requestId } matching the header', async () => {
    const response = await request(app.getHttpServer()).get('/api/rota-inexistente');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'Recurso não encontrado.',
      requestId: response.headers['x-request-id'],
    });
  });

  it('keeps validation messages in the standard error format', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'M', email: 'invalido', password: PASSWORD });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: expect.arrayContaining([expect.any(String)]),
      requestId: expect.any(String),
    });
  });
});
