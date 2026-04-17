import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Restaurante {
  _id: string;
  nome: string;
  login: string;
  senha?: string;
  whatsapp?: string;
  chave_pix?: string;
  tipo_cozinha?: string;
  expira_em?: string;
  criado_em: string;
}

@Component({
  selector: 'app-restaurantes',
  standalone: false,
  templateUrl: './restaurantes.component.html',
  styleUrls: ['./restaurantes.component.scss'],
})
export class RestaurantesComponent implements OnInit {
  restaurantes: Restaurante[] = [];
  filtrados: Restaurante[] = [];
  busca = '';
  carregando = true;
  modalAberto = false;
  editando = false;
  form: Partial<Restaurante> = {};
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    this.http
      .get<Restaurante[]>(`${this.apiUrl}/admin/restaurantes`)
      .subscribe({
        next: (data) => {
          this.restaurantes = data;
          this.filtrar();
          this.carregando = false;
        },
      });
  }

  filtrar(): void {
    const termo = this.busca.toLowerCase();
    this.filtrados = this.restaurantes.filter(
      (r) =>
        r.nome.toLowerCase().includes(termo) ||
        r.login.toLowerCase().includes(termo),
    );
  }

  abrirCadastro(): void {
    this.form = {};
    this.editando = false;
    this.modalAberto = true;
  }

  abrirEdicao(r: Restaurante): void {
    this.form = { ...r };
    this.editando = true;
    this.modalAberto = true;
  }

  fecharModal(): void {
    this.modalAberto = false;
    this.form = {};
  }

  salvar(): void {
    if (this.editando) {
      this.http
        .put(`${this.apiUrl}/admin/restaurante/${this.form._id}`, this.form)
        .subscribe({
          next: () => {
            this.fecharModal();
            this.carregar();
          },
        });
    } else {
      this.http.post(`${this.apiUrl}/admin/restaurante`, this.form).subscribe({
        next: () => {
          this.fecharModal();
          this.carregar();
        },
      });
    }
  }

  renovar(id: string): void {
    (window as any).Swal.fire({
      title: 'Renovar assinatura?',
      text: 'Adiciona 30 dias ao plano atual.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Renovar',
      cancelButtonText: 'Cancelar',
      background: '#16161f',
      color: '#e8e8f0',
      confirmButtonColor: '#34d399',
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.http.post(`${this.apiUrl}/admin/renovar/${id}`, {}).subscribe({
          next: () => {
            (window as any).Swal.fire({
              title: 'Renovado!',
              icon: 'success',
              background: '#16161f',
              color: '#e8e8f0',
            });
            this.carregar();
          },
        });
      }
    });
  }

  ilimitado(id: string): void {
    (window as any).Swal.fire({
      title: 'Tornar ilimitado?',
      text: 'O restaurante terá acesso sem prazo de expiração.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#16161f',
      color: '#e8e8f0',
      confirmButtonColor: '#a78bfa',
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.http.post(`${this.apiUrl}/admin/ilimitado/${id}`, {}).subscribe({
          next: () => {
            (window as any).Swal.fire({
              title: 'Plano ilimitado!',
              icon: 'success',
              background: '#16161f',
              color: '#e8e8f0',
            });
            this.carregar();
          },
        });
      }
    });
  }

  bloquear(id: string): void {
    (window as any).Swal.fire({
      title: 'Cancelar plano?',
      text: 'O restaurante perderá acesso imediatamente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Cancelar plano',
      cancelButtonText: 'Voltar',
      background: '#16161f',
      color: '#e8e8f0',
      confirmButtonColor: '#f87171',
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.http.post(`${this.apiUrl}/admin/bloquear/${id}`, {}).subscribe({
          next: () => {
            (window as any).Swal.fire({
              title: 'Plano cancelado!',
              icon: 'success',
              background: '#16161f',
              color: '#e8e8f0',
            });
            this.carregar();
          },
        });
      }
    });
  }

  reembolso(id: string, nome: string): void {
    (window as any).Swal.fire({
      title: `Reembolso - ${nome}`,
      html: `
      <input id="swal-valor" class="swal2-input" placeholder="Valor (R$)" type="number" />
      <input id="swal-motivo" class="swal2-input" placeholder="Motivo" />
    `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Confirmar reembolso',
      cancelButtonText: 'Cancelar',
      background: '#16161f',
      color: '#e8e8f0',
      confirmButtonColor: '#a78bfa',
      preConfirm: () => {
        const valor = (
          document.getElementById('swal-valor') as HTMLInputElement
        ).value;
        const motivo = (
          document.getElementById('swal-motivo') as HTMLInputElement
        ).value;
        if (!valor || !motivo) {
          (window as any).Swal.showValidationMessage(
            'Preencha todos os campos',
          );
          return false;
        }
        return { valor, motivo };
      },
    }).then((result: any) => {
      if (result.isConfirmed) {
        // mock — futuramente integra com API de pagamento
        (window as any).Swal.fire({
          title: 'Reembolso registrado!',
          text: `R$ ${result.value.valor} - ${result.value.motivo}`,
          icon: 'success',
          background: '#16161f',
          color: '#e8e8f0',
        });
      }
    });
  }

  diasRestantes(expira_em?: string): number | null {
    if (!expira_em) return null;
    return Math.ceil(
      (new Date(expira_em).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
  }

  getStatus(expira_em?: string): string {
    if (!expira_em) return 'ilimitado';
    const dias = this.diasRestantes(expira_em)!;
    if (dias <= 0) return 'expirado';
    if (dias <= 7) return 'expirando';
    return 'ativo';
  }

  getStatusLabel(expira_em?: string): string {
    if (!expira_em) return 'Ilimitado';
    const dias = this.diasRestantes(expira_em)!;
    if (dias <= 0) return 'Expirado';
    if (dias <= 7) return `${dias}d`;
    return 'Ativo';
  }
}
