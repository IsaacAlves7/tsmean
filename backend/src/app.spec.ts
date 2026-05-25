/**
 * app.service.spec.ts  /  app.controller.spec.ts
 * Testa o health-check da aplicação.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AppService }    from './app.service';
import { AppController } from './app.controller';

// ── AppService ────────────────────────────────────────────────────────────────
describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('cenário 01 — serviço deve estar definido', () => {
    expect(service).toBeDefined();
  });

  it('cenário 02 — getHealth() retorna status "ok"', () => {
    const result = service.getHealth();
    expect(result.status).toBe('ok');
  });

  it('cenário 03 — getHealth() retorna stack "tsmean"', () => {
    const result = service.getHealth();
    expect(result.stack).toBe('tsmean');
  });

  it('cenário 04 — getHealth() retorna timestamp em formato ISO 8601', () => {
    const result = service.getHealth();
    expect(() => new Date(result.timestamp)).not.toThrow();
    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
  });

  it('cenário 05 — getHealth() retorna timestamp próximo ao momento atual', () => {
    const before = Date.now();
    const { timestamp } = service.getHealth();
    const after  = Date.now();
    const ts     = new Date(timestamp).getTime();

    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});

// ── AppController ─────────────────────────────────────────────────────────────
describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AppController],
      providers:   [AppService],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  it('cenário 06 — controller deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('cenário 07 — getHealth() retorna objeto com status "ok"', () => {
    const result = controller.getHealth();
    expect(result).toMatchObject({ status: 'ok', stack: 'tsmean' });
  });

  it('cenário 08 — getHealth() retorna objeto com 3 chaves', () => {
    const result = controller.getHealth();
    expect(Object.keys(result)).toHaveLength(3);
    expect(Object.keys(result)).toEqual(
      expect.arrayContaining(['status', 'stack', 'timestamp']),
    );
  });
});
