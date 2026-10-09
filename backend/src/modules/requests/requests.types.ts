import { Priority } from '../../common/enums/priority.enum';
import { RequestStatus } from '../../common/enums/request-status.enum';
import { Attachment } from './schemas/service-request.model';

export interface CreateRequestInput {
  title: string;
  categoryId: string;
  description: string;
}

export interface NewRequestRecord {
  title: string;
  description: string;
  categoryId: string;
  createdById: string;
  status: RequestStatus;
  priority: Priority | null;
  priorityRank: number;
  attachments: Attachment[];
}

export interface NamedReference {
  id: string;
  name: string;
}

export interface RequestDetails {
  id: string;
  title: string;
  description: string;
  category: NamedReference;
  createdBy: NamedReference;
  status: RequestStatus;
  priority: Priority | null;
  adminNote: string | null;
  resolution: string | null;
  resolvedAt: Date | null;
  attachments: AttachmentView[];
  createdAt: Date;
  updatedAt: Date;
}

export type AttachmentView = Omit<Attachment, 'storedName'>;

export interface AttachmentAccess {
  createdById: string;
  attachments: Attachment[];
}
