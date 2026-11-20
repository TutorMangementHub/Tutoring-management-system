import { Routes } from '@angular/router';
import { authRoutes } from './features/auth/auth.routes';
import { scheduleRoutes } from './features/schedule/schedule.routes';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  ...authRoutes,
  ...scheduleRoutes,
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/pages/dashboard/dashboard').then((m) => m.Dashboard),
  },
  { path: '**', redirectTo: 'login' },
];
