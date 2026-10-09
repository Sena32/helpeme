import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { text } from 'node:stream/consumers';
import { DiskAttachmentStorage } from './disk-attachment-storage';

describe('DiskAttachmentStorage', () => {
  let uploadDir: string;
  let storage: DiskAttachmentStorage;

  beforeEach(async () => {
    uploadDir = await mkdtemp(join(tmpdir(), 'helpeme-storage-'));
    storage = new DiskAttachmentStorage(uploadDir);
  });

  afterEach(async () => {
    await rm(uploadDir, { recursive: true, force: true });
  });

  it('saves content and streams it back by stored name', async () => {
    await storage.save('stored.png', Buffer.from('conteudo'));

    await expect(text(storage.openReadStream('stored.png'))).resolves.toBe('conteudo');
  });

  it('removes stored files', async () => {
    await storage.save('stored.png', Buffer.from('conteudo'));

    await storage.remove('stored.png');

    await expect(readdir(uploadDir)).resolves.toEqual([]);
  });

  it('refuses names that would escape the upload directory', async () => {
    await expect(storage.save('../escape.png', Buffer.from('x'))).rejects.toThrow();
    expect(() => storage.openReadStream('../../etc/passwd')).toThrow();
  });
});
