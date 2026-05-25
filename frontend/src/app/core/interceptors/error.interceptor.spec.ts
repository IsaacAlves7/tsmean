/**
 * error.interceptor.spec.ts
 * Testa o interceptor HTTP de tratamento de erros.
 *
 * Cenários cobertos:
 *   - Requisição bem-sucedida passa sem modificação
 *   - Erro 0 (sem conexão) → mensagem customizada
 *   - Erro 400 → usa mensagem da API
 *   - Erro 404 → "Recurso não encontrado"
 *   - Erro 409 → mensagem de conflito
 *   - Erro 500 → "Erro interno do servidor"
 */

import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';

import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
      ],
    });

    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
  });

  afterEach(() => ctrl.verify());

  it('cenário 01 — deixa resposta 200 passar sem modificação', () => {
    let resultado: any;
    http.get('/api/test').subscribe((r) => (resultado = r));

    ctrl.expectOne('/api/test').flush({ ok: true });
    expect(resultado).toEqual({ ok: true });
  });

  it('cenário 02 — erro status 0 → mensagem de sem conexão', () => {
    let msg = '';
    http.get('/api/test').subscribe({ error: (e) => (msg = e.message) });

    ctrl.expectOne('/api/test').flush(null, { status: 0, statusText: '' });
    expect(msg).toContain('servidor');
  });

  it('cenário 03 — erro 400 → usa message da resposta da API', () => {
    let msg = '';
    http.get('/api/test').subscribe({ error: (e) => (msg = e.message) });

    ctrl.expectOne('/api/test').flush(
      { message: 'Campo name inválido' },
      { status: 400, statusText: 'Bad Request' },
    );
    expect(msg).toContain('inválido');
  });

  it('cenário 04 — erro 404 → "Recurso não encontrado"', () => {
    let msg = '';
    http.get('/api/test').subscribe({ error: (e) => (msg = e.message) });

    ctrl.expectOne('/api/test').flush(null, { status: 404, statusText: 'Not Found' });
    expect(msg).toContain('não encontrado');
  });

  it('cenário 05 — erro 409 → mensagem de conflito', () => {
    let msg = '';
    http.get('/api/test').subscribe({ error: (e) => (msg = e.message) });

    ctrl.expectOne('/api/test').flush(
      { message: 'E-mail já em uso' },
      { status: 409, statusText: 'Conflict' },
    );
    expect(msg).toContain('já existe');
  });

  it('cenário 06 — erro 500 → "Erro interno do servidor"', () => {
    let msg = '';
    http.get('/api/test').subscribe({ error: (e) => (msg = e.message) });

    ctrl.expectOne('/api/test').flush(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
    expect(msg).toContain('servidor');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * app.component.spec.ts
 * Testa o componente raiz da aplicação.
 */

import { ComponentFixture, TestBed as TB } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from '../../app.component';

describe('AppComponent', () => {
  let fixture:   ComponentFixture<AppComponent>;
  let component: AppComponent;

  beforeEach(async () => {
    await TB.configureTestingModule({
      imports: [AppComponent, RouterTestingModule],
    }).compileComponents();

    fixture   = TB.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('cenário 07 — componente deve ser criado', () => {
    expect(component).toBeTruthy();
  });

  it('cenário 08 — title deve ser "tsmean"', () => {
    expect(component.title).toBe('tsmean');
  });

  it('cenário 09 — header exibe "tsmean" no DOM', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('header')?.textContent).toContain('tsmean');
  });

  it('cenário 10 — contém link de navegação para /users', () => {
    const el: HTMLElement = fixture.nativeElement;
    const links = Array.from(el.querySelectorAll('a'));
    const usersLink = links.find((a) => a.getAttribute('href')?.includes('users'));
    expect(usersLink).toBeTruthy();
  });

  it('cenário 11 — contém router-outlet para renderização de rotas', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('router-outlet')).toBeTruthy();
  });
});
