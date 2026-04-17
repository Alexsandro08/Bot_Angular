import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:3000';

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(login: string, senha: string): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/auth/login`, { login, senha }, { withCredentials: true })
      .pipe(
        tap((res: any) => {
          if (res.ok) {
            sessionStorage.setItem('accessToken', res.accessToken);
          }
        }),
      );
  }

  refresh(): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/auth/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((res: any) => {
          if (res.accessToken) {
            sessionStorage.setItem('accessToken', res.accessToken);
          }
        }),
      );
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true }).subscribe();
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