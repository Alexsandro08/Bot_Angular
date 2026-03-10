import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError(err => {
        // Deixa o componente tratar — só redireciona se não tiver na dashboard
        if (err.status === 401 && !this.router.url.includes('/dashboard')) {
          sessionStorage.removeItem('logado');
          this.router.navigate(['/login']);
        }
        return throwError(() => err);
      })
    );
  }
}