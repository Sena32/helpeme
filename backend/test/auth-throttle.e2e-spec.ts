import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './create-test-app';

const TEST_THROTTLE_LIMIT = 2;

describe('Auth rate limit', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.THROTTLE_LIMIT = String(TEST_THROTTLE_LIMIT);
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 429 after THROTTLE_LIMIT login attempts within THROTTLE_TTL', async () => {
    const attempt = () =>
      request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'ghost@example.com', password: 'Senha123@' });

    for (let attemptNumber = 0; attemptNumber < TEST_THROTTLE_LIMIT; attemptNumber += 1) {
      expect((await attempt()).status).toBe(401);
    }

    expect((await attempt()).status).toBe(429);
  });

  it('does not throttle routes outside login/register', async () => {
    for (let attemptNumber = 0; attemptNumber <= TEST_THROTTLE_LIMIT; attemptNumber += 1) {
      expect((await request(app.getHttpServer()).get('/api/health')).status).toBe(200);
    }
  });
});
