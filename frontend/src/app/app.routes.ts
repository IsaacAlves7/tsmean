import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'users',
    pathMatch: 'full',
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./users/users-list/users-list.component').then(
        (m) => m.UsersListComponent,
      ),
  },
  {
    path: 'users/new',
    loadComponent: () =>
      import('./users/user-form/user-form.component').then(
        (m) => m.UserFormComponent,
      ),
  },
  {
    path: 'users/:id/edit',
    loadComponent: () =>
      import('./users/user-form/user-form.component').then(
        (m) => m.UserFormComponent,
      ),
  },
  {
    path: '**',
    redirectTo: 'users',
  },
];
