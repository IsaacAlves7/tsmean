/**
 * users.service.spec.ts  (Frontend Angular)
 * Testa o UsersService com HttpClientTestingModule.
 *
 * Cenários cobertos:
 *   getAll()    → GET correto, lista retornada, lista vazia
 *   getById()   → GET por ID, body correto
 *   create()    → POST, payload correto, headers
 *   update()    → PATCH, payload parcial
 *   remove()    → DELETE, retorno void
 *   Erros HTTP  → propagação de erros 4xx / 5xx
 */

import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';

import { UsersService } from './users.service';
import { User, CreateUserPayload, UpdateUserPayload } from './user.model';

// ── Helper ────────────────────────────────────────────────────────────────────
const BASE_URL = '/api/users';

const makeUser = (overrides: Partial<User> = {}): User => ({
  id:        1,
  name:      'Alice Frontend',
  email:     'alice@frontend.com',
  isActive:  true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

// ── Suite ─────────────────────────────────────────────────────────────────────
describe('UsersService (Frontend)', () => {
  let service: UsersService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports:   [HttpClientTestingModule],
      providers: [UsersService],
    });

    service = TestBed.inject(UsersService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify()); // garante que não há requests pendentes

  // ── Instanciação ─────────────────────────────────────────────────────────
  it('cenário 01 — serviço deve estar definido', () => {
    expect(service).toBeTruthy();
  });

  // ── getAll() ─────────────────────────────────────────────────────────────
  describe('getAll()', () => {
    it('cenário 02 — dispara GET para /api/users', () => {
      service.getAll().subscribe();

      const req = http.expectOne(BASE_URL);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('cenário 03 — retorna lista de usuários recebida da API', () => {
      const users = [makeUser(), makeUser({ id: 2, email: 'bob@frontend.com' })];
      let result: User[] = [];

      service.getAll().subscribe((data) => (result = data));

      http.expectOne(BASE_URL).flush(users);
      expect(result).toHaveLength(2);
      expect(result[0].email).toBe('alice@frontend.com');
    });

    it('cenário 04 — retorna array vazio quando API responde []', () => {
      let result: User[] = [makeUser()]; // pré-populado para confirmar substituição

      service.getAll().subscribe((data) => (result = data));

      http.expectOne(BASE_URL).flush([]);
      expect(result).toHaveLength(0);
    });

    it('cenário 05 — propaga erro HTTP 500 do servidor', () => {
      let error: HttpErrorResponse | undefined;

      service.getAll().subscribe({ error: (e) => (error = e) });

      http.expectOne(BASE_URL).flush('Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
      });

      expect(error).toBeDefined();
      expect(error?.status).toBe(500);
    });
  });

  // ── getById() ────────────────────────────────────────────────────────────
  describe('getById()', () => {
    it('cenário 06 — dispara GET para /api/users/:id correto', () => {
      service.getById(42).subscribe();

      const req = http.expectOne(`${BASE_URL}/42`);
      expect(req.request.method).toBe('GET');
      req.flush(makeUser({ id: 42 }));
    });

    it('cenário 07 — retorna o usuário com dados corretos', () => {
      const user = makeUser({ id: 5, name: 'Específico' });
      let result: User | undefined;

      service.getById(5).subscribe((u) => (result = u));

      http.expectOne(`${BASE_URL}/5`).flush(user);
      expect(result?.id).toBe(5);
      expect(result?.name).toBe('Específico');
    });

    it('cenário 08 — propaga erro HTTP 404 para ID inexistente', () => {
      let error: HttpErrorResponse | undefined;

      service.getById(999).subscribe({ error: (e) => (error = e) });

      http.expectOne(`${BASE_URL}/999`).flush(
        { message: 'Usuário com ID 999 não encontrado' },
        { status: 404, statusText: 'Not Found' },
      );

      expect(error?.status).toBe(404);
    });
  });

  // ── create() ─────────────────────────────────────────────────────────────
  describe('create()', () => {
    const payload: CreateUserPayload = {
      name:     'Novo Usuário',
      email:    'novo@frontend.com',
      password: 'Senha@123',
    };

    it('cenário 09 — dispara POST para /api/users', () => {
      service.create(payload).subscribe();

      const req = http.expectOne(BASE_URL);
      expect(req.request.method).toBe('POST');
      req.flush(makeUser());
    });

    it('cenário 10 — envia o payload exato no body da requisição', () => {
      service.create(payload).subscribe();

      const req = http.expectOne(BASE_URL);
      expect(req.request.body).toEqual(payload);
      req.flush(makeUser());
    });

    it('cenário 11 — retorna o usuário criado pela API', () => {
      const created = makeUser({ name: 'Novo Usuário', email: 'novo@frontend.com' });
      let result: User | undefined;

      service.create(payload).subscribe((u) => (result = u));

      http.expectOne(BASE_URL).flush(created);
      expect(result?.email).toBe('novo@frontend.com');
    });

    it('cenário 12 — propaga erro HTTP 409 (e-mail duplicado)', () => {
      let error: HttpErrorResponse | undefined;

      service.create(payload).subscribe({ error: (e) => (error = e) });

      http.expectOne(BASE_URL).flush(
        { message: "E-mail 'novo@frontend.com' já está em uso" },
        { status: 409, statusText: 'Conflict' },
      );

      expect(error?.status).toBe(409);
    });

    it('cenário 13 — envia Content-Type application/json', () => {
      service.create(payload).subscribe();

      const req = http.expectOne(BASE_URL);
      expect(req.request.headers.get('Content-Type')).toContain('application/json');
      req.flush(makeUser());
    });
  });

  // ── update() ─────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('cenário 14 — dispara PATCH para /api/users/:id', () => {
      service.update(1, { name: 'Atualizado' }).subscribe();

      const req = http.expectOne(`${BASE_URL}/1`);
      expect(req.request.method).toBe('PATCH');
      req.flush(makeUser({ name: 'Atualizado' }));
    });

    it('cenário 15 — envia somente os campos fornecidos (DTO parcial)', () => {
      const partial: UpdateUserPayload = { isActive: false };
      service.update(1, partial).subscribe();

      const req = http.expectOne(`${BASE_URL}/1`);
      expect(req.request.body).toEqual(partial);
      req.flush(makeUser({ isActive: false }));
    });

    it('cenário 16 — propaga erro 404 ao atualizar ID inexistente', () => {
      let error: HttpErrorResponse | undefined;

      service.update(999, { name: 'X' }).subscribe({ error: (e) => (error = e) });

      http.expectOne(`${BASE_URL}/999`).flush(
        { message: 'Usuário com ID 999 não encontrado' },
        { status: 404, statusText: 'Not Found' },
      );

      expect(error?.status).toBe(404);
    });
  });

  // ── remove() ─────────────────────────────────────────────────────────────
  describe('remove()', () => {
    it('cenário 17 — dispara DELETE para /api/users/:id', () => {
      service.remove(1).subscribe();

      const req = http.expectOne(`${BASE_URL}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('cenário 18 — completa sem emitir valor (retorno void)', () => {
      let emitted = false;
      let completed = false;

      service.remove(1).subscribe({
        next:     () => (emitted = true),
        complete: () => (completed = true),
      });

      http.expectOne(`${BASE_URL}/1`).flush(null);

      expect(completed).toBe(true);
      expect(emitted).toBe(false);
    });

    it('cenário 19 — propaga erro 404 ao remover ID inexistente', () => {
      let error: HttpErrorResponse | undefined;

      service.remove(999).subscribe({ error: (e) => (error = e) });

      http.expectOne(`${BASE_URL}/999`).flush(
        { message: 'Não encontrado' },
        { status: 404, statusText: 'Not Found' },
      );

      expect(error?.status).toBe(404);
    });

    it('cenário 20 — usa o ID numérico exato na URL', () => {
      service.remove(77).subscribe();

      const req = http.expectOne(`${BASE_URL}/77`);
      expect(req.request.url).toBe(`${BASE_URL}/77`);
      req.flush(null);
    });
  });
});
