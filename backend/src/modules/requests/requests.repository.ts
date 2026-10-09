import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import {
  AttachmentAccess,
  AttachmentView,
  NamedReference,
  NewRequestRecord,
  RequestDetails,
} from './requests.types';
import { Attachment, ServiceRequest } from './schemas/service-request.model';

const NAME_ONLY = 'name';
export const REQUEST_NOT_FOUND_MESSAGE = 'Solicitação não encontrada.';

type PopulatedReference = { _id: Types.ObjectId; name: string };
type PopulatedRequest = Omit<ServiceRequest, 'category' | 'createdBy'> & {
  _id: Types.ObjectId;
  category: PopulatedReference;
  createdBy: PopulatedReference;
};

function toNamedReference(reference: PopulatedReference): NamedReference {
  return { id: reference._id.toString(), name: reference.name };
}

function toAttachmentView({ id, originalName, mimeType, sizeBytes }: Attachment): AttachmentView {
  return { id, originalName, mimeType, sizeBytes };
}

function toRequestDetails(document: PopulatedRequest): RequestDetails {
  return {
    id: document._id.toString(),
    title: document.title,
    description: document.description,
    category: toNamedReference(document.category),
    createdBy: toNamedReference(document.createdBy),
    status: document.status,
    priority: document.priority,
    adminNote: document.adminNote,
    resolution: document.resolution,
    resolvedAt: document.resolvedAt,
    attachments: document.attachments.map(toAttachmentView),
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

@Injectable()
export class RequestsRepository {
  constructor(
    @InjectModel(ServiceRequest.name) private readonly requestModel: Model<ServiceRequest>,
  ) {}

  async create({ categoryId, createdById, ...fields }: NewRequestRecord): Promise<RequestDetails> {
    const created = await this.requestModel.create({
      ...fields,
      category: categoryId,
      createdBy: createdById,
    });
    return this.findDetailsById(created._id);
  }

  async findAttachmentAccess(requestId: string): Promise<AttachmentAccess | null> {
    if (!isValidObjectId(requestId)) return null;
    const document = await this.requestModel
      .findById(requestId)
      .select('createdBy attachments')
      .lean();
    if (!document) return null;
    return { createdById: document.createdBy.toString(), attachments: document.attachments };
  }

  private async findDetailsById(id: Types.ObjectId): Promise<RequestDetails> {
    const document = await this.requestModel
      .findById(id)
      .populate<{ category: PopulatedReference }>('category', NAME_ONLY)
      .populate<{ createdBy: PopulatedReference }>('createdBy', NAME_ONLY)
      .lean<PopulatedRequest>();
    if (!document) throw new NotFoundException(REQUEST_NOT_FOUND_MESSAGE);
    return toRequestDetails(document);
  }
}
