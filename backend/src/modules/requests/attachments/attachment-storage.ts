import { Readable } from 'node:stream';

export const ATTACHMENT_STORAGE = Symbol('ATTACHMENT_STORAGE');

// ADR-3: disk today, swappable for object storage (S3) behind this contract.
export interface AttachmentStorage {
  save(storedName: string, content: Buffer): Promise<void>;
  openReadStream(storedName: string): Readable;
  remove(storedName: string): Promise<void>;
}
