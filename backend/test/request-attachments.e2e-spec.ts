import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Model } from 'mongoose';
import request, { Response } from 'supertest';
import { App } from 'supertest/types';
import { Role } from '../src/common/enums/role.enum';
import { Category } from '../src/modules/categories/schemas/category.model';
import { ServiceRequest } from '../src/modules/requests/schemas/service-request.model';
import { UsersService } from '../src/modules/users/users.service';
import { createTestApp } from './create-test-app';
import { executableBytes, jpegBytes, pdfBytes, pngBytes } from './fixtures/image-bytes';

const PASSWORD = 'Senha123@';
const ONE_MEGABYTE = 1024 * 1024;
const MAX_UPLOAD_SIZE_MB = 5;

type AttachmentView = { id: string; originalName: string; mimeType: string; sizeBytes: number };
type RequestView = { id: string; attachments: AttachmentView[] };
type Agent = ReturnType<typeof request.agent>;
type UploadFile = { content: Buffer; filename: string; contentType: string };

const requestOf = (response: Response) => (response.body as { request: RequestView }).request;
const png = (filename = 'tela.png', content = pngBytes()): UploadFile => ({
  content,
  filename,
  contentType: 'image/png',
});

describe('Request attachments (RN-06, RF-14)', () => {
  let app: INestApplication<App>;
  let uploadDir: string;
  let categoryId: string;
  let ownerAgent: Agent;
  let otherUserAgent: Agent;
  let adminAgent: Agent;
  let requestModel: Model<ServiceRequest>;

  async function loggedAgent(email: string): Promise<Agent> {
    const agent = request.agent(app.getHttpServer());
    await agent.post('/api/auth/login').send({ email, password: PASSWORD }).expect(200);
    return agent;
  }

  function createRequest(agent: Agent, files: UploadFile[]) {
    const pending = agent
      .post('/api/requests')
      .field('title', 'Impressora com erro')
      .field('categoryId', categoryId)
      .field('description', 'A impressora do segundo andar mostra erro de papel o tempo todo.');
    for (const file of files) {
      pending.attach('files', file.content, {
        filename: file.filename,
        contentType: file.contentType,
      });
    }
    return pending;
  }

  async function expectNothingPersisted(): Promise<void> {
    await expect(readdir(uploadDir)).resolves.toEqual([]);
    await expect(requestModel.countDocuments()).resolves.toBe(0);
  }

  beforeAll(async () => {
    uploadDir = await mkdtemp(join(tmpdir(), 'helpeme-uploads-'));
    process.env.UPLOAD_DIR = uploadDir;
    process.env.MAX_UPLOAD_SIZE_MB = String(MAX_UPLOAD_SIZE_MB);
    app = await createTestApp();
    const usersService = app.get(UsersService);
    await usersService.create({ name: 'Dona', email: 'owner@example.com', password: PASSWORD });
    await usersService.create({ name: 'Outro', email: 'other@example.com', password: PASSWORD });
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
    ownerAgent = await loggedAgent('owner@example.com');
    otherUserAgent = await loggedAgent('other@example.com');
    adminAgent = await loggedAgent('admin@example.com');
  });

  afterEach(async () => {
    await requestModel.deleteMany({});
    for (const file of await readdir(uploadDir)) await rm(join(uploadDir, file));
  });

  afterAll(async () => {
    await app.close();
    await rm(uploadDir, { recursive: true, force: true });
  });

  it('stores valid PNG and JPEG files under generated names and returns public metadata', async () => {
    const response = await createRequest(ownerAgent, [
      png('tela.png'),
      { content: jpegBytes(), filename: 'foto.jpg', contentType: 'image/jpeg' },
    ]);

    expect(response.status).toBe(201);
    const { attachments } = requestOf(response);
    expect(attachments).toEqual([
      { id: expect.any(String), originalName: 'tela.png', mimeType: 'image/png', sizeBytes: 64 },
      { id: expect.any(String), originalName: 'foto.jpg', mimeType: 'image/jpeg', sizeBytes: 64 },
    ]);
    const storedFiles = await readdir(uploadDir);
    expect(storedFiles).toHaveLength(2);
    expect(storedFiles).not.toContain('tela.png');
  });

  it('AC-12: rejects a PDF with 400 and persists nothing', async () => {
    const response = await createRequest(ownerAgent, [
      { content: pdfBytes(), filename: 'doc.pdf', contentType: 'application/pdf' },
    ]);

    expect(response.status).toBe(400);
    await expectNothingPersisted();
  });

  it('AC-12: rejects an .exe renamed to .png with 400 and persists nothing', async () => {
    const response = await createRequest(ownerAgent, [png('virus.png', executableBytes())]);

    expect(response.status).toBe(400);
    await expectNothingPersisted();
  });

  it('accepts a file of exactly MAX_UPLOAD_SIZE_MB', async () => {
    const response = await createRequest(ownerAgent, [
      png('grande.png', pngBytes(MAX_UPLOAD_SIZE_MB * ONE_MEGABYTE)),
    ]);

    expect(response.status).toBe(201);
  });

  it('AC-13: rejects a file of 5 MB + 1 byte with 413', async () => {
    const response = await createRequest(ownerAgent, [
      png('grande.png', pngBytes(MAX_UPLOAD_SIZE_MB * ONE_MEGABYTE + 1)),
    ]);

    expect(response.status).toBe(413);
    await expectNothingPersisted();
  });

  it('AC-14: rejects 6 files with 400', async () => {
    const files = Array.from({ length: 6 }, (_unused, index) => png(`tela-${index}.png`));

    const response = await createRequest(ownerAgent, files);

    expect(response.status).toBe(400);
    await expectNothingPersisted();
  });

  it('accepts exactly 5 files', async () => {
    const files = Array.from({ length: 5 }, (_unused, index) => png(`tela-${index}.png`));

    const response = await createRequest(ownerAgent, files);

    expect(response.status).toBe(201);
    expect(requestOf(response).attachments).toHaveLength(5);
  });

  it('does not keep files when the category is invalid', async () => {
    const response = await ownerAgent
      .post('/api/requests')
      .field('title', 'Impressora com erro')
      .field('categoryId', '64b7f0c2a1b2c3d4e5f60718')
      .field('description', 'A impressora do segundo andar mostra erro de papel o tempo todo.')
      .attach('files', pngBytes(), { filename: 'tela.png', contentType: 'image/png' });

    expect(response.status).toBe(400);
    await expectNothingPersisted();
  });

  describe('GET /api/requests/:id/attachments/:attachmentId (API-12)', () => {
    let attachmentUrl: string;
    const content = pngBytes(128);

    beforeEach(async () => {
      const created = requestOf(await createRequest(ownerAgent, [png('tela.png', content)]));
      attachmentUrl = `/api/requests/${created.id}/attachments/${created.attachments[0].id}`;
    });

    it('streams the image to the owner with safe headers', async () => {
      const response = await ownerAgent.get(attachmentUrl).buffer(true);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('image/png');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(Buffer.compare(response.body as Buffer, content)).toBe(0);
    });

    it('AC-30: hides another user attachment with 404', async () => {
      const response = await otherUserAgent.get(attachmentUrl);

      expect(response.status).toBe(404);
    });

    it('AC-30: lets an admin download any attachment (200)', async () => {
      const response = await adminAgent.get(attachmentUrl);

      expect(response.status).toBe(200);
    });

    it('returns 404 for unknown attachment or malformed request id', async () => {
      const unknownAttachment = await ownerAgent.get(attachmentUrl.replace(/[^/]+$/, 'missing'));
      const malformedRequest = await ownerAgent.get('/api/requests/abc/attachments/missing');

      expect([unknownAttachment.status, malformedRequest.status]).toEqual([404, 404]);
    });

    it('requires authentication (401)', async () => {
      const response = await request(app.getHttpServer()).get(attachmentUrl);

      expect(response.status).toBe(401);
    });
  });
});
