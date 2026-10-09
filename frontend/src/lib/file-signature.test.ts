import { disguisedExecutable, jpegFile, pdfFile, pngFile } from '@/test/files';
import { hasImageSignature } from './file-signature';

describe('hasImageSignature', () => {
  it('recognises real PNG and JPEG content', async () => {
    await expect(hasImageSignature(pngFile())).resolves.toBe(true);
    await expect(hasImageSignature(jpegFile())).resolves.toBe(true);
  });

  it('AC-12: rejects a renamed executable and a PDF', async () => {
    await expect(hasImageSignature(disguisedExecutable())).resolves.toBe(false);
    await expect(hasImageSignature(pdfFile())).resolves.toBe(false);
  });
});
