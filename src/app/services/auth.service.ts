import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, BehaviorSubject, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:3000';
  private refreshTimer: any;

  // auth.service.ts
  isRefreshing = false;
  refreshSubject = new BehaviorSubject<string | null>(null);
  tokenRenovado$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  iniciarRefreshAutomatico(): void {
    const token = this.getToken();
    if (!token) {
      console.log('[Refresh] Sem token, abortando');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expMs = payload.exp * 1000;
      const agora = Date.now();
      const tempoRestante = expMs - agora;
      const renovarEm = tempoRestante - 60 * 1000;

      console.log(
        '[Refresh] Token expira em:',
        new Date(expMs).toLocaleTimeString(),
      );
      console.log(
        '[Refresh] Renovar em:',
        Math.round(renovarEm / 1000),
        'segundos',
      );

      if (renovarEm <= 0) {
        console.log('[Refresh] Token já expirado ou próximo, renovando agora');
        this.refresh().subscribe();
        return;
      }

      clearTimeout(this.refreshTimer);
      this.refreshTimer = setTimeout(() => {
        if (this.isRefreshing) return; // ✅ evita conflito com o interceptor

        console.log('[Refresh] Executando refresh automático...');
        this.refresh()
          .pipe(tap(() => this.iniciarRefreshAutomatico()))
          .subscribe({ error: () => this.logout() });
      }, renovarEm);
    } catch (err) {
      console.error('[Refresh] Erro ao parsear token:', err);
      this.logout();
    }
  }

  login(login: string, senha: string): Observable<any> {
    return this.http
      .post(
        `${this.apiUrl}/auth/login`,
        { login, senha },
        { withCredentials: true },
      )
      .pipe(
        tap((res: any) => {
          if (res.ok) {
            sessionStorage.setItem('accessToken', res.accessToken);
            this.iniciarRefreshAutomatico(); // ← adiciona
          }
        }),
      );
  }

  refresh(): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/auth/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((res: any) => {
          console.log('[refresh] resposta:', res);
          if (res.accessToken) {
            sessionStorage.setItem('accessToken', res.accessToken);
            console.log('[refresh] emitindo tokenRenovado$'); // ← adiciona
            this.tokenRenovado$.next(); // ✅ notifica
          }
        }),
      );
  }

  logout(): void {
    this.http
      .post(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .subscribe();
    sessionStorage.removeItem('accessToken');
    this.router.navigate(['/login']);
  }

  getMe(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/me`, { withCredentials: true });
  }

  getToken(): string | null {
    return sessionStorage.getItem('accessToken');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
