import { INestApplication } from '@nestjs/common';
import request, { Response } from 'supertest';
import { App } from 'supertest/types';
import { Role } from '../src/common/enums/role.enum';
import { UsersService } from '../src/modules/users/users.service';
import { PublicUser } from '../src/modules/users/users.types';
import { createTestApp } from './create-test-app';

const PASSWORD = 'Senha123@';

interface UserListPage {
  items: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
}

const pageOf = (response: Response) => response.body as UserListPage;
const userOf = (response: Response) => (response.body as { user: Record<string, unknown> }).user;

describe('Users listing and editing (API-16, API-17)', () => {
  let app: INestApplication<App>;
  let adminAgent: ReturnType<typeof request.agent>;
  let userAgent: ReturnType<typeof request.agent>;
  let admin: PublicUser;
  let ana: PublicUser;
  let bruno: PublicUser;

  async function loggedAgent(email: string): Promise<ReturnType<typeof request.agent>> {
    const agent = request.agent(app.getHttpServer());
    await agent.post('/api/auth/login').send({ email, password: PASSWORD }).expect(200);
    return agent;
  }

  beforeAll(async () => {
    app = await createTestApp();
    const usersService = app.get(UsersService);
    admin = await usersService.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: PASSWORD,
      role: Role.Admin,
    });
    ana = await usersService.create({
      name: 'Ana Souza',
      email: 'ana@example.com',
      password: PASSWORD,
    });
    bruno = await usersService.create({
      name: 'Bruno Lima',
      email: 'bruno@example.com',
      password: PASSWORD,
      role: Role.Admin,
    });
    adminAgent = await loggedAgent('admin@example.com');
    userAgent = await loggedAgent('ana@example.com');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/users', () => {
    it('AC-42: filters by name/e-mail search and role, without password hashes', async () => {
      const response = await adminAgent.get('/api/users').query({ search: 'ANA', role: Role.User });

      expect(response.status).toBe(200);
      expect(pageOf(response)).toMatchObject({ total: 1, page: 1, limit: 10 });
      expect(pageOf(response).items).toEqual([
        expect.objectContaining({ id: ana.id, name: 'Ana Souza', role: Role.User }),
      ]);
      expect(pageOf(response).items[0]).not.toHaveProperty('passwordHash');
    });

    it('AC-42: searches by e-mail too', async () => {
      const response = await adminAgent.get('/api/users').query({ search: 'bruno@' });

      expect(pageOf(response).items.map((user) => user.id)).toEqual([bruno.id]);
    });

    it('AC-42: lists newest first and paginates', async () => {
      const response = await adminAgent.get('/api/users').query({ page: 2, limit: 1 });

      expect(pageOf(response)).toMatchObject({ total: 3, page: 2, limit: 1 });
      expect(pageOf(response).items.map((user) => user.id)).toEqual([ana.id]);
    });

    it('AC-42: forbids regular users (403) and rejects an unknown role (400)', async () => {
      const forbidden = await userAgent.get('/api/users');
      const invalid = await adminAgent.get('/api/users').query({ role: 'ROOT' });

      expect([forbidden.status, invalid.status]).toEqual([403, 400]);
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('AC-43: updates name, e-mail and role; the new role applies on the next login', async () => {
      const carla = await app.get(UsersService).create({
        name: 'Carla',
        email: 'carla@example.com',
        password: PASSWORD,
      });

      const response = await adminAgent
        .patch(`/api/users/${carla.id}`)
        .send({ name: '  Carla Dias ', email: ' Carla.Dias@Example.com ', role: Role.Admin });

      expect(response.status).toBe(200);
      expect(userOf(response)).toMatchObject({
        id: carla.id,
        name: 'Carla Dias',
        email: 'carla.dias@example.com',
        role: Role.Admin,
      });
      expect(userOf(response)).not.toHaveProperty('passwordHash');
      const login = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'carla.dias@example.com', password: PASSWORD });
      expect(userOf(login)).toMatchObject({ role: Role.Admin });
    });

    it('AC-44: rejects an e-mail that belongs to another user (409)', async () => {
      const response = await adminAgent
        .patch(`/api/users/${ana.id}`)
        .send({ email: 'BRUNO@example.com' });

      expect(response.status).toBe(409);
    });

    it('AC-44: keeping the user own e-mail is not a conflict', async () => {
      const response = await adminAgent
        .patch(`/api/users/${ana.id}`)
        .send({ email: 'Ana@example.com', name: 'Ana Souza' });

      expect(response.status).toBe(200);
    });

    it('AC-44: rejects an empty body or invalid fields (400)', async () => {
      const empty = await adminAgent.patch(`/api/users/${ana.id}`).send({});
      const shortName = await adminAgent.patch(`/api/users/${ana.id}`).send({ name: 'A' });
      const badRole = await adminAgent.patch(`/api/users/${ana.id}`).send({ role: 'ROOT' });
      const password = await adminAgent
        .patch(`/api/users/${ana.id}`)
        .send({ password: 'Outra123@' });

      expect([empty.status, shortName.status, badRole.status, password.status]).toEqual([
        400, 400, 400, 400,
      ]);
    });

    it('AC-44: answers 404 for unknown or malformed ids', async () => {
      const unknown = await adminAgent
        .patch('/api/users/0123456789abcdef01234567')
        .send({ name: 'Ninguém' });
      const malformed = await adminAgent.patch('/api/users/not-an-id').send({ name: 'Ninguém' });

      expect([unknown.status, malformed.status]).toEqual([404, 404]);
    });

    it('AC-44: an admin cannot change their own role (409) but can edit their name', async () => {
      const ownRole = await adminAgent.patch(`/api/users/${admin.id}`).send({ role: Role.User });
      const ownName = await adminAgent
        .patch(`/api/users/${admin.id}`)
        .send({ name: 'Admin Root', role: Role.Admin });

      expect(ownRole.status).toBe(409);
      expect(ownName.status).toBe(200);
      expect(userOf(ownName)).toMatchObject({ name: 'Admin Root', role: Role.Admin });
    });

    it('forbids regular users (403)', async () => {
      const response = await userAgent.patch(`/api/users/${ana.id}`).send({ name: 'Hacker' });

      expect(response.status).toBe(403);
    });
  });
});
