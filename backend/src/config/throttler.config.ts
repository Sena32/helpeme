import { ConfigService } from '@nestjs/config';
import { ThrottlerModuleOptions } from '@nestjs/throttler';
import { Env } from './env.schema';

const MILLISECONDS_PER_SECOND = 1000;

export function buildThrottlerOptions(config: ConfigService<Env, true>): ThrottlerModuleOptions {
  return [
    {
      ttl: config.get('THROTTLE_TTL', { infer: true }) * MILLISECONDS_PER_SECOND,
      limit: config.get('THROTTLE_LIMIT', { infer: true }),
    },
  ];
}
