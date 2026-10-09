const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff, 0xe0];
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46];
const EXECUTABLE_SIGNATURE = [0x4d, 0x5a];

function fileWith(signature: number[], name: string, type: string, totalBytes = 64): File {
  const content = new Uint8Array(Math.max(totalBytes, signature.length)).fill(0x61);
  content.set(signature);
  return new File([content], name, { type });
}

export const pngFile = (name = 'tela.png', totalBytes?: number) =>
  fileWith(PNG_SIGNATURE, name, 'image/png', totalBytes);
export const jpegFile = (name = 'foto.jpg') => fileWith(JPEG_SIGNATURE, name, 'image/jpeg');
export const pdfFile = (name = 'doc.pdf') => fileWith(PDF_SIGNATURE, name, 'application/pdf');
export const disguisedExecutable = (name = 'virus.png') =>
  fileWith(EXECUTABLE_SIGNATURE, name, 'image/png');
