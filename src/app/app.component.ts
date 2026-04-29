import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'Bot-Whatsapp';

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    const token = this.auth.getToken();
    console.log('[App] Token no sessionStorage:', token ? 'existe' : 'ausente');

    if (!token) {
      console.log('[App] Tentando renovar via cookie...');
      this.auth.refresh().subscribe({
        next: (res) => {
          console.log(
            '[App] Renovação bem sucedida:',
            res.accessToken ? 'token recebido' : 'sem token',
          );
          this.auth.iniciarRefreshAutomatico();
        },
        error: (err) => {
          console.error(
            '[App] Falhou ao renovar via cookie:',
            err.status,
            err.url,
          );
        },
      });
    } else {
      console.log('[App] Token encontrado, iniciando refresh automático');
      this.auth.iniciarRefreshAutomatico();
    }
  }
}
