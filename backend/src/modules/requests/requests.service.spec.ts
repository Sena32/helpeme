import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../../config/env.schema';
import { RequestStatus } from '../../common/enums/request-status.enum';
import { Role } from '../../common/enums/role.enum';
import { CategoriesService } from '../categories/categories.service';
import { AttachmentsService } from './attachments/attachments.service';
import { CategorySummary } from '../categories/categories.types';
import { RequestsRepository } from './requests.repository';
import { INVALID_CATEGORY_MESSAGE, RequestsService } from './requests.service';
import { NewRequestRecord, RequestDetails } from './requests.types';

const activeCategory: CategorySummary = { id: '64b7f0c2a1b2c3d4e5f60718', name: 'Infra' };

class FakeRequestsRepository implements Pick<RequestsRepository, 'create'> {
  readonly created: NewRequestRecord[] = [];

  create(record: NewRequestRecord): Promise<RequestDetails> {
    this.created.push(record);
    return Promise.resolve({ id: 'request-id' } as RequestDetails);
  }
}

function buildService(repository: FakeRequestsRepository, category: CategorySummary | null) {
  const categoriesService = { findActiveById: () => Promise.resolve(category) };
  const attachmentsService = {
    prepare: () => [],
    store: () => Promise.resolve(),
    discard: () => Promise.resolve(),
  };
  return new RequestsService(
    repository as unknown as RequestsRepository,
    categoriesService as unknown as CategoriesService,
    attachmentsService as unknown as AttachmentsService,
    { get: () => 50 } as unknown as ConfigService<Env, true>,
    () => new Date('2026-03-10T12:00:00.000Z'),
  );
}

const input = {
  title: 'Notebook sem rede',
  categoryId: activeCategory.id,
  description: 'x'.repeat(60),
};

describe('RequestsService.create', () => {
  it('AC-10: persists an OPEN request with no priority for the author', async () => {
    const repository = new FakeRequestsRepository();

    await buildService(repository, activeCategory).create(input, 'author-id');

    expect(repository.created[0]).toEqual({
      title: input.title,
      description: input.description,
      categoryId: activeCategory.id,
      createdById: 'author-id',
      status: RequestStatus.Open,
      priority: null,
      priorityRank: 0,
      attachments: [],
    });
  });

  it('AC-25: rejects a missing or inactive category with 400 and persists nothing', async () => {
    const repository = new FakeRequestsRepository();

    await expect(buildService(repository, null).create(input, 'author-id')).rejects.toThrow(
      new BadRequestException(INVALID_CATEGORY_MESSAGE),
    );
    expect(repository.created).toHaveLength(0);
  });
});

describe('RequestsService.updateByAdmin', () => {
  const admin = { id: 'admin-id', role: Role.Admin };

  function serviceWith(repository: object): RequestsService {
    return new RequestsService(
      repository as unknown as RequestsRepository,
      {} as unknown as CategoriesService,
      {} as unknown as AttachmentsService,
      { get: () => 50 } as unknown as ConfigService<Env, true>,
      () => new Date('2026-03-10T12:00:00.000Z'),
    );
  }

  it('returns 404 when the request does not exist', async () => {
    const service = serviceWith({ findStatusById: () => Promise.resolve(null) });

    await expect(
      service.updateByAdmin('missing', { status: RequestStatus.InProgress }, admin),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 409 when the status changed concurrently between read and write', async () => {
    const service = serviceWith({
      findStatusById: () => Promise.resolve(RequestStatus.Open),
      applyUpdate: () => Promise.resolve(null),
    });

    await expect(
      service.updateByAdmin('request-id', { status: RequestStatus.InProgress }, admin),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('stamps resolvedAt with the injected clock', async () => {
    let appliedUpdate: unknown;
    const service = serviceWith({
      findStatusById: () => Promise.resolve(RequestStatus.InProgress),
      applyUpdate: (_id: string, _status: RequestStatus, update: unknown) => {
        appliedUpdate = update;
        return Promise.resolve({ id: 'request-id' });
      },
    });

    await service.updateByAdmin(
      'request-id',
      { status: RequestStatus.Resolved, resolution: 'Ok' },
      admin,
    );

    expect(appliedUpdate).toMatchObject({ resolvedAt: new Date('2026-03-10T12:00:00.000Z') });
  });
});
