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
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),
  PAGINATION_MAX_LIMIT: positiveInt,
  THROTTLE_TTL: positiveInt,
  THROTTLE_LIMIT: positiveInt,
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(rawEnv: Record<string, unknown>): Env {
  const result = envSchema.safeParse(rawEnv);
  if (result.success) return result.data;

  const invalidVariables = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
  throw new Error(`Invalid environment variables: ${invalidVariables}`);
}
