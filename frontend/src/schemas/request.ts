import { z } from 'zod';
import { hasImageSignature } from '@/lib/file-signature';

// Mirrors RN-05/RN-06 and the backend DTO limits.
export const TITLE_MIN_LENGTH = 5;
export const TITLE_MAX_LENGTH = 120;
export const DESCRIPTION_MIN_LENGTH = 50;
export const DESCRIPTION_MAX_LENGTH = 1000;
export const MAX_ATTACHMENTS = 5;
export const MAX_ATTACHMENT_MB = 5;
export const MAX_ATTACHMENT_BYTES = MAX_ATTACHMENT_MB * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png'] as const;

const TITLE_LENGTH_MESSAGE = 'O título deve ter entre 5 e 120 caracteres.';
const DESCRIPTION_LENGTH_MESSAGE = 'A descrição deve ter entre 50 e 1000 caracteres.';

export const createRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(TITLE_MIN_LENGTH, TITLE_LENGTH_MESSAGE)
    .max(TITLE_MAX_LENGTH, TITLE_LENGTH_MESSAGE),
  categoryId: z.string().min(1, 'Selecione uma categoria.'),
  description: z
    .string()
    .trim()
    .min(DESCRIPTION_MIN_LENGTH, DESCRIPTION_LENGTH_MESSAGE)
    .max(DESCRIPTION_MAX_LENGTH, DESCRIPTION_LENGTH_MESSAGE),
});

export type CreateRequestFormValues = z.infer<typeof createRequestSchema>;

function isAcceptedType(type: string): boolean {
  return ACCEPTED_IMAGE_TYPES.some((accepted) => accepted === type);
}

export async function validateAttachment(file: File): Promise<string | null> {
  if (!isAcceptedType(file.type)) return `${file.name}: envie apenas imagens JPG ou PNG.`;
  if (file.size > MAX_ATTACHMENT_BYTES)
    return `${file.name}: o arquivo excede ${MAX_ATTACHMENT_MB} MB.`;
  if (!(await hasImageSignature(file)))
    return `${file.name}: o conteúdo não é uma imagem JPG ou PNG válida.`;
  return null;
}
