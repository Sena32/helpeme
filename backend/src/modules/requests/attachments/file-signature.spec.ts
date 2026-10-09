import {
  executableBytes,
  jpegBytes,
  pdfBytes,
  pngBytes,
} from '../../../../test/fixtures/image-bytes';
import { matchesDeclaredImageType } from './file-signature';

describe('matchesDeclaredImageType (RN-06)', () => {
  it('accepts PNG and JPEG content matching the declared type', () => {
    expect(matchesDeclaredImageType(pngBytes(), 'image/png')).toBe(true);
    expect(matchesDeclaredImageType(jpegBytes(), 'image/jpeg')).toBe(true);
  });

  it('AC-12: rejects an executable renamed to .png', () => {
    expect(matchesDeclaredImageType(executableBytes(), 'image/png')).toBe(false);
  });

  it('AC-12: rejects a PDF even when declared as an image', () => {
    expect(matchesDeclaredImageType(pdfBytes(), 'image/jpeg')).toBe(false);
  });

  it('rejects content whose signature belongs to another accepted type', () => {
    expect(matchesDeclaredImageType(jpegBytes(), 'image/png')).toBe(false);
  });

  it('rejects unsupported declared types and empty files', () => {
    expect(matchesDeclaredImageType(pdfBytes(), 'application/pdf')).toBe(false);
    expect(matchesDeclaredImageType(Buffer.alloc(0), 'image/png')).toBe(false);
  });
});
