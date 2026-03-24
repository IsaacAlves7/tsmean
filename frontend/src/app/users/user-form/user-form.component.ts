import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { UsersService } from '../users.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="form-page">
      <div class="form-card">
        <div class="form-card__header">
          <h2 class="form-card__title">{{ isEdit() ? 'Editar Usuário' : 'Novo Usuário' }}</h2>
          <a routerLink="/users" class="btn btn--ghost">← Voltar</a>
        </div>

        @if (error()) {
          <div class="alert alert--error">{{ error() }}</div>
        }

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-group">
            <label class="form-label" for="name">Nome completo</label>
            <input id="name" formControlName="name" class="form-input"
                   [class.form-input--error]="isInvalid('name')"
                   placeholder="Ex: Maria Silva" />
            @if (isInvalid('name')) {
              <span class="form-hint form-hint--error">Nome é obrigatório</span>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="email">E-mail</label>
            <input id="email" formControlName="email" type="email" class="form-input"
                   [class.form-input--error]="isInvalid('email')"
                   placeholder="Ex: maria@email.com" />
            @if (isInvalid('email')) {
              <span class="form-hint form-hint--error">Informe um e-mail válido</span>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="password">
              Senha {{ isEdit() ? '(deixe em branco para manter)' : '' }}
            </label>
            <input id="password" formControlName="password" type="password" class="form-input"
                   [class.form-input--error]="isInvalid('password')"
                   placeholder="Mínimo 8 caracteres" />
            @if (isInvalid('password')) {
              <span class="form-hint form-hint--error">Senha deve ter no mínimo 8 caracteres</span>
            }
          </div>

          @if (isEdit()) {
            <div class="form-group form-group--inline">
              <label class="form-label">Status</label>
              <label class="toggle">
                <input type="checkbox" formControlName="isActive" />
                <span class="toggle__slider"></span>
                <span class="toggle__label">{{ form.value.isActive ? 'Ativo' : 'Inativo' }}</span>
              </label>
            </div>
          }

          <div class="form-actions">
            <a routerLink="/users" class="btn btn--outline">Cancelar</a>
            <button type="submit" class="btn btn--primary" [disabled]="loading()">
              {{ loading() ? 'Salvando...' : (isEdit() ? 'Salvar alterações' : 'Criar usuário') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-page  { display: flex; justify-content: center; padding-top: 1rem; }
    .form-card  { background: #fff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 2rem; width: 100%; max-width: 520px; }

    .form-card__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
    .form-card__title  { font-size: 1.3rem; font-weight: 700; color: #1a1a2e; margin: 0; }

    .form-group { margin-bottom: 1.2rem; }
    .form-group--inline { display: flex; align-items: center; gap: 1rem; }
    .form-label { display: block; font-size: 0.875rem; font-weight: 600; color: #444; margin-bottom: 0.4rem; }

    .form-input {
      width: 100%; padding: 0.6rem 0.9rem; border: 1.5px solid #d0d5dd;
      border-radius: 6px; font-size: 0.95rem; transition: border-color 0.2s; box-sizing: border-box;
    }
    .form-input:focus { outline: none; border-color: #f5a623; box-shadow: 0 0 0 3px rgba(245,166,35,0.15); }
    .form-input--error { border-color: #e74c3c; }

    .form-hint { font-size: 0.8rem; }
    .form-hint--error { color: #e74c3c; }

    .toggle { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
    .toggle input { display: none; }
    .toggle__slider {
      width: 42px; height: 24px; background: #ccc; border-radius: 999px;
      position: relative; transition: background 0.2s;
    }
    .toggle__slider::after {
      content: ''; position: absolute; top: 3px; left: 3px;
      width: 18px; height: 18px; background: #fff; border-radius: 50%; transition: left 0.2s;
    }
    .toggle input:checked + .toggle__slider { background: #f5a623; }
    .toggle input:checked + .toggle__slider::after { left: 21px; }
    .toggle__label { font-size: 0.9rem; color: #555; }

    .form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem; }

    .btn { display: inline-flex; align-items: center; padding: 0.55rem 1.2rem; border-radius: 6px; font-size: 0.9rem; font-weight: 600; cursor: pointer; text-decoration: none; border: none; transition: all 0.2s; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn--primary { background: #f5a623; color: #fff; }
    .btn--primary:hover:not(:disabled) { background: #e0941a; }
    .btn--outline { background: transparent; border: 1.5px solid #1a1a2e; color: #1a1a2e; }
    .btn--outline:hover { background: #1a1a2e; color: #fff; }
    .btn--ghost  { background: transparent; color: #888; }
    .btn--ghost:hover { color: #333; }

    .alert { padding: 0.8rem 1rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.9rem; }
    .alert--error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
  `],
})
export class UserFormComponent implements OnInit {
  private readonly fb      = inject(FormBuilder);
  private readonly service = inject(UsersService);
  private readonly router  = inject(Router);
  private readonly route   = inject(ActivatedRoute);

  isEdit  = signal(false);
  loading = signal(false);
  error   = signal<string | null>(null);
  userId  = signal<number | null>(null);

  form = this.fb.group({
    name:     ['', [Validators.required, Validators.maxLength(100)]],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(8)]],
    isActive: [true],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.userId.set(Number(id));
      this.form.get('password')?.clearValidators();
      this.loadUser(Number(id));
    } else {
      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    }
    this.form.get('password')?.updateValueAndValidity();
  }

  loadUser(id: number): void {
    this.service.getById(id).subscribe({
      next: (user) => {
        this.form.patchValue({ name: user.name, email: user.email, isActive: user.isActive });
      },
      error: () => this.error.set('Usuário não encontrado'),
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!ctrl && ctrl.invalid && ctrl.touched;
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set(null);

    const value = this.form.getRawValue();

    const obs = this.isEdit()
      ? this.service.update(this.userId()!, {
          name:     value.name ?? undefined,
          email:    value.email ?? undefined,
          password: value.password || undefined,
          isActive: value.isActive ?? undefined,
        })
      : this.service.create({
          name:     value.name!,
          email:    value.email!,
          password: value.password!,
        });

    obs.subscribe({
      next: () => this.router.navigate(['/users']),
      error: (err) => {
        this.error.set(err.error?.message ?? 'Ocorreu um erro ao salvar');
        this.loading.set(false);
      },
    });
  }
}
