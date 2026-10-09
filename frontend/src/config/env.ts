import { z } from 'zod';

const envSchema = z.object({ VITE_API_BASE_URL: z.string().min(1) });

export type AppEnv = { apiBaseUrl: string };

export function parseEnv(rawEnv: Record<string, unknown>): AppEnv {
  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    const invalidVariables = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Invalid environment variables: ${invalidVariables}`);
  }
  return { apiBaseUrl: result.data.VITE_API_BASE_URL };
}

export const appEnv = parseEnv(import.meta.env);
