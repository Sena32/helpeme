import { z } from 'zod';

// Mirrors the backend password policy (RN-02) and DTO limits.
export const PASSWORD_MIN_LENGTH = 8;
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 100;

export const PASSWORD_RULES: ReadonlyArray<{ label: string; test: (password: string) => boolean }> =
  [
    { label: 'Mínimo de 8 caracteres', test: (password) => password.length >= PASSWORD_MIN_LENGTH },
    { label: 'Uma letra maiúscula', test: (password) => /[A-Z]/.test(password) },
    { label: 'Uma letra minúscula', test: (password) => /[a-z]/.test(password) },
    { label: 'Um número', test: (password) => /\d/.test(password) },
    { label: 'Um caractere especial', test: (password) => /[^A-Za-z0-9]/.test(password) },
  ];

export const WEAK_PASSWORD_MESSAGE =
  'A senha deve ter no mínimo 8 caracteres, com letra maiúscula, letra minúscula, número e caractere especial.';

const emailField = z
  .string()
  .trim()
  .pipe(z.email({ message: 'Informe um e-mail válido.' }));

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Informe a senha.'),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(NAME_MIN_LENGTH, 'O nome deve ter entre 2 e 100 caracteres.')
    .max(NAME_MAX_LENGTH, 'O nome deve ter entre 2 e 100 caracteres.'),
  email: emailField,
  password: z
    .string()
    .refine(
      (password) => PASSWORD_RULES.every((rule) => rule.test(password)),
      WEAK_PASSWORD_MESSAGE,
    ),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
