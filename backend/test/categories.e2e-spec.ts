import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { Role } from '../src/common/enums/role.enum';
import { UsersService } from '../src/modules/users/users.service';
import { createTestApp } from './create-test-app';

const PASSWORD = 'Senha123@';

describe('Categories (API-06, API-07)', () => {
  let app: INestApplication<App>;
  let adminAgent: ReturnType<typeof request.agent>;
  let userAgent: ReturnType<typeof request.agent>;

  async function loggedAgent(email: string): Promise<ReturnType<typeof request.agent>> {
    const agent = request.agent(app.getHttpServer());
    await agent.post('/api/auth/login').send({ email, password: PASSWORD }).expect(200);
    return agent;
  }

  beforeAll(async () => {
    app = await createTestApp();
    const usersService = app.get(UsersService);
    await usersService.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: PASSWORD,
      role: Role.Admin,
    });
    await usersService.create({ name: 'Comum', email: 'comum@example.com', password: PASSWORD });
    adminAgent = await loggedAgent('admin@example.com');
    userAgent = await loggedAgent('comum@example.com');
  });

  afterAll(async () => {
    await app.close();
  });

  it('AC-24: admin creates "Segurança" (201) and "segurança" again is 409', async () => {
    const created = await adminAgent.post('/api/categories').send({ name: 'Segurança' });
    const duplicated = await adminAgent.post('/api/categories').send({ name: 'segurança' });

    expect(created.status).toBe(201);
    expect(created.body).toEqual({ id: expect.any(String), name: 'Segurança' });
    expect(duplicated.status).toBe(409);
  });

  it('RN-04: rejects names shorter than 2 or longer than 50 chars with 400', async () => {
    const tooShort = await adminAgent.post('/api/categories').send({ name: ' a ' });
    const tooLong = await adminAgent.post('/api/categories').send({ name: 'x'.repeat(51) });

    expect([tooShort.status, tooLong.status]).toEqual([400, 400]);
  });

  it('forbids a regular user from creating categories (403)', async () => {
    const response = await userAgent.post('/api/categories').send({ name: 'Telefonia' });

    expect(response.status).toBe(403);
  });

  it('lists active categories as { id, name } for any authenticated user', async () => {
    const response = await userAgent.get('/api/categories');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([{ id: expect.any(String), name: 'Segurança' }]),
    );
  });

  it('requires authentication to list categories (401)', async () => {
    const response = await request(app.getHttpServer()).get('/api/categories');

    expect(response.status).toBe(401);
  });
});
