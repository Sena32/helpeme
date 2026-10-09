import { ACCEPTED_ATTACHMENT_MIME_TYPES } from '../requests.constants';

export type AcceptedImageMimeType = (typeof ACCEPTED_ATTACHMENT_MIME_TYPES)[number];

const IMAGE_SIGNATURES: Record<AcceptedImageMimeType, readonly number[]> = {
  'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  'image/jpeg': [0xff, 0xd8, 0xff],
};

export function isAcceptedImageMimeType(mimeType: string): mimeType is AcceptedImageMimeType {
  return ACCEPTED_ATTACHMENT_MIME_TYPES.some((accepted) => accepted === mimeType);
}

// RN-06: the declared MIME type comes from the client, so the content signature must match it.
export function matchesDeclaredImageType(content: Buffer, declaredMimeType: string): boolean {
  if (!isAcceptedImageMimeType(declaredMimeType)) return false;
  const signature = IMAGE_SIGNATURES[declaredMimeType];
  return (
    content.length > signature.length && signature.every((byte, index) => content[index] === byte)
  );
}
