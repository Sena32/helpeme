import {
  ArgumentsHost,
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { AllExceptionsFilter, INTERNAL_ERROR_MESSAGE } from './all-exceptions.filter';

type SentResponse = { statusCode?: number; body?: unknown };

function hostFor(sent: SentResponse): ArgumentsHost {
  const response = {
    status(code: number) {
      sent.statusCode = code;
      return this;
    },
    json(body: unknown) {
      sent.body = body;
    },
  };
  return {
    switchToHttp: () => ({ getRequest: () => ({ id: 'req-1' }), getResponse: () => response }),
  } as unknown as ArgumentsHost;
}

function handle(exception: unknown): { sent: SentResponse; logger: { error: jest.Mock } } {
  const logger = { error: jest.fn() };
  const sent: SentResponse = {};
  new AllExceptionsFilter(logger as unknown as PinoLogger).catch(exception, hostFor(sent));
  return { sent, logger };
}

describe('AllExceptionsFilter', () => {
  it('formats HTTP exceptions as { statusCode, error, message, requestId }', () => {
    const { sent } = handle(new ForbiddenException('Sem permissão.'));

    expect(sent).toEqual({
      statusCode: 403,
      body: { statusCode: 403, error: 'Forbidden', message: 'Sem permissão.', requestId: 'req-1' },
    });
  });

  it('keeps the list of validation messages', () => {
    const { sent } = handle(new BadRequestException(['nome inválido', 'e-mail inválido']));

    expect(sent.body).toMatchObject({ message: ['nome inválido', 'e-mail inválido'] });
  });

  it('hides unexpected errors behind a generic 500 and logs them', () => {
    const { sent, logger } = handle(new Error('connection string mongodb://user:secret@host'));

    expect(sent).toEqual({
      statusCode: 500,
      body: {
        statusCode: 500,
        error: 'Internal Server Error',
        message: INTERNAL_ERROR_MESSAGE,
        requestId: 'req-1',
      },
    });
    expect(logger.error).toHaveBeenCalled();
  });

  it.each([
    [new PayloadTooLargeException('File too large'), 'Arquivo excede o tamanho máximo permitido.'],
    [
      new BadRequestException('Too many files'),
      'Quantidade de arquivos excede o máximo permitido.',
    ],
    [new BadRequestException('Unexpected field'), 'Campo de arquivo inesperado. Use "files".'],
    [
      new HttpException('ThrottlerException: Too Many Requests', HttpStatus.TOO_MANY_REQUESTS),
      'Muitas tentativas. Aguarde e tente novamente.',
    ],
    [new NotFoundException('Cannot GET /api/nada'), 'Recurso não encontrado.'],
  ])('translates framework message of %p to pt-BR', (exception, expectedMessage) => {
    expect(handle(exception).sent.body).toMatchObject({ message: expectedMessage });
  });
});
