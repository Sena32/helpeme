import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'node:stream';
import { UNSET_PRIORITY_RANK } from '../../common/enums/priority.enum';
import { RequestStatus } from '../../common/enums/request-status.enum';
import { Role } from '../../common/enums/role.enum';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { Env } from '../../config/env.schema';
import { CategoriesService } from '../categories/categories.service';
import { AttachmentsService, UploadedImage } from './attachments/attachments.service';
import { buildRequestFilter, buildRequestSort, ListRequestsQuery } from './request-list-query';
import { REQUEST_NOT_FOUND_MESSAGE, RequestsRepository } from './requests.repository';
import { CreateRequestInput, RequestDetails, RequestListPage } from './requests.types';
import { Attachment } from './schemas/service-request.model';

export const INVALID_CATEGORY_MESSAGE = 'Categoria inexistente ou inativa.';
export const ATTACHMENT_NOT_FOUND_MESSAGE = 'Anexo não encontrado.';
export const DEFAULT_PAGE_SIZE = 10;
const FIRST_PAGE = 1;

function canAccess(ownerId: string, viewer: AuthenticatedUser): boolean {
  return viewer.role === Role.Admin || ownerId === viewer.id;
}

@Injectable()
export class RequestsService {
  constructor(
    private readonly requestsRepository: RequestsRepository,
    private readonly categoriesService: CategoriesService,
    private readonly attachmentsService: AttachmentsService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async create(
    input: CreateRequestInput,
    authorId: string,
    files: UploadedImage[] = [],
  ): Promise<RequestDetails> {
    const prepared = this.attachmentsService.prepare(files);
    const category = await this.categoriesService.findActiveById(input.categoryId);
    if (!category) throw new BadRequestException(INVALID_CATEGORY_MESSAGE);

    const attachments = prepared.map(({ attachment }) => attachment);
    await this.attachmentsService.store(prepared);
    try {
      return await this.requestsRepository.create({
        title: input.title,
        description: input.description,
        categoryId: category.id,
        createdById: authorId,
        status: RequestStatus.Open,
        priority: null,
        priorityRank: UNSET_PRIORITY_RANK,
        attachments,
      });
    } catch (error) {
      await this.attachmentsService.discard(attachments);
      throw error;
    }
  }

  // RN-10: regular users are always scoped to their own requests, whatever the query says.
  async list(query: ListRequestsQuery, viewer: AuthenticatedUser): Promise<RequestListPage> {
    const isAdmin = viewer.role === Role.Admin;
    const page = query.page ?? FIRST_PAGE;
    const limit = Math.min(
      query.limit ?? DEFAULT_PAGE_SIZE,
      this.config.get('PAGINATION_MAX_LIMIT', { infer: true }),
    );
    const { items, total } = await this.requestsRepository.list({
      filter: buildRequestFilter(query, { ownerId: isAdmin ? undefined : viewer.id }),
      sort: buildRequestSort(query),
      skip: (page - 1) * limit,
      limit,
      includeAuthor: isAdmin,
    });
    return { items, total, page, limit };
  }

  // AC-15: another user's request answers 404, exactly like a missing one.
  async findOne(requestId: string, viewer: AuthenticatedUser): Promise<RequestDetails> {
    const details = await this.requestsRepository.findDetailsById(requestId);
    if (!details || !canAccess(details.createdBy.id, viewer)) {
      throw new NotFoundException(REQUEST_NOT_FOUND_MESSAGE);
    }
    return details;
  }

  // RF-14: anyone other than the owner or an admin gets 404, hiding the attachment's existence.
  async openAttachment(
    requestId: string,
    attachmentId: string,
    viewer: AuthenticatedUser,
  ): Promise<{ attachment: Attachment; stream: Readable }> {
    const access = await this.requestsRepository.findAttachmentAccess(requestId);
    const canView = access && canAccess(access.createdById, viewer);
    const attachment = canView && access.attachments.find(({ id }) => id === attachmentId);
    if (!attachment) throw new NotFoundException(ATTACHMENT_NOT_FOUND_MESSAGE);

    return { attachment, stream: this.attachmentsService.openReadStream(attachment) };
  }
}
