import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import {
  AttachmentAccess,
  AttachmentView,
  NamedReference,
  NewRequestRecord,
  RequestDetails,
  RequestListItem,
} from './requests.types';
import { RequestFilter, RequestSort } from './request-list-query';
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

function toListItem(document: PopulatedRequest, includeAuthor: boolean): RequestListItem {
  const item: RequestListItem = {
    id: document._id.toString(),
    title: document.title,
    categoryName: document.category.name,
    status: document.status,
    priority: document.priority,
    createdAt: document.createdAt,
  };
  return includeAuthor ? { ...item, createdBy: { name: document.createdBy.name } } : item;
}

export interface RequestListCriteria {
  filter: RequestFilter;
  sort: RequestSort;
  skip: number;
  limit: number;
  includeAuthor: boolean;
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
    const details = await this.findDetailsById(created._id.toString());
    if (!details) throw new NotFoundException(REQUEST_NOT_FOUND_MESSAGE);
    return details;
  }

  async list({ filter, sort, skip, limit, includeAuthor }: RequestListCriteria): Promise<{
    items: RequestListItem[];
    total: number;
  }> {
    const [documents, total] = await Promise.all([
      this.requestModel
        .find(filter)
        .select('title status priority createdAt category createdBy')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate<{ category: PopulatedReference }>('category', NAME_ONLY)
        .populate<{ createdBy: PopulatedReference }>('createdBy', NAME_ONLY)
        .lean<PopulatedRequest[]>(),
      this.requestModel.countDocuments(filter),
    ]);
    return { items: documents.map((document) => toListItem(document, includeAuthor)), total };
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

  async findDetailsById(id: string): Promise<RequestDetails | null> {
    if (!isValidObjectId(id)) return null;
    const document = await this.requestModel
      .findById(id)
      .populate<{ category: PopulatedReference }>('category', NAME_ONLY)
      .populate<{ createdBy: PopulatedReference }>('createdBy', NAME_ONLY)
      .lean<PopulatedRequest>();
    return document ? toRequestDetails(document) : null;
  }
}
