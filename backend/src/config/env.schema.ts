import { z } from 'zod';

const booleanFromString = z.enum(['true', 'false']).transform((value) => value === 'true');
const positiveInt = z.coerce.number().int().positive();
const requiredText = z.string().min(1);

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  BACKEND_PORT: positiveInt,
  MONGODB_URI: requiredText,
  JWT_SECRET: requiredText,
  JWT_EXPIRES_IN: requiredText,
  COOKIE_SECURE: booleanFromString,
  CORS_ORIGIN: requiredText,
  BCRYPT_ROUNDS: positiveInt,
  UPLOAD_DIR: requiredText,
  MAX_UPLOAD_SIZE_MB: positiveInt,
  MAX_FILES_PER_REQUEST: positiveInt,
  RUN_SEED: booleanFromString,
  ADMIN_ROOT_NAME: requiredText,
  ADMIN_ROOT_EMAIL: z.email(),
  ADMIN_ROOT_PASSWORD: requiredText,
  SEED_USER_NAME: requiredText.optional(),
  SEED_USER_EMAIL: z.email().optional(),
  SEED_USER_PASSWORD: requiredText.optional(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),
  PAGINATION_MAX_LIMIT: positiveInt,
  THROTTLE_TTL: positiveInt,
  THROTTLE_LIMIT: positiveInt,
});

const SEED_USER_KEYS = ['SEED_USER_NAME', 'SEED_USER_EMAIL', 'SEED_USER_PASSWORD'] as const;

// The optional test user (RF-04/AC-33) must be configured completely or not at all.
const envSchemaWithRules = envSchema.superRefine((env, context) => {
  const configured = SEED_USER_KEYS.filter((key) => env[key] !== undefined);
  if (configured.length === 0 || configured.length === SEED_USER_KEYS.length) return;
  for (const key of SEED_USER_KEYS.filter((candidate) => !configured.includes(candidate))) {
    context.addIssue({
      code: 'custom',
      path: [key],
      message: 'Defina todas as variáveis SEED_USER_* ou nenhuma.',
    });
  }
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(rawEnv: Record<string, unknown>): Env {
  const result = envSchemaWithRules.safeParse(rawEnv);
  if (result.success) return result.data;

  const invalidVariables = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
  throw new Error(`Invalid environment variables: ${invalidVariables}`);
}
