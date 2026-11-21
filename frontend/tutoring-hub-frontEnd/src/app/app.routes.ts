import { Routes } from '@angular/router';
import { authRoutes } from './features/auth/auth.routes';
import { scheduleRoutes } from './features/schedule/schedule.routes';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/pages/home/home').then((m) => m.Home),
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/pages/home/home').then((m) => m.Home),
  },
  ...authRoutes,
  ...scheduleRoutes,
  { path: 'dashboard', redirectTo: '' },
  { path: '**', redirectTo: 'login' },
];
