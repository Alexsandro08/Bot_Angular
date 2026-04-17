import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Restaurante {
  _id: string;
  nome: string;
  login: string;
  whatsapp: string;
  expira_em?: string;
  criado_em: string;
}

@Component({
  selector: 'app-admin',
  standalone: false,
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  restaurantes: Restaurante[] = [];
  carregando = true;
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<Restaurante[]>(`${this.apiUrl}/admin/restaurantes`).subscribe({
      next: (data) => {
        this.restaurantes = data;
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
      },
    });
  }

  diasRestantes(expira_em?: string): number | null {
    if (!expira_em) return null;
    const diff = new Date(expira_em).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  statusAssinatura(expira_em?: string): 'ativo' | 'expirando' | 'expirado' | 'ilimitado' {
    if (!expira_em) return 'ilimitado';
    const dias = this.diasRestantes(expira_em)!;
    if (dias <= 0) return 'expirado';
    if (dias <= 5) return 'expirando';
    return 'ativo';
  }
}