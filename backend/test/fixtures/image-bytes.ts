const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff, 0xe0];
const PDF_SIGNATURE = [...Buffer.from('%PDF-1.7')];
const WINDOWS_EXECUTABLE_SIGNATURE = [...Buffer.from('MZ')];

function withPadding(signature: number[], totalBytes: number): Buffer {
  const content = Buffer.alloc(Math.max(totalBytes, signature.length), 0x61);
  Buffer.from(signature).copy(content);
  return content;
}

export const pngBytes = (totalBytes = 64) => withPadding(PNG_SIGNATURE, totalBytes);
export const jpegBytes = (totalBytes = 64) => withPadding(JPEG_SIGNATURE, totalBytes);
export const pdfBytes = () => withPadding(PDF_SIGNATURE, 64);
export const executableBytes = () => withPadding(WINDOWS_EXECUTABLE_SIGNATURE, 64);
