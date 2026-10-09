import { z } from 'zod';
import { ROLES } from '@/types/auth';
import { registerSchema } from './auth';

// Mirrors RN-04 and the backend DTOs.
const CATEGORY_NAME_MIN_LENGTH = 2;
const CATEGORY_NAME_MAX_LENGTH = 50;
const CATEGORY_NAME_MESSAGE = 'O nome da categoria deve ter entre 2 e 50 caracteres.';

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(CATEGORY_NAME_MIN_LENGTH, CATEGORY_NAME_MESSAGE)
    .max(CATEGORY_NAME_MAX_LENGTH, CATEGORY_NAME_MESSAGE),
});

export const createUserSchema = registerSchema.extend({
  role: z.enum(Object.values(ROLES), { message: 'Selecione o perfil.' }),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
export type CreateUserFormValues = z.infer<typeof createUserSchema>;
