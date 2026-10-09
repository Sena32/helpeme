import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import request, { Response } from 'supertest';
import { App } from 'supertest/types';
import { Role } from '../src/common/enums/role.enum';
import { Category } from '../src/modules/categories/schemas/category.model';
import { ServiceRequest } from '../src/modules/requests/schemas/service-request.model';
import { UsersService } from '../src/modules/users/users.service';
import { createTestApp } from './create-test-app';

const PASSWORD = 'Senha123@';
type Agent = ReturnType<typeof request.agent>;
type RequestView = Record<string, unknown> & { id: string };
const requestOf = (response: Response) => (response.body as { request: RequestView }).request;

describe('PATCH /api/requests/:id (API-11)', () => {
  let app: INestApplication<App>;
  let adminAgent: Agent;
  let ownerAgent: Agent;
  let categoryId: string;
  let requestModel: Model<ServiceRequest>;

  async function loggedAgent(email: string): Promise<Agent> {
    const agent = request.agent(app.getHttpServer());
    await agent.post('/api/auth/login').send({ email, password: PASSWORD }).expect(200);
    return agent;
  }

  async function openRequest(): Promise<string> {
    const response = await ownerAgent.post('/api/requests').send({
      title: 'Sem acesso ao ERP',
      categoryId,
      description: 'Desde hoje cedo o ERP recusa meu login com mensagem de erro genérica.',
    });
    return requestOf(response).id;
  }

  const patch = (id: string, body: object) => adminAgent.patch(`/api/requests/${id}`).send(body);

  beforeAll(async () => {
    app = await createTestApp();
    const usersService = app.get(UsersService);
    await usersService.create({ name: 'Dono', email: 'owner@example.com', password: PASSWORD });
    await usersService.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: PASSWORD,
      role: Role.Admin,
    });
    categoryId = (
      await app.get<Model<Category>>(getModelToken(Category.name)).create({ name: 'Infra' })
    )._id.toString();
    requestModel = app.get(getModelToken(ServiceRequest.name));
    adminAgent = await loggedAgent('admin@example.com');
    ownerAgent = await loggedAgent('owner@example.com');
  });

  afterAll(async () => {
    await app.close();
  });

  it('AC-19: admin sets priority HIGH and priorityRank becomes 3', async () => {
    const id = await openRequest();

    const response = await patch(id, { priority: 'HIGH' });

    expect(response.status).toBe(200);
    expect(requestOf(response).priority).toBe('HIGH');
    await expect(requestModel.findById(id).lean()).resolves.toMatchObject({ priorityRank: 3 });
  });

  it('AC-20: admin moves to IN_PROGRESS with a note', async () => {
    const id = await openRequest();

    const response = await patch(id, { status: 'IN_PROGRESS', adminNote: 'Analisando logs' });

    expect(requestOf(response)).toMatchObject({
      status: 'IN_PROGRESS',
      adminNote: 'Analisando logs',
    });
  });

  it('AC-21: resolving without resolution returns 400', async () => {
    const id = await openRequest();
    await patch(id, { status: 'IN_PROGRESS' }).expect(200);

    const response = await patch(id, { status: 'RESOLVED' });

    expect(response.status).toBe(400);
  });

  it('AC-22: resolving with resolution sets RESOLVED and resolvedAt', async () => {
    const id = await openRequest();
    await patch(id, { status: 'IN_PROGRESS' }).expect(200);

    const response = await patch(id, { status: 'RESOLVED', resolution: 'Senha redefinida.' });

    expect(response.status).toBe(200);
    expect(requestOf(response)).toMatchObject({
      status: 'RESOLVED',
      resolution: 'Senha redefinida.',
    });
    expect(Date.parse(String(requestOf(response).resolvedAt))).not.toBeNaN();
  });

  it('AC-23: changing the status of a RESOLVED request returns 409', async () => {
    const id = await openRequest();
    await patch(id, { status: 'RESOLVED', resolution: 'Resolvido.' }).expect(200);

    const response = await patch(id, { status: 'IN_PROGRESS' });

    expect(response.status).toBe(409);
  });

  it('AC-16: a regular user cannot PATCH, even their own request (403)', async () => {
    const id = await openRequest();

    const response = await ownerAgent.patch(`/api/requests/${id}`).send({ priority: 'HIGH' });

    expect(response.status).toBe(403);
  });

  it.each([
    [{ priority: 'URGENT' }],
    [{ status: 'CLOSED' }],
    [{ adminNote: 'n'.repeat(501) }],
    [{ status: 'RESOLVED', resolution: 'r'.repeat(1001) }],
    [{ title: 'trocar título' }],
    [{}],
  ])('rejects invalid body %j with 400', async (body) => {
    const id = await openRequest();

    const response = await patch(id, body);

    expect(response.status).toBe(400);
  });

  it('returns 404 for unknown or malformed ids', async () => {
    const unknown = await patch('64b7f0c2a1b2c3d4e5f60718', { priority: 'LOW' });
    const malformed = await patch('abc', { priority: 'LOW' });

    expect([unknown.status, malformed.status]).toEqual([404, 404]);
  });
});
