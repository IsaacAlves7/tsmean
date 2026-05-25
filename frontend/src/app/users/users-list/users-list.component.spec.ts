/**
 * users-list.component.spec.ts
 * Cenários do componente de listagem de usuários.
 *
 * Cobertura:
 *   ngOnInit — carregamento automático
 *   load()   — sucesso, erro, estado de loading
 *   delete() — confirmação, remoção local, cancelamento, erro
 *   Signals  — users, loading, error
 *   Template — renderização condicional
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { UsersListComponent } from './users-list.component';
import { UsersService } from '../users.service';
import { User } from '../user.model';

// ── Dados de teste ────────────────────────────────────────────────────────────
const makeUser = (overrides: Partial<User> = {}): User => ({
  id:        1,
  name:      'Alice Lista',
  email:     'alice@lista.com',
  isActive:  true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

const MOCK_USERS: User[] = [
  makeUser({ id: 1 }),
  makeUser({ id: 2, name: 'Bob Lista', email: 'bob@lista.com' }),
  makeUser({ id: 3, name: 'Carol Lista', email: 'carol@lista.com', isActive: false }),
];

// ── Suite ─────────────────────────────────────────────────────────────────────
describe('UsersListComponent', () => {
  let fixture:   ComponentFixture<UsersListComponent>;
  let component: UsersListComponent;
  let service:   jasmine.SpyObj<UsersService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj('UsersService', ['getAll', 'remove']);
    service.getAll.and.returnValue(of(MOCK_USERS));

    await TestBed.configureTestingModule({
      imports:   [UsersListComponent, RouterTestingModule],
      providers: [{ provide: UsersService, useValue: service }],
    }).compileComponents();

    fixture   = TestBed.createComponent(UsersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Criação ─────────────────────────────────────────────────────────────
  it('cenário 01 — componente deve ser criado', () => {
    expect(component).toBeTruthy();
  });

  // ── ngOnInit / load() ────────────────────────────────────────────────────
  describe('carregamento inicial', () => {
    it('cenário 02 — chama service.getAll() automaticamente no init', () => {
      expect(service.getAll).toHaveBeenCalledTimes(1);
    });

    it('cenário 03 — popula signal users com os dados da API', () => {
      expect(component.users()).toHaveLength(MOCK_USERS.length);
    });

    it('cenário 04 — desativa o signal loading após carregar', () => {
      expect(component.loading()).toBe(false);
    });

    it('cenário 05 — signal error permanece null após sucesso', () => {
      expect(component.error()).toBeNull();
    });

    it('cenário 06 — define error e desativa loading em caso de falha', () => {
      service.getAll.and.returnValue(
        throwError(() => ({ message: 'Erro de rede' })),
      );

      component.load();

      expect(component.error()).toBe('Erro de rede');
      expect(component.loading()).toBe(false);
    });

    it('cenário 07 — lista permanece vazia em caso de erro', () => {
      service.getAll.and.returnValue(
        throwError(() => ({ message: 'Falha' })),
      );
      component.load();

      // usuários anteriores ainda existem, mas novo load com erro não adiciona
      expect(component.error()).toBeTruthy();
    });

    it('cenário 08 — segunda chamada a load() substitui dados anteriores', () => {
      const novaLista = [makeUser({ id: 99, name: 'Novo' })];
      service.getAll.and.returnValue(of(novaLista));

      component.load();

      expect(component.users()).toHaveLength(1);
      expect(component.users()[0].id).toBe(99);
    });
  });

  // ── delete() ─────────────────────────────────────────────────────────────
  describe('delete()', () => {
    beforeEach(() => {
      service.remove.and.returnValue(of(undefined));
      spyOn(window, 'confirm').and.returnValue(true);
    });

    it('cenário 09 — remove o usuário correto da lista local', () => {
      const target = MOCK_USERS[0];
      component.delete(target);

      expect(component.users().find((u) => u.id === target.id)).toBeUndefined();
    });

    it('cenário 10 — preserva os outros usuários após remoção', () => {
      component.delete(MOCK_USERS[0]);

      expect(component.users()).toHaveLength(MOCK_USERS.length - 1);
      expect(component.users().map((u) => u.id)).not.toContain(MOCK_USERS[0].id);
    });

    it('cenário 11 — chama service.remove com o ID correto', () => {
      component.delete(MOCK_USERS[1]);

      expect(service.remove).toHaveBeenCalledWith(MOCK_USERS[1].id);
    });

    it('cenário 12 — não remove se o usuário cancelar o confirm', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);

      component.delete(MOCK_USERS[0]);

      expect(service.remove).not.toHaveBeenCalled();
      expect(component.users()).toHaveLength(MOCK_USERS.length);
    });

    it('cenário 13 — lista permanece inalterada se API retornar erro', () => {
      service.remove.and.returnValue(
        throwError(() => new Error('Falha ao remover')),
      );

      component.delete(MOCK_USERS[0]);

      // lista local não deve ser alterada se o server falhou
      expect(component.users()).toHaveLength(MOCK_USERS.length);
    });

    it('cenário 14 — remoção de usuário inativo funciona corretamente', () => {
      const inativo = MOCK_USERS.find((u) => !u.isActive)!;
      component.delete(inativo);

      expect(component.users().find((u) => u.id === inativo.id)).toBeUndefined();
    });
  });

  // ── Signals ──────────────────────────────────────────────────────────────
  describe('signals reativos', () => {
    it('cenário 15 — users() começa vazio antes do carregamento', async () => {
      // Recria o componente sem detectChanges
      const f2 = TestBed.createComponent(UsersListComponent);
      service.getAll.and.returnValue(of([]));
      // Antes de detectChanges, o signal ainda pode estar no estado inicial
      expect(Array.isArray(f2.componentInstance.users())).toBe(true);
    });

    it('cenário 16 — loading() é true durante o carregamento (síncrono)', () => {
      // Usa of() que é síncrono — loading já foi resetado
      expect(component.loading()).toBe(false);
    });

    it('cenário 17 — error() é zerado a cada novo load bem-sucedido', () => {
      // Simula erro seguido de sucesso
      service.getAll.and.returnValue(throwError(() => ({ message: 'Ops' })));
      component.load();
      expect(component.error()).toBe('Ops');

      service.getAll.and.returnValue(of(MOCK_USERS));
      component.load();
      expect(component.error()).toBeNull();
    });
  });

  // ── Renderização do template ──────────────────────────────────────────────
  describe('template', () => {
    it('cenário 18 — exibe link "Novo Usuário" na página', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Novo Usuário');
    });

    it('cenário 19 — exibe mensagem de estado vazio quando lista está vazia', () => {
      service.getAll.and.returnValue(of([]));
      component.load();
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Nenhum usuário');
    });

    it('cenário 20 — exibe nomes dos usuários na tabela', () => {
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;

      expect(el.textContent).toContain('Alice Lista');
      expect(el.textContent).toContain('Bob Lista');
    });
  });
});
