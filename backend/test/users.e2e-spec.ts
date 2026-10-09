import { INestApplication } from '@nestjs/common';
import request, { Response } from 'supertest';
import { App } from 'supertest/types';
import { Role } from '../src/common/enums/role.enum';
import { UsersService } from '../src/modules/users/users.service';
import { createTestApp } from './create-test-app';

const PASSWORD = 'Senha123@';
const userOf = (response: Response) => (response.body as { user: Record<string, unknown> }).user;

describe('POST /api/users (API-05)', () => {
  let app: INestApplication<App>;
  let adminAgent: ReturnType<typeof request.agent>;
  let userAgent: ReturnType<typeof request.agent>;
  let emailSequence = 0;

  const uniqueEmail = () => `created${(emailSequence += 1)}@example.com`;
  const newUserBody = (role: Role) => ({
    name: 'Novo Usuário',
    email: uniqueEmail(),
    password: PASSWORD,
    role,
  });

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

  it('AC-07: lets an admin create another admin', async () => {
    const response = await adminAgent.post('/api/users').send(newUserBody(Role.Admin));

    expect(response.status).toBe(201);
    expect(userOf(response)).toMatchObject({ role: Role.Admin });
    expect(userOf(response)).not.toHaveProperty('passwordHash');
  });

  it('lets an admin create a regular user', async () => {
    const response = await adminAgent.post('/api/users').send(newUserBody(Role.User));

    expect(response.status).toBe(201);
    expect(userOf(response)).toMatchObject({ role: Role.User });
  });

  it('AC-08: forbids a regular user from creating an admin with 403', async () => {
    const response = await userAgent.post('/api/users').send(newUserBody(Role.Admin));

    expect(response.status).toBe(403);
  });

  it('requires authentication (401)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/users')
      .send(newUserBody(Role.Admin));

    expect(response.status).toBe(401);
  });

  it('returns 409 for an email already registered (RN-01)', async () => {
    const response = await adminAgent
      .post('/api/users')
      .send({ ...newUserBody(Role.User), email: 'COMUM@example.com' });

    expect(response.status).toBe(409);
  });

  it('returns 400 for an unknown role, missing role or weak password', async () => {
    const unknownRole = await adminAgent
      .post('/api/users')
      .send({ ...newUserBody(Role.User), role: 'ROOT' });
    const { role: _omitted, ...withoutRole } = newUserBody(Role.User);
    const missingRole = await adminAgent.post('/api/users').send(withoutRole);
    const weakPassword = await adminAgent
      .post('/api/users')
      .send({ ...newUserBody(Role.User), password: 'abc123' });

    expect([unknownRole.status, missingRole.status, weakPassword.status]).toEqual([400, 400, 400]);
  });
});
