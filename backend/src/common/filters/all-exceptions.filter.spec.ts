/**
 * all-exceptions.filter.spec.ts
 * Testa o filtro global de exceções da aplicação.
 *
 * Cenários cobertos:
 *   - HttpException → status e mensagem corretos
 *   - Exceção genérica (Error) → 500
 *   - Resposta inclui timestamp e path
 */

import { AllExceptionsFilter } from './all-exceptions.filter';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';

// ── Mock do contexto HTTP do NestJS ───────────────────────────────────────────
const mockJson   = jest.fn();
const mockStatus = jest.fn().mockReturnValue({ json: mockJson });

const mockResponse = { status: mockStatus };
const mockRequest  = { url: '/api/users', method: 'POST' };

const mockHttpContext = {
  getResponse: () => mockResponse,
  getRequest:  () => mockRequest,
};

const mockHost = {
  switchToHttp: () => mockHttpContext,
} as unknown as ArgumentsHost;

// ── Suite ─────────────────────────────────────────────────────────────────────
describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    jest.clearAllMocks();
  });

  it('cenário 01 — filtro deve estar definido', () => {
    expect(filter).toBeDefined();
  });

  it('cenário 02 — HttpException 404 → status 404 na resposta', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
  });

  it('cenário 03 — HttpException 409 → status 409 na resposta', () => {
    const exception = new HttpException('Conflict', HttpStatus.CONFLICT);

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
  });

  it('cenário 04 — HttpException 400 → status 400 na resposta', () => {
    const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
  });

  it('cenário 05 — exceção genérica (Error) → status 500', () => {
    const exception = new Error('Erro inesperado');

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  it('cenário 06 — resposta inclui campo "timestamp" no json', () => {
    const exception = new HttpException('OK', HttpStatus.OK);

    filter.catch(exception, mockHost);

    const jsonArg = mockJson.mock.calls[0][0];
    expect(jsonArg).toHaveProperty('timestamp');
    expect(() => new Date(jsonArg.timestamp)).not.toThrow();
  });

  it('cenário 07 — resposta inclui "path" com a rota da requisição', () => {
    const exception = new HttpException('OK', HttpStatus.OK);

    filter.catch(exception, mockHost);

    const jsonArg = mockJson.mock.calls[0][0];
    expect(jsonArg).toHaveProperty('path', '/api/users');
  });

  it('cenário 08 — resposta inclui "statusCode" correto no body', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

    filter.catch(exception, mockHost);

    const jsonArg = mockJson.mock.calls[0][0];
    expect(jsonArg).toHaveProperty('statusCode', HttpStatus.NOT_FOUND);
  });
});
