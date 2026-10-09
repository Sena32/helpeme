import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { Model } from 'mongoose';
import { isolatedDatabaseName } from '../../../test/mongo-test-db';
import { RequestStatus } from '../../common/enums/request-status.enum';
import { Role } from '../../common/enums/role.enum';
import { Category, CategorySchema } from '../categories/schemas/category.model';
import { User, UserSchema } from '../users/schemas/user.model';
import { RequestsRepository } from './requests.repository';
import { ServiceRequest, ServiceRequestSchema } from './schemas/service-request.model';

describe('RequestsRepository', () => {
  let moduleRef: TestingModule;
  let repository: RequestsRepository;
  let requestModel: Model<ServiceRequest>;
  let categoryId: string;
  let authorId: string;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(process.env.MONGODB_URI ?? '', { dbName: isolatedDatabaseName() }),
        MongooseModule.forFeature([
          { name: ServiceRequest.name, schema: ServiceRequestSchema },
          { name: Category.name, schema: CategorySchema },
          { name: User.name, schema: UserSchema },
        ]),
      ],
      providers: [RequestsRepository],
    }).compile();
    repository = moduleRef.get(RequestsRepository);
    requestModel = moduleRef.get(getModelToken(ServiceRequest.name));
    await requestModel.syncIndexes();
    const category = await moduleRef
      .get<Model<Category>>(getModelToken(Category.name))
      .create({ name: 'Infra' });
    const author = await moduleRef.get<Model<User>>(getModelToken(User.name)).create({
      name: 'Maria Silva',
      email: 'maria@example.com',
      passwordHash: 'hash',
      role: Role.User,
    });
    categoryId = category._id.toString();
    authorId = author._id.toString();
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  const newRecord = () => ({
    title: 'Notebook sem rede',
    description: 'x'.repeat(60),
    categoryId,
    createdById: authorId,
    status: RequestStatus.Open,
    priority: null,
    priorityRank: 0,
    attachments: [],
  });

  it('stores requests in the requests collection', () => {
    expect(requestModel.collection.collectionName).toBe('requests');
  });

  it('creates a request and returns it with category and author names', async () => {
    const created = await repository.create(newRecord());

    expect(created).toMatchObject({
      id: expect.any(String),
      title: 'Notebook sem rede',
      category: { id: categoryId, name: 'Infra' },
      createdBy: { id: authorId, name: 'Maria Silva' },
      status: RequestStatus.Open,
      priority: null,
      adminNote: null,
      resolution: null,
      resolvedAt: null,
      attachments: [],
    });
    expect(created).not.toHaveProperty('priorityRank');
  });

  it('declares the indexes required by the listing and dashboard queries', async () => {
    const keys = (await requestModel.collection.indexes()).map((index) => index.key);

    expect(keys).toEqual(
      expect.arrayContaining([
        { createdBy: 1, createdAt: -1 },
        { status: 1, priorityRank: -1, createdAt: -1 },
        { createdAt: -1 },
      ]),
    );
  });

  it('rejects more than 5 embedded attachments', async () => {
    const attachment = {
      id: randomUUID(),
      originalName: 'foto.png',
      storedName: 'stored.png',
      mimeType: 'image/png' as const,
      sizeBytes: 10,
    };

    await expect(
      requestModel.create({
        ...newRecord(),
        category: categoryId,
        createdBy: authorId,
        attachments: Array.from({ length: 6 }, () => attachment),
      }),
    ).rejects.toThrow(/attachments/);
  });
});
