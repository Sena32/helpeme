import { z } from 'zod';
import { REQUEST_STATUSES } from '@/types/requests';

// Mirrors RN-08 and the backend DTO limits.
export const ADMIN_NOTE_MAX_LENGTH = 500;
export const RESOLUTION_MAX_LENGTH = 1000;

export const handlingSchema = z.object({
  status: z.enum(Object.values(REQUEST_STATUSES)),
  adminNote: z
    .string()
    .max(ADMIN_NOTE_MAX_LENGTH, 'A observação deve ter no máximo 500 caracteres.'),
});

export const finalizeRequestSchema = z.object({
  resolution: z
    .string()
    .trim()
    .min(1, 'Informe a resolução para finalizar.')
    .max(RESOLUTION_MAX_LENGTH, 'A resolução deve ter no máximo 1000 caracteres.'),
});

export type HandlingFormValues = z.infer<typeof handlingSchema>;
export type FinalizeRequestFormValues = z.infer<typeof finalizeRequestSchema>;
