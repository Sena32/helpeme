import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { basename, extname } from 'node:path';
import { Readable } from 'node:stream';
import { Attachment } from '../schemas/service-request.model';
import { ATTACHMENT_STORAGE, AttachmentStorage } from './attachment-storage';
import {
  AcceptedImageMimeType,
  isAcceptedImageMimeType,
  matchesDeclaredImageType,
} from './file-signature';

export const INVALID_ATTACHMENT_MESSAGE =
  'Anexo inválido: envie apenas imagens JPG ou PNG (conteúdo verificado).';

const EXTENSION_BY_MIME_TYPE: Record<AcceptedImageMimeType, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
};
const ORIGINAL_NAME_MAX_LENGTH = 255;

export interface UploadedImage {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface PreparedAttachment {
  attachment: Attachment;
  content: Buffer;
}

function sanitizeOriginalName(originalName: string): string {
  const fileName = basename(originalName.replace(/\\/g, '/'));
  const extension = extname(fileName);
  return fileName.length <= ORIGINAL_NAME_MAX_LENGTH
    ? fileName
    : fileName.slice(0, ORIGINAL_NAME_MAX_LENGTH - extension.length) + extension;
}

function toAttachment(file: UploadedImage & { mimetype: AcceptedImageMimeType }): Attachment {
  const id = randomUUID();
  return {
    id,
    originalName: sanitizeOriginalName(file.originalname),
    storedName: `${id}${EXTENSION_BY_MIME_TYPE[file.mimetype]}`,
    mimeType: file.mimetype,
    sizeBytes: file.size,
  };
}

@Injectable()
export class AttachmentsService {
  constructor(@Inject(ATTACHMENT_STORAGE) private readonly storage: AttachmentStorage) {}

  // Validates every file before writing any, so a rejected upload leaves nothing on disk.
  prepare(files: UploadedImage[]): PreparedAttachment[] {
    return files.map((file) => {
      const { mimetype } = file;
      if (!isAcceptedImageMimeType(mimetype) || !matchesDeclaredImageType(file.buffer, mimetype)) {
        throw new BadRequestException(INVALID_ATTACHMENT_MESSAGE);
      }
      return { attachment: toAttachment({ ...file, mimetype }), content: file.buffer };
    });
  }

  async store(prepared: PreparedAttachment[]): Promise<void> {
    await Promise.all(
      prepared.map(({ attachment, content }) => this.storage.save(attachment.storedName, content)),
    );
  }

  async discard(attachments: Attachment[]): Promise<void> {
    await Promise.all(attachments.map(({ storedName }) => this.storage.remove(storedName)));
  }

  openReadStream(attachment: Attachment): Readable {
    return this.storage.openReadStream(attachment.storedName);
  }
}
