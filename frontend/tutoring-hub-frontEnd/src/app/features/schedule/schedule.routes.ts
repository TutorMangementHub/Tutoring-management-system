import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const scheduleRoutes: Routes = [
  {
    path: 'schedule',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/schedule/schedule').then((m) => m.Schedule),
  },
];
