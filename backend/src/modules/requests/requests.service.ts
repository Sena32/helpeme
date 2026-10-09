import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Readable } from 'node:stream';
import { UNSET_PRIORITY_RANK } from '../../common/enums/priority.enum';
import { RequestStatus } from '../../common/enums/request-status.enum';
import { Role } from '../../common/enums/role.enum';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CategoriesService } from '../categories/categories.service';
import { AttachmentsService, UploadedImage } from './attachments/attachments.service';
import { RequestsRepository } from './requests.repository';
import { CreateRequestInput, RequestDetails } from './requests.types';
import { Attachment } from './schemas/service-request.model';

export const INVALID_CATEGORY_MESSAGE = 'Categoria inexistente ou inativa.';
export const ATTACHMENT_NOT_FOUND_MESSAGE = 'Anexo não encontrado.';

@Injectable()
export class RequestsService {
  constructor(
    private readonly requestsRepository: RequestsRepository,
    private readonly categoriesService: CategoriesService,
    private readonly attachmentsService: AttachmentsService,
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

  // RF-14: anyone other than the owner or an admin gets 404, hiding the attachment's existence.
  async openAttachment(
    requestId: string,
    attachmentId: string,
    viewer: AuthenticatedUser,
  ): Promise<{ attachment: Attachment; stream: Readable }> {
    const access = await this.requestsRepository.findAttachmentAccess(requestId);
    const canView = access && (viewer.role === Role.Admin || access.createdById === viewer.id);
    const attachment = canView && access.attachments.find(({ id }) => id === attachmentId);
    if (!attachment) throw new NotFoundException(ATTACHMENT_NOT_FOUND_MESSAGE);

    return { attachment, stream: this.attachmentsService.openReadStream(attachment) };
  }
}
