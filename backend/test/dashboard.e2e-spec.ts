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
type Summary = {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byCategory: Array<{ categoryId: string; name: string; count: number }>;
  recent: Array<{ title: string; createdBy?: { name: string } }>;
};
const summaryOf = (response: Response) => response.body as Summary;

describe('GET /api/dashboard/summary (API-13)', () => {
  let app: INestApplication<App>;
  let userAAgent: Agent;
  let adminAgent: Agent;
  let newcomerAgent: Agent;
  let infraId: Types.ObjectId;
  let rhId: Types.ObjectId;

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
    await usersService.create({ name: 'Novo', email: 'new@example.com', password: PASSWORD });
    await usersService.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: PASSWORD,
      role: Role.Admin,
    });
    const categoryModel = app.get<Model<Category>>(getModelToken(Category.name));
    infraId = (await categoryModel.create({ name: 'Infra' }))._id;
    rhId = (await categoryModel.create({ name: 'RH' }))._id;

    const seed = [
      {
        title: 'A1',
        owner: userA.id,
        category: infraId,
        priority: Priority.High,
        status: RequestStatus.Open,
        day: 1,
      },
      {
        title: 'A2',
        owner: userA.id,
        category: infraId,
        priority: null,
        status: RequestStatus.InProgress,
        day: 2,
      },
      {
        title: 'A3',
        owner: userA.id,
        category: rhId,
        priority: Priority.Low,
        status: RequestStatus.Resolved,
        day: 3,
      },
      {
        title: 'B1',
        owner: userB.id,
        category: infraId,
        priority: Priority.High,
        status: RequestStatus.Open,
        day: 4,
      },
      {
        title: 'B2',
        owner: userB.id,
        category: rhId,
        priority: Priority.Medium,
        status: RequestStatus.Open,
        day: 5,
      },
      {
        title: 'B3',
        owner: userB.id,
        category: rhId,
        priority: null,
        status: RequestStatus.Open,
        day: 6,
      },
    ];
    await app.get<Model<ServiceRequest>>(getModelToken(ServiceRequest.name)).collection.insertMany(
      seed.map((item) => {
        const createdAt = new Date(Date.UTC(2026, 0, item.day));
        return {
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
    adminAgent = await loggedAgent('admin@example.com');
    newcomerAgent = await loggedAgent('new@example.com');
  });

  afterAll(async () => {
    await app.close();
  });

  it('AC-26: a user only gets counts of their own requests', async () => {
    const response = await userAAgent.get('/api/dashboard/summary');

    expect(response.status).toBe(200);
    expect(summaryOf(response)).toMatchObject({
      total: 3,
      byStatus: { OPEN: 1, IN_PROGRESS: 1, RESOLVED: 1 },
      byPriority: { HIGH: 1, MEDIUM: 0, LOW: 1, UNSET: 1 },
    });
    expect(summaryOf(response).byCategory).toEqual([
      { categoryId: infraId.toString(), name: 'Infra', count: 2 },
      { categoryId: rhId.toString(), name: 'RH', count: 1 },
    ]);
    expect(summaryOf(response).recent.map((item) => item.title)).toEqual(['A3', 'A2', 'A1']);
    expect(summaryOf(response).recent[0]).not.toHaveProperty('createdBy');
  });

  it('AC-27: an admin gets global counts by status, priority and category', async () => {
    const response = await adminAgent.get('/api/dashboard/summary');

    expect(summaryOf(response)).toMatchObject({
      total: 6,
      byStatus: { OPEN: 4, IN_PROGRESS: 1, RESOLVED: 1 },
      byPriority: { HIGH: 2, MEDIUM: 1, LOW: 1, UNSET: 2 },
    });
    expect(summaryOf(response).byCategory).toEqual([
      { categoryId: infraId.toString(), name: 'Infra', count: 3 },
      { categoryId: rhId.toString(), name: 'RH', count: 3 },
    ]);
  });

  it('returns the 5 most recent requests with author names for an admin', async () => {
    const { recent } = summaryOf(await adminAgent.get('/api/dashboard/summary'));

    expect(recent.map((item) => item.title)).toEqual(['B3', 'B2', 'B1', 'A3', 'A2']);
    expect(recent[0]).toMatchObject({ createdBy: { name: 'Bruno' } });
  });

  it('returns zeroed counts for a user without requests', async () => {
    const response = await newcomerAgent.get('/api/dashboard/summary');

    expect(summaryOf(response)).toEqual({
      total: 0,
      byStatus: { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0 },
      byPriority: { HIGH: 0, MEDIUM: 0, LOW: 0, UNSET: 0 },
      byCategory: [],
      recent: [],
    });
  });

  it('requires authentication (401)', async () => {
    const response = await request(app.getHttpServer()).get('/api/dashboard/summary');

    expect(response.status).toBe(401);
  });
});
