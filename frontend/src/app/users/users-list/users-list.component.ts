import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UsersService } from '../users.service';
import { User } from '../user.model';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <h1 class="page-title">Usuários</h1>
      <a routerLink="/users/new" class="btn btn--primary">+ Novo Usuário</a>
    </div>

    @if (loading()) {
      <div class="loading">Carregando...</div>
    }

    @if (error()) {
      <div class="alert alert--error">{{ error() }}</div>
    }

    @if (!loading() && users().length === 0 && !error()) {
      <div class="empty-state">
        <p>Nenhum usuário cadastrado ainda.</p>
        <a routerLink="/users/new" class="btn btn--primary">Criar primeiro usuário</a>
      </div>
    }

    @if (users().length > 0) {
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Status</th>
              <th>Criado em</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            @for (user of users(); track user.id) {
              <tr>
                <td class="td--muted">{{ user.id }}</td>
                <td><strong>{{ user.name }}</strong></td>
                <td>{{ user.email }}</td>
                <td>
                  <span class="badge" [class.badge--active]="user.isActive" [class.badge--inactive]="!user.isActive">
                    {{ user.isActive ? 'Ativo' : 'Inativo' }}
                  </span>
                </td>
                <td class="td--muted">{{ user.createdAt | date:'dd/MM/yyyy' }}</td>
                <td class="td--actions">
                  <a [routerLink]="['/users', user.id, 'edit']" class="btn btn--sm btn--outline">Editar</a>
                  <button (click)="delete(user)" class="btn btn--sm btn--danger">Excluir</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
    .page-title  { font-size: 1.5rem; font-weight: 700; color: #1a1a2e; margin: 0; }

    .table-wrapper { background: #fff; border-radius: 10px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); overflow: hidden; }
    .table { width: 100%; border-collapse: collapse; }
    .table th { background: #1a1a2e; color: #fff; padding: 0.9rem 1rem; text-align: left; font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .table td { padding: 0.9rem 1rem; border-bottom: 1px solid #f0f0f5; }
    .table tr:last-child td { border-bottom: none; }
    .table tr:hover td { background: #fafbff; }

    .td--muted   { color: #888; font-size: 0.9rem; }
    .td--actions { display: flex; gap: 0.5rem; }

    .badge { padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.78rem; font-weight: 600; }
    .badge--active   { background: #d4edda; color: #155724; }
    .badge--inactive { background: #f8d7da; color: #721c24; }

    .btn { display: inline-flex; align-items: center; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.9rem; font-weight: 600; cursor: pointer; text-decoration: none; border: none; transition: all 0.2s; }
    .btn--primary { background: #f5a623; color: #fff; }
    .btn--primary:hover { background: #e0941a; }
    .btn--outline { background: transparent; border: 1.5px solid #1a1a2e; color: #1a1a2e; }
    .btn--outline:hover { background: #1a1a2e; color: #fff; }
    .btn--danger  { background: #e74c3c; color: #fff; }
    .btn--danger:hover { background: #c0392b; }
    .btn--sm { padding: 0.3rem 0.75rem; font-size: 0.82rem; }

    .loading { text-align: center; padding: 3rem; color: #888; }
    .empty-state { text-align: center; padding: 4rem 2rem; color: #888; }
    .empty-state p { margin-bottom: 1rem; }

    .alert { padding: 1rem; border-radius: 6px; margin-bottom: 1rem; }
    .alert--error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
  `],
})
export class UsersListComponent implements OnInit {
  private readonly usersService = inject(UsersService);

  users   = signal<User[]>([]);
  loading = signal(false);
  error   = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.usersService.getAll().subscribe({
      next: (data) => { this.users.set(data); this.loading.set(false); },
      error: (err) => {
        this.error.set(err.message ?? 'Erro ao carregar usuários');
        this.loading.set(false);
      },
    });
  }

  delete(user: User): void {
    if (!confirm(`Deseja excluir "${user.name}"?`)) return;

    this.usersService.remove(user.id).subscribe({
      next: () => this.users.update((list) => list.filter((u) => u.id !== user.id)),
      error: () => alert('Erro ao excluir usuário'),
    });
  }
}
