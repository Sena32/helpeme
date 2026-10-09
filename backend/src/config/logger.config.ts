import { ConfigService } from '@nestjs/config';
import { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { DestinationStream } from 'pino';
import { Params } from 'nestjs-pino';
import { REQUEST_ID_HEADER, resolveRequestId } from '../common/logging/request-id';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { Env } from './env.schema';

// Defense in depth: serializers below already drop headers and bodies entirely.
const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  'req.body.password',
];

type LoggedRequest = IncomingMessage & { id?: unknown; user?: AuthenticatedUser };

function assignRequestId(request: IncomingMessage, response: ServerResponse): string {
  const requestId = resolveRequestId(request.headers[REQUEST_ID_HEADER.toLowerCase()], randomUUID);
  response.setHeader(REQUEST_ID_HEADER, requestId);
  return requestId;
}

export function buildLoggerParams(
  config: ConfigService<Env, true>,
  destination: DestinationStream,
): Params {
  return {
    pinoHttp: [
      {
        level: config.get('LOG_LEVEL', { infer: true }),
        genReqId: assignRequestId,
        customProps: (request: LoggedRequest) => ({
          requestId: request.id,
          userId: request.user?.id,
        }),
        serializers: {
          req: ({ method, url }: { method: string; url: string }) => ({ method, url }),
          res: ({ statusCode }: { statusCode: number }) => ({ statusCode }),
        },
        redact: { paths: REDACTED_PATHS, censor: '[REDACTED]' },
      },
      destination,
    ],
  };
}
