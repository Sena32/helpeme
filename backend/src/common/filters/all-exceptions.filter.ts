import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

export const INTERNAL_ERROR_MESSAGE = 'Erro interno do servidor. Tente novamente mais tarde.';

type ErrorMessage = string | string[];

// Framework/library messages (Multer, Throttler, router) arrive in English.
const TRANSLATED_MESSAGES: ReadonlyArray<[RegExp, string]> = [
  [/^File too large$/, 'Arquivo excede o tamanho máximo permitido.'],
  [/^Too many files$/, 'Quantidade de arquivos excede o máximo permitido.'],
  [/^Unexpected field$/, 'Campo de arquivo inesperado. Use "files".'],
  [/Too Many Requests/, 'Muitas tentativas. Aguarde e tente novamente.'],
  [/^Cannot (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS) /, 'Recurso não encontrado.'],
];

function translate(message: ErrorMessage): ErrorMessage {
  if (Array.isArray(message)) return message;
  return TRANSLATED_MESSAGES.find(([pattern]) => pattern.test(message))?.[1] ?? message;
}

function messageOf(exception: HttpException): ErrorMessage {
  const response = exception.getResponse();
  if (typeof response === 'string') return response;
  const { message } = response as { message?: unknown };
  const isMessageList = Array.isArray(message) && message.every((item) => typeof item === 'string');
  return typeof message === 'string' || isMessageList ? message : exception.message;
}

function reasonPhrase(statusCode: number): string {
  const name = HttpStatus[statusCode] ?? 'ERROR';
  return name
    .toLowerCase()
    .replace(
      /(^|_)(\w)/g,
      (_match, separator: string, letter: string) =>
        `${separator ? ' ' : ''}${letter.toUpperCase()}`,
    );
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(@InjectPinoLogger(AllExceptionsFilter.name) private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request & { id?: unknown }>();
    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    if (!isHttpException) this.logger.error({ err: exception }, 'Unhandled exception');

    http
      .getResponse<Response>()
      .status(statusCode)
      .json({
        statusCode,
        error: reasonPhrase(statusCode),
        message: isHttpException ? translate(messageOf(exception)) : INTERNAL_ERROR_MESSAGE,
        requestId: request.id,
      });
  }
}
