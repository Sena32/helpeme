import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Priority, PRIORITY_RANK, UNSET_PRIORITY_RANK } from '../../../common/enums/priority.enum';
import { RequestStatus } from '../../../common/enums/request-status.enum';
import { Category } from '../../categories/schemas/category.model';
import { User } from '../../users/schemas/user.model';
import {
  ACCEPTED_ATTACHMENT_MIME_TYPES,
  ADMIN_NOTE_MAX_LENGTH,
  MAX_ATTACHMENTS_PER_REQUEST,
  REQUEST_DESCRIPTION_MAX_LENGTH,
  REQUEST_DESCRIPTION_MIN_LENGTH,
  REQUEST_TITLE_MAX_LENGTH,
  REQUEST_TITLE_MIN_LENGTH,
  RESOLUTION_MAX_LENGTH,
} from '../requests.constants';

@Schema({ _id: false, versionKey: false })
export class Attachment {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  originalName!: string;

  @Prop({ required: true })
  storedName!: string;

  @Prop({ type: String, required: true, enum: ACCEPTED_ATTACHMENT_MIME_TYPES })
  mimeType!: (typeof ACCEPTED_ATTACHMENT_MIME_TYPES)[number];

  @Prop({ required: true, min: 1 })
  sizeBytes!: number;
}

const AttachmentSchema = SchemaFactory.createForClass(Attachment);
const PRIORITY_RANKS = [UNSET_PRIORITY_RANK, ...Object.values(PRIORITY_RANK)];

@Schema({ collection: 'requests', timestamps: true, versionKey: false, strict: true })
export class ServiceRequest {
  @Prop({
    required: true,
    trim: true,
    minlength: REQUEST_TITLE_MIN_LENGTH,
    maxlength: REQUEST_TITLE_MAX_LENGTH,
  })
  title!: string;

  @Prop({
    required: true,
    trim: true,
    minlength: REQUEST_DESCRIPTION_MIN_LENGTH,
    maxlength: REQUEST_DESCRIPTION_MAX_LENGTH,
  })
  description!: string;

  @Prop({ type: Types.ObjectId, ref: Category.name, required: true })
  category!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  createdBy!: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(RequestStatus), default: RequestStatus.Open })
  status!: RequestStatus;

  @Prop({ type: String, enum: [...Object.values(Priority), null], default: null })
  priority!: Priority | null;

  @Prop({ type: Number, enum: PRIORITY_RANKS, default: UNSET_PRIORITY_RANK })
  priorityRank!: number;

  @Prop({ type: String, trim: true, maxlength: ADMIN_NOTE_MAX_LENGTH, default: null })
  adminNote!: string | null;

  @Prop({ type: String, trim: true, maxlength: RESOLUTION_MAX_LENGTH, default: null })
  resolution!: string | null;

  @Prop({ type: Date, default: null })
  resolvedAt!: Date | null;

  @Prop({ type: Types.ObjectId, ref: User.name, default: null })
  resolvedBy!: Types.ObjectId | null;

  @Prop({
    type: [AttachmentSchema],
    default: [],
    validate: {
      validator: (attachments: Attachment[]) => attachments.length <= MAX_ATTACHMENTS_PER_REQUEST,
      message: `attachments: no máximo ${MAX_ATTACHMENTS_PER_REQUEST} anexos por solicitação.`,
    },
  })
  attachments!: Attachment[];

  createdAt!: Date;
  updatedAt!: Date;
}

export type ServiceRequestDocument = HydratedDocument<ServiceRequest>;

export const ServiceRequestSchema = SchemaFactory.createForClass(ServiceRequest);
ServiceRequestSchema.index({ createdBy: 1, createdAt: -1 });
ServiceRequestSchema.index({ status: 1, priorityRank: -1, createdAt: -1 });
ServiceRequestSchema.index({ createdAt: -1 });
