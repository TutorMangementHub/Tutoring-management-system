import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(AuthService).getToken();
  const isApiRequest = request.url.startsWith(environment.apiUrl);

  if (!token || !isApiRequest) return next(request);

  return next(request.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  }));
};
