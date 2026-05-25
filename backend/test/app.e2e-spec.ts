/**
 * app.e2e-spec.ts
 * Testes de integração (E2E) da API REST do tsmean.
 * Requer banco de dados MySQL configurado em .env (DB_NAME=tsmean_test).
 *
 * Cenários cobertos:
 *   Health Check
 *   POST   /api/users  — criação, validação, duplicidade
 *   GET    /api/users  — listagem
 *   GET    /api/users/:id — busca, not found
 *   PATCH  /api/users/:id — atualização
 *   DELETE /api/users/:id — remoção, not found
 *   Fluxo CRUD completo
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('tsmean API (E2E)', () => {
  let app: INestApplication;
  let createdUserId: number;

  const baseUser = {
    name:     'E2E Tester',
    email:    `e2e_${Date.now()}@tsmean.com`,
    password: 'Senha@E2E!',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist:            true,
        forbidNonWhitelisted: true,
        transform:            true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Health Check ──────────────────────────────────────────────────────────
  describe('GET /api/health', () => {
    it('cenário 01 — retorna status 200 com body { status: "ok" }', async () => {
      await request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
          expect(res.body.stack).toBe('tsmean');
          expect(res.body.timestamp).toBeDefined();
        });
    });
  });

  // ── POST /api/users ───────────────────────────────────────────────────────
  describe('POST /api/users', () => {
    it('cenário 02 — cria usuário válido e retorna 201 sem senha', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/users')
        .send(baseUser)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.email).toBe(baseUser.email);
      expect(res.body).not.toHaveProperty('password');
      createdUserId = res.body.id;
    });

    it('cenário 03 — retorna 409 ao tentar criar com e-mail duplicado', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .send(baseUser)
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('já está em uso');
        });
    });

    it('cenário 04 — retorna 400 quando name está vazio', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .send({ ...baseUser, name: '' })
        .expect(400);
    });

    it('cenário 05 — retorna 400 quando e-mail é inválido', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .send({ ...baseUser, email: 'nao-e-email' })
        .expect(400);
    });

    it('cenário 06 — retorna 400 quando senha tem menos de 8 caracteres', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .send({ ...baseUser, password: '1234567' })
        .expect(400);
    });

    it('cenário 07 — retorna 400 quando body está completamente vazio', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .send({})
        .expect(400);
    });

    it('cenário 08 — rejeita campos extras não declarados no DTO (whitelist)', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .send({ ...baseUser, email: `extra_${Date.now()}@t.com`, campoExtra: 'hack' })
        .expect(400);
    });

    it('cenário 09 — retorna isActive=true por padrão ao criar', async () => {
      const uniqueEmail = `padrao_${Date.now()}@tsmean.com`;
      const res = await request(app.getHttpServer())
        .post('/api/users')
        .send({ name: 'Padrão', email: uniqueEmail, password: 'Senha@123' })
        .expect(201);

      expect(res.body.isActive).toBe(true);
    });
  });

  // ── GET /api/users ────────────────────────────────────────────────────────
  describe('GET /api/users', () => {
    it('cenário 10 — retorna array com pelo menos o usuário criado', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('cenário 11 — nenhum usuário na lista contém senha', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users')
        .expect(200);

      res.body.forEach((user: any) => {
        expect(user).not.toHaveProperty('password');
      });
    });

    it('cenário 12 — cada usuário tem os campos esperados', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users')
        .expect(200);

      const fields = ['id', 'name', 'email', 'isActive', 'createdAt', 'updatedAt'];
      res.body.forEach((user: any) => {
        fields.forEach((f) => expect(user).toHaveProperty(f));
      });
    });
  });

  // ── GET /api/users/:id ────────────────────────────────────────────────────
  describe('GET /api/users/:id', () => {
    it('cenário 13 — retorna usuário pelo ID correto', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/users/${createdUserId}`)
        .expect(200);

      expect(res.body.id).toBe(createdUserId);
      expect(res.body.email).toBe(baseUser.email);
    });

    it('cenário 14 — retorna 404 para ID inexistente', async () => {
      await request(app.getHttpServer())
        .get('/api/users/999999')
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('não encontrado');
        });
    });

    it('cenário 15 — retorna 400 para ID não numérico', async () => {
      await request(app.getHttpServer())
        .get('/api/users/abc')
        .expect(400);
    });
  });

  // ── PATCH /api/users/:id ──────────────────────────────────────────────────
  describe('PATCH /api/users/:id', () => {
    it('cenário 16 — atualiza o nome com sucesso', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/users/${createdUserId}`)
        .send({ name: 'E2E Atualizado' })
        .expect(200);

      expect(res.body.name).toBe('E2E Atualizado');
      expect(res.body.email).toBe(baseUser.email);
    });

    it('cenário 17 — desativa usuário via isActive=false', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/users/${createdUserId}`)
        .send({ isActive: false })
        .expect(200);

      expect(res.body.isActive).toBe(false);
    });

    it('cenário 18 — retorna 404 ao atualizar ID inexistente', async () => {
      await request(app.getHttpServer())
        .patch('/api/users/999999')
        .send({ name: 'Não existe' })
        .expect(404);
    });
  });

  // ── DELETE /api/users/:id ─────────────────────────────────────────────────
  describe('DELETE /api/users/:id', () => {
    it('cenário 19 — remove usuário e retorna 204 sem body', async () => {
      await request(app.getHttpServer())
        .delete(`/api/users/${createdUserId}`)
        .expect(204);
    });

    it('cenário 20 — usuário removido não é encontrado na listagem', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users')
        .expect(200);

      const ids = res.body.map((u: any) => u.id);
      expect(ids).not.toContain(createdUserId);
    });

    it('cenário 21 — retorna 404 ao remover ID já deletado', async () => {
      await request(app.getHttpServer())
        .delete(`/api/users/${createdUserId}`)
        .expect(404);
    });
  });
});
