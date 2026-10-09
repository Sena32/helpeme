import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import request, { Response } from 'supertest';
import { App } from 'supertest/types';
import { Priority, PRIORITY_RANK, UNSET_PRIORITY_RANK } from '../src/common/enums/priority.enum';
import { RequestStatus } from '../src/common/enums/request-status.enum';
import { Role } from '../src/common/enums/role.enum';
import { Category } from '../src/modules/categories/schemas/category.model';
import { ServiceRequest } from '../src/modules/requests/schemas/service-request.model';
import { UsersService } from '../src/modules/users/users.service';
import { createTestApp } from './create-test-app';

const PASSWORD = 'Senha123@';
type Agent = ReturnType<typeof request.agent>;
type ListItem = {
  id: string;
  title: string;
  categoryName: string;
  status: string;
  priority: string | null;
  createdBy?: { name: string };
};
type ListBody = { items: ListItem[]; total: number; page: number; limit: number };
const listOf = (response: Response) => response.body as ListBody;
const titlesOf = (response: Response) => listOf(response).items.map((item) => item.title);

describe('Request listing and detail (API-09, API-10)', () => {
  let app: INestApplication<App>;
  let userAAgent: Agent;
  let userBAgent: Agent;
  let adminAgent: Agent;
  let infraId: Types.ObjectId;
  const requestIds: Record<string, string> = {};

  async function loggedAgent(email: string): Promise<Agent> {
    const agent = request.agent(app.getHttpServer());
    await agent.post('/api/auth/login').send({ email, password: PASSWORD }).expect(200);
    return agent;
  }

  beforeAll(async () => {
    app = await createTestApp();
    const usersService = app.get(UsersService);
    const userA = await usersService.create({
      name: 'Ana',
      email: 'a@example.com',
      password: PASSWORD,
    });
    const userB = await usersService.create({
      name: 'Bruno',
      email: 'b@example.com',
      password: PASSWORD,
    });
    await usersService.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: PASSWORD,
      role: Role.Admin,
    });
    const categoryModel = app.get<Model<Category>>(getModelToken(Category.name));
    infraId = (await categoryModel.create({ name: 'Infra' }))._id;
    const rhId = (await categoryModel.create({ name: 'RH' }))._id;

    const seed = [
      {
        title: 'A1 rede (2º andar)',
        owner: userA.id,
        category: infraId,
        priority: Priority.Low,
        day: 1,
        status: RequestStatus.Open,
      },
      {
        title: 'A2 impressora',
        owner: userA.id,
        category: rhId,
        priority: null,
        day: 2,
        status: RequestStatus.InProgress,
      },
      {
        title: 'A3 senha',
        owner: userA.id,
        category: infraId,
        priority: Priority.High,
        day: 3,
        status: RequestStatus.Open,
      },
      {
        title: 'B1 monitor',
        owner: userB.id,
        category: infraId,
        priority: Priority.High,
        day: 4,
        status: RequestStatus.Open,
      },
      {
        title: 'B2 teclado',
        owner: userB.id,
        category: rhId,
        priority: Priority.Medium,
        day: 5,
        status: RequestStatus.Resolved,
      },
    ];
    await app.get<Model<ServiceRequest>>(getModelToken(ServiceRequest.name)).collection.insertMany(
      seed.map((item) => {
        const _id = new Types.ObjectId();
        requestIds[item.title.slice(0, 2)] = _id.toString();
        const createdAt = new Date(Date.UTC(2026, 0, item.day));
        return {
          _id,
          title: item.title,
          description: 'd'.repeat(60),
          category: item.category,
          createdBy: new Types.ObjectId(item.owner),
          status: item.status,
          priority: item.priority,
          priorityRank: item.priority ? PRIORITY_RANK[item.priority] : UNSET_PRIORITY_RANK,
          adminNote: null,
          resolution: null,
          resolvedAt: null,
          resolvedBy: null,
          attachments: [],
          createdAt,
          updatedAt: createdAt,
        };
      }),
    );

    userAAgent = await loggedAgent('a@example.com');
    userBAgent = await loggedAgent('b@example.com');
    adminAgent = await loggedAgent('admin@example.com');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('AC-15: users only see their own requests', () => {
    it('lists only the requests of the logged user', async () => {
      const response = await userAAgent.get('/api/requests');

      expect(response.status).toBe(200);
      expect(listOf(response).total).toBe(3);
      expect(titlesOf(response).every((title) => title.startsWith('A'))).toBe(true);
    });

    it('returns 404 for the detail of another user request', async () => {
      const response = await userAAgent.get(`/api/requests/${requestIds.B1}`);

      expect(response.status).toBe(404);
    });

    it('returns the detail of an own request', async () => {
      const response = await userAAgent.get(`/api/requests/${requestIds.A1}`);

      expect(response.status).toBe(200);
      expect((response.body as { request: { title: string } }).request.title).toBe(
        'A1 rede (2º andar)',
      );
    });

    it('returns 404 for a malformed or unknown id', async () => {
      const malformed = await userAAgent.get('/api/requests/abc');
      const unknown = await userAAgent.get(`/api/requests/${new Types.ObjectId().toString()}`);

      expect([malformed.status, unknown.status]).toEqual([404, 404]);
    });

    it('omits createdBy from user list items', async () => {
      const response = await userBAgent.get('/api/requests');

      expect(listOf(response).items[0]).not.toHaveProperty('createdBy');
      expect(listOf(response).items[0]).toMatchObject({ categoryName: expect.any(String) });
    });
  });

  describe('admin listing', () => {
    it('AC-17: sees all requests ordered by priority desc and date desc by default', async () => {
      const response = await adminAgent.get('/api/requests');

      expect(listOf(response)).toMatchObject({ total: 5, page: 1, limit: 10 });
      expect(titlesOf(response)).toEqual([
        'B1 monitor',
        'A3 senha',
        'B2 teclado',
        'A1 rede (2º andar)',
        'A2 impressora',
      ]);
      expect(listOf(response).items[0]).toMatchObject({
        id: requestIds.B1,
        categoryName: 'Infra',
        status: 'OPEN',
        priority: 'HIGH',
        createdBy: { name: 'Bruno' },
      });
    });

    it('can read any request detail', async () => {
      const response = await adminAgent.get(`/api/requests/${requestIds.A2}`);

      expect(response.status).toBe(200);
    });

    it('AC-18: honours createdAt asc with consistent pagination', async () => {
      const pages = await Promise.all(
        [1, 2, 3].map((page) =>
          adminAgent
            .get('/api/requests')
            .query({ sortBy: 'createdAt', order: 'asc', limit: 2, page }),
        ),
      );

      expect(pages.map(titlesOf)).toEqual([
        ['A1 rede (2º andar)', 'A2 impressora'],
        ['A3 senha', 'B1 monitor'],
        ['B2 teclado'],
      ]);
      expect(listOf(pages[1])).toMatchObject({ total: 5, page: 2, limit: 2 });
    });

    it.each([
      [{ status: 'OPEN' }, ['B1 monitor', 'A3 senha', 'A1 rede (2º andar)']],
      [{ priority: 'HIGH' }, ['B1 monitor', 'A3 senha']],
      [{ priority: 'UNSET' }, ['A2 impressora']],
      [{ search: 'REDE (2º' }, ['A1 rede (2º andar)']],
    ])('filters by %j', async (query, expectedTitles) => {
      const response = await adminAgent.get('/api/requests').query(query);

      expect(titlesOf(response)).toEqual(expectedTitles);
    });

    it('filters by category', async () => {
      const response = await adminAgent
        .get('/api/requests')
        .query({ categoryId: infraId.toString() });

      expect(listOf(response).total).toBe(3);
    });

    it('caps limit at PAGINATION_MAX_LIMIT', async () => {
      const response = await adminAgent.get('/api/requests').query({ limit: 500 });

      expect(listOf(response).limit).toBe(50);
    });

    it.each([
      { sortBy: 'title' },
      { order: 'up' },
      { page: 0 },
      { status: 'DONE' },
      { unknown: 'x' },
    ])('rejects invalid query %j with 400', async (query) => {
      const response = await adminAgent.get('/api/requests').query(query);

      expect(response.status).toBe(400);
    });
  });

  it('requires authentication (401)', async () => {
    const response = await request(app.getHttpServer()).get('/api/requests');

    expect(response.status).toBe(401);
  });
});
