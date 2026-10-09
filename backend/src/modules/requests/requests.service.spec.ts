import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../../config/env.schema';
import { RequestStatus } from '../../common/enums/request-status.enum';
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
