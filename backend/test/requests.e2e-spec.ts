import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import request, { Response } from 'supertest';
import { App } from 'supertest/types';
import { Category } from '../src/modules/categories/schemas/category.model';
import { UsersService } from '../src/modules/users/users.service';
import { createTestApp } from './create-test-app';

const PASSWORD = 'Senha123@';
const requestOf = (response: Response) =>
  (response.body as { request: Record<string, unknown> }).request;

describe('POST /api/requests (API-08, without attachments)', () => {
  let app: INestApplication<App>;
  let userAgent: ReturnType<typeof request.agent>;
  let categoryId: string;
  let inactiveCategoryId: string;

  const validFields = () => ({
    title: 'Notebook sem rede',
    categoryId,
    description: 'O notebook do setor financeiro não conecta na rede desde ontem.',
  });

  const submitMultipart = (fields: Record<string, string>) => {
    const pending = userAgent.post('/api/requests');
    for (const [name, value] of Object.entries(fields)) pending.field(name, value);
    return pending;
  };

  beforeAll(async () => {
    app = await createTestApp();
    await app
      .get(UsersService)
      .create({ name: 'Maria', email: 'maria@example.com', password: PASSWORD });
    const categoryModel = app.get<Model<Category>>(getModelToken(Category.name));
    categoryId = (await categoryModel.create({ name: 'Infra' }))._id.toString();
    inactiveCategoryId = (
      await categoryModel.create({ name: 'Antiga', isActive: false })
    )._id.toString();
    userAgent = request.agent(app.getHttpServer());
    await userAgent
      .post('/api/auth/login')
      .send({ email: 'maria@example.com', password: PASSWORD })
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });

  it('AC-10: creates an OPEN request with null priority (201)', async () => {
    const response = await submitMultipart(validFields());

    expect(response.status).toBe(201);
    expect(requestOf(response)).toMatchObject({
      title: 'Notebook sem rede',
      status: 'OPEN',
      priority: null,
      category: { id: categoryId, name: 'Infra' },
      createdBy: { name: 'Maria' },
      attachments: [],
    });
  });

  it('also accepts a JSON body', async () => {
    const response = await userAgent.post('/api/requests').send(validFields());

    expect(response.status).toBe(201);
  });

  it.each([
    ['49', 49, 400],
    ['50', 50, 201],
    ['1000', 1000, 201],
    ['1001', 1001, 400],
  ])('AC-11: description with %s chars responds %i', async (_label, length, expectedStatus) => {
    const response = await submitMultipart({ ...validFields(), description: 'd'.repeat(length) });

    expect(response.status).toBe(expectedStatus);
  });

  it('RN-05: counts description length after trimming', async () => {
    const response = await submitMultipart({
      ...validFields(),
      description: `   ${'d'.repeat(49)}   `,
    });

    expect(response.status).toBe(400);
  });

  it.each([
    ['4', 4, 400],
    ['5', 5, 201],
    ['120', 120, 201],
    ['121', 121, 400],
  ])('RN-05: title with %s chars responds %i', async (_label, length, expectedStatus) => {
    const response = await submitMultipart({ ...validFields(), title: 't'.repeat(length) });

    expect(response.status).toBe(expectedStatus);
  });

  it('AC-25: rejects a nonexistent category with 400', async () => {
    const response = await submitMultipart({
      ...validFields(),
      categoryId: '64b7f0c2a1b2c3d4e5f60718',
    });

    expect(response.status).toBe(400);
  });

  it('RN-11: rejects an inactive category or a malformed id with 400', async () => {
    const inactive = await submitMultipart({ ...validFields(), categoryId: inactiveCategoryId });
    const malformed = await submitMultipart({ ...validFields(), categoryId: 'abc' });

    expect([inactive.status, malformed.status]).toEqual([400, 400]);
  });

  it('does not let the author set admin-only fields such as status (400)', async () => {
    const response = await submitMultipart({ ...validFields(), status: 'RESOLVED' });

    expect(response.status).toBe(400);
  });

  it('requires authentication (401)', async () => {
    const response = await request(app.getHttpServer()).post('/api/requests').send(validFields());

    expect(response.status).toBe(401);
  });
});
