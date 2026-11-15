import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const snackBar = inject(MatSnackBar);
  const token = auth.token();
  const authed = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;
  return next(authed).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/api/auth/login')) {
        auth.logout();
      }
      if (!req.url.includes('/api/auth/login') && err.status !== 401) {
        const message = err.error?.message || (err.status === 0 ? 'Cannot reach the service. Check your connection.' : `Request failed (${err.status})`);
        snackBar.open(message, 'Dismiss', { duration: 5000 });
      }
      return throwError(() => err);
    })
  );
};
