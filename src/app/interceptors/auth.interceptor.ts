import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private refreshing = false;
  private refreshSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    const token = this.auth.getToken();
    const authReq = token ? this.addToken(req, token) : req;

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 && !req.url.includes('/auth/')) {
          return this.handle401(req, next);
        }
        return throwError(() => err);
      }),
    );
  }

  private addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
    return req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  // auth.interceptor.ts
  private handle401(req: HttpRequest<any>, next: HttpHandler) {
    if (this.auth.isRefreshing) {
      return this.auth.refreshSubject.pipe(
        filter((t) => t !== null),
        take(1),
        switchMap((token) => next.handle(this.addToken(req, token!))),
      );
    }

    this.auth.isRefreshing = true;
    this.auth.refreshSubject.next(null);

    return this.auth.refresh().pipe(
      switchMap((res: any) => {
        this.auth.isRefreshing = false;
        this.auth.refreshSubject.next(res.accessToken);
        return next.handle(this.addToken(req, res.accessToken));
      }),
      catchError((err) => {
        this.auth.isRefreshing = false;
        this.auth.logout();
        return throwError(() => err);
      }),
    );
  }
}
