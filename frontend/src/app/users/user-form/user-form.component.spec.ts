/**
 * user-form.component.spec.ts
 * Cenários do formulário de criação e edição de usuários.
 *
 * Cobertura:
 *   Modo criação  — form vazio, validação, submit, erro da API
 *   Modo edição   — pré-preenchimento, atualização, toggle isActive
 *   submit()      — estados de loading, redirecionamento, campos inválidos
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { UserFormComponent } from './user-form.component';
import { UsersService } from '../users.service';
import { User } from '../user.model';

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeUser = (overrides: Partial<User> = {}): User => ({
  id:        1,
  name:      'Alice Form',
  email:     'alice@form.com',
  isActive:  true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

const mockActivatedRoute = (id?: string) => ({
  snapshot: {
    paramMap: { get: (key: string) => (key === 'id' ? id ?? null : null) },
  },
});

// ── Suite ─────────────────────────────────────────────────────────────────────
describe('UserFormComponent', () => {
  let fixture:   ComponentFixture<UserFormComponent>;
  let component: UserFormComponent;
  let service:   jasmine.SpyObj<UsersService>;
  let router:    Router;

  const buildComponent = async (routeId?: string) => {
    await TestBed.configureTestingModule({
      imports:   [UserFormComponent, RouterTestingModule],
      providers: [
        { provide: UsersService, useValue: service },
        { provide: ActivatedRoute, useValue: mockActivatedRoute(routeId) },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
    router    = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    fixture.detectChanges();
  };

  beforeEach(() => {
    service = jasmine.createSpyObj('UsersService', ['create', 'update', 'getById']);
  });

  afterEach(() => TestBed.resetTestingModule());

  // ── Modo Criação ─────────────────────────────────────────────────────────
  describe('modo criação (sem ID na rota)', () => {
    beforeEach(async () => {
      service.create.and.returnValue(of(makeUser()));
      await buildComponent();
    });

    it('cenário 01 — componente deve ser criado no modo criação', () => {
      expect(component).toBeTruthy();
      expect(component.isEdit()).toBe(false);
    });

    it('cenário 02 — form começa com todos os campos vazios', () => {
      expect(component.form.value.name).toBeFalsy();
      expect(component.form.value.email).toBeFalsy();
      expect(component.form.value.password).toBeFalsy();
    });

    it('cenário 03 — form começa inválido (campos obrigatórios ausentes)', () => {
      expect(component.form.invalid).toBe(true);
    });

    it('cenário 04 — form é válido após preencher campos corretamente', () => {
      component.form.patchValue({
        name:     'Novo User',
        email:    'novo@form.com',
        password: 'Senha@123',
      });
      expect(component.form.valid).toBe(true);
    });

    it('cenário 05 — não chama create() se form inválido ao submeter', () => {
      component.submit();
      expect(service.create).not.toHaveBeenCalled();
    });

    it('cenário 06 — marca todos campos como touched ao submeter form inválido', () => {
      component.submit();
      expect(component.form.get('name')?.touched).toBe(true);
      expect(component.form.get('email')?.touched).toBe(true);
    });

    it('cenário 07 — chama service.create() com os dados corretos', () => {
      component.form.patchValue({
        name: 'Novo', email: 'novo@form.com', password: 'Senha@123',
      });
      component.submit();

      expect(service.create).toHaveBeenCalledWith(
        jasmine.objectContaining({ name: 'Novo', email: 'novo@form.com' }),
      );
    });

    it('cenário 08 — redireciona para /users após criação bem-sucedida', () => {
      component.form.patchValue({
        name: 'Ok', email: 'ok@form.com', password: 'Senha@123',
      });
      component.submit();

      expect(router.navigate).toHaveBeenCalledWith(['/users']);
    });

    it('cenário 09 — exibe mensagem de erro quando API falha', () => {
      service.create.and.returnValue(
        throwError(() => ({ error: { message: 'Erro da API' } })),
      );
      component.form.patchValue({
        name: 'Erro', email: 'erro@form.com', password: 'Senha@123',
      });
      component.submit();

      expect(component.error()).toBe('Erro da API');
    });

    it('cenário 10 — loading() é false após erro na criação', () => {
      service.create.and.returnValue(
        throwError(() => ({ error: { message: 'Falha' } })),
      );
      component.form.patchValue({
        name: 'X', email: 'x@x.com', password: 'Senha@123',
      });
      component.submit();

      expect(component.loading()).toBe(false);
    });
  });

  // ── Modo Edição ──────────────────────────────────────────────────────────
  describe('modo edição (com ID na rota)', () => {
    const user = makeUser({ id: 1, name: 'Alice Form', email: 'alice@form.com' });

    beforeEach(async () => {
      service.getById.and.returnValue(of(user));
      service.update.and.returnValue(of({ ...user, name: 'Alice Editada' }));
      await buildComponent('1');
    });

    it('cenário 11 — isEdit() retorna true no modo edição', () => {
      expect(component.isEdit()).toBe(true);
    });

    it('cenário 12 — pré-preenche o form com dados do usuário carregado', () => {
      expect(component.form.value.name).toBe(user.name);
      expect(component.form.value.email).toBe(user.email);
    });

    it('cenário 13 — campo password não é obrigatório no modo edição', () => {
      const pwCtrl = component.form.get('password');
      expect(pwCtrl?.hasError('required')).toBeFalsy();
    });

    it('cenário 14 — form é válido sem preencher password no modo edição', () => {
      // password está vazio (mantém a existente no servidor)
      expect(component.form.valid).toBe(true);
    });

    it('cenário 15 — chama service.update() com ID e dados corretos', () => {
      component.form.patchValue({ name: 'Alice Editada' });
      component.submit();

      expect(service.update).toHaveBeenCalledWith(
        1,
        jasmine.objectContaining({ name: 'Alice Editada' }),
      );
    });

    it('cenário 16 — não envia password vazio ao atualizar', () => {
      component.submit();

      const arg = service.update.calls.mostRecent().args[1];
      expect(arg.password).toBeFalsy();
    });

    it('cenário 17 — envia nova senha se preenchida no modo edição', () => {
      component.form.patchValue({ password: 'NovaSenha@789' });
      component.submit();

      const arg = service.update.calls.mostRecent().args[1];
      expect(arg.password).toBe('NovaSenha@789');
    });

    it('cenário 18 — pode alternar isActive via toggle', () => {
      component.form.patchValue({ isActive: false });
      component.submit();

      const arg = service.update.calls.mostRecent().args[1];
      expect(arg.isActive).toBe(false);
    });

    it('cenário 19 — redireciona para /users após atualização bem-sucedida', () => {
      component.submit();
      expect(router.navigate).toHaveBeenCalledWith(['/users']);
    });

    it('cenário 20 — isInvalid() retorna false para campo válido e tocado', () => {
      component.form.get('name')?.markAsTouched();
      expect(component.isInvalid('name')).toBe(false); // name tem valor válido
    });
  });
});
