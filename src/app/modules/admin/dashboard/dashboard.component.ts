import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Stats {
  total: number;
  ativos: number;
  expirados: number;
  ilimitados: number;
  expirando: number;
}

interface Restaurante {
  _id: string;
  nome: string;
  expira_em?: string;
  criado_em: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  stats: Stats = { total: 0, ativos: 0, expirados: 0, ilimitados: 0, expirando: 0 };
  recentes: Restaurante[] = [];
  today = new Date();
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http
      .get<Restaurante[]>(`${this.apiUrl}/admin/restaurantes`)
      .subscribe({
        next: (data) => {
          this.stats.total = data.length;
          this.stats.ilimitados = data.filter((r) => !r.expira_em).length;
          this.stats.expirados = data.filter(
            (r) => r.expira_em && new Date(r.expira_em) < new Date(),
          ).length;
          this.stats.ativos = data.filter(
            (r) => r.expira_em && new Date(r.expira_em) >= new Date(),
          ).length;
          this.recentes = data.slice(0, 5);
          this.stats.expirando = data.filter((r) => {
            if (!r.expira_em) return false;
            const dias = Math.ceil(
              (new Date(r.expira_em).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24),
            );
            return dias > 0 && dias <= 7;
          }).length;
        },
      });
  }
  getStatus(expira_em?: string): string {
    if (!expira_em) return 'ilimitado';
    return new Date(expira_em) < new Date() ? 'expirado' : 'ativo';
  }

  getStatusLabel(expira_em?: string): string {
    if (!expira_em) return 'Ilimitado';
    return new Date(expira_em) < new Date() ? 'Expirado' : 'Ativo';
  }
}
