import { BadRequestException, Injectable } from '@nestjs/common';
import { UNSET_PRIORITY_RANK } from '../../common/enums/priority.enum';
import { RequestStatus } from '../../common/enums/request-status.enum';
import { CategoriesService } from '../categories/categories.service';
import { RequestsRepository } from './requests.repository';
import { CreateRequestInput, RequestDetails } from './requests.types';

export const INVALID_CATEGORY_MESSAGE = 'Categoria inexistente ou inativa.';

@Injectable()
export class RequestsService {
  constructor(
    private readonly requestsRepository: RequestsRepository,
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(input: CreateRequestInput, authorId: string): Promise<RequestDetails> {
    const category = await this.categoriesService.findActiveById(input.categoryId);
    if (!category) throw new BadRequestException(INVALID_CATEGORY_MESSAGE);

    return this.requestsRepository.create({
      title: input.title,
      description: input.description,
      categoryId: category.id,
      createdById: authorId,
      status: RequestStatus.Open,
      priority: null,
      priorityRank: UNSET_PRIORITY_RANK,
    });
  }
}
