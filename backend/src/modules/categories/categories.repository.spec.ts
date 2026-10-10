import { ConflictException } from '@nestjs/common';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { isolatedDatabaseName } from '../../../test/mongo-test-db';
import { CategoriesRepository } from './categories.repository';
import { Category, CategorySchema } from './schemas/category.model';

describe('CategoriesRepository', () => {
  let moduleRef: TestingModule;
  let repository: CategoriesRepository;
  let categoryModel: Model<Category>;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(process.env.MONGODB_URI ?? '', { dbName: isolatedDatabaseName() }),
        MongooseModule.forFeature([{ name: Category.name, schema: CategorySchema }]),
      ],
      providers: [CategoriesRepository],
    }).compile();
    repository = moduleRef.get(CategoriesRepository);
    categoryModel = moduleRef.get(getModelToken(Category.name));
    await categoryModel.syncIndexes();
  });

  afterEach(async () => {
    await categoryModel.deleteMany({});
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('stores categories in the categories collection', () => {
    expect(categoryModel.collection.collectionName).toBe('categories');
  });

  it('creates an active, non-default category', async () => {
    const category = await repository.create('Segurança');

    expect(category).toEqual({ id: expect.any(String), name: 'Segurança' });
    await expect(categoryModel.findById(category.id).lean()).resolves.toMatchObject({
      isActive: true,
      isDefault: false,
    });
  });

  it('RN-04: rejects a name that differs only by letter case with a conflict', async () => {
    await repository.create('Segurança');

    await expect(repository.create('SEGURANÇA')).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists only active categories ordered by name', async () => {
    await repository.create('Redes');
    await repository.create('Banco de dados');
    await categoryModel.create({ name: 'Antiga', isActive: false });

    const names = (await repository.findActive()).map((category) => category.name);

    expect(names).toEqual(['Banco de dados', 'Redes']);
  });

  it('ensures default categories without duplicating them', async () => {
    await repository.create('infra');

    await repository.ensureDefaults(['Infra', 'RH']);
    await repository.ensureDefaults(['Infra', 'RH']);

    await expect(categoryModel.countDocuments()).resolves.toBe(2);
    await expect(categoryModel.findOne({ name: 'RH' }).lean()).resolves.toMatchObject({
      isDefault: true,
    });
  });

  it('RN-12: deactivates a category idempotently and returns it with its status', async () => {
    const category = await repository.create('Infra');

    const first = await repository.deactivate(category.id);
    const second = await repository.deactivate(category.id);

    expect(first).toEqual({ id: category.id, name: 'Infra', isActive: false });
    expect(second).toEqual(first);
    await expect(categoryModel.findById(category.id).lean()).resolves.toMatchObject({
      isActive: false,
    });
  });

  it('returns null when deactivating an unknown or malformed id', async () => {
    await expect(repository.deactivate('64b7f0c2a1b2c3d4e5f60718')).resolves.toBeNull();
    await expect(repository.deactivate('abc')).resolves.toBeNull();
  });

  it('lists every category with its status ordered by name', async () => {
    const redes = await repository.create('Redes');
    await repository.create('Banco de dados');
    await repository.deactivate(redes.id);

    const all = await repository.findAll();

    expect(all.map(({ name, isActive }) => [name, isActive])).toEqual([
      ['Banco de dados', true],
      ['Redes', false],
    ]);
  });

  it('RN-12: ensuring defaults never reactivates a deactivated category', async () => {
    await repository.ensureDefaults(['RH']);
    const rh = await categoryModel.findOne({ name: 'RH' }).lean();
    await repository.deactivate(String(rh?._id));

    await repository.ensureDefaults(['RH']);

    await expect(categoryModel.findOne({ name: 'RH' }).lean()).resolves.toMatchObject({
      isActive: false,
    });
  });
});
