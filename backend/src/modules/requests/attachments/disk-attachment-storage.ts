import { createReadStream } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { Readable } from 'node:stream';
import { AttachmentStorage } from './attachment-storage';

export class DiskAttachmentStorage implements AttachmentStorage {
  constructor(private readonly uploadDir: string) {}

  async save(storedName: string, content: Buffer): Promise<void> {
    await mkdir(this.uploadDir, { recursive: true });
    await writeFile(this.resolvePath(storedName), content, { flag: 'wx' });
  }

  openReadStream(storedName: string): Readable {
    return createReadStream(this.resolvePath(storedName));
  }

  async remove(storedName: string): Promise<void> {
    await rm(this.resolvePath(storedName), { force: true });
  }

  private resolvePath(storedName: string): string {
    if (basename(storedName) !== storedName) {
      throw new Error(`Invalid stored attachment name: ${storedName}`);
    }
    return join(this.uploadDir, storedName);
  }
}
