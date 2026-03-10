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
      .post(
        `${this.apiUrl}/auth/login`,
        { login, senha },
        { withCredentials: true },
      )
      .pipe(
        tap((res: any) => {
          if (res.ok) {
            sessionStorage.setItem('logado', 'true');
          }
        }),
      );
  }

  logout(): void {
    sessionStorage.removeItem('logado');
    this.router.navigate(['/login']);
  }

  getMe(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/me`, { withCredentials: true });
  }

  isLoggedIn(): boolean {
    return sessionStorage.getItem('logado') === 'true';
  }
}
