import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth';
import { adminGuard } from './core/guards/admin';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then((m) => m.Register),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'upload',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/upload/upload').then((m) => m.Upload),
  },
  {
    path: 'editor/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/editor/editor').then((m) => m.Editor),
  },
  {
    path: 'admin/colors',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin-colors/admin-colors').then((m) => m.AdminColors),
  },
  {
    path: 'admin/users',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin-users/admin-users').then((m) => m.AdminUsers),
  },
  { path: '**', redirectTo: 'dashboard' },
];