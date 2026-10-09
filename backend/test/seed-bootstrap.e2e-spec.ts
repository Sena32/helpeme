import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './create-test-app';
import { validEnv } from './env.fixture';

describe('Seed on bootstrap (RF-04)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.RUN_SEED = 'true';
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('lets the admin root log in and see the default categories right after boot', async () => {
    const agent = request.agent(app.getHttpServer());

    const login = await agent
      .post('/api/auth/login')
      .send({ email: validEnv.ADMIN_ROOT_EMAIL, password: validEnv.ADMIN_ROOT_PASSWORD });
    const categories = await agent.get('/api/categories');

    expect(login.status).toBe(200);
    expect((login.body as { user: { role: string } }).user.role).toBe('ADMIN');
    expect(categories.body).toHaveLength(5);
  });
});
