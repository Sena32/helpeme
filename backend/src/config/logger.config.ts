import { ConfigService } from '@nestjs/config';
import { Params } from 'nestjs-pino';
import { Env } from './env.schema';

const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  'req.body.password',
];

export function buildLoggerParams(config: ConfigService<Env, true>): Params {
  return {
    pinoHttp: {
      level: config.get('LOG_LEVEL', { infer: true }),
      redact: { paths: REDACTED_PATHS, censor: '[REDACTED]' },
    },
  };
}
