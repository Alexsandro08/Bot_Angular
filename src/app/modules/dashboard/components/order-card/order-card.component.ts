import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { Pedido } from '../../../../services/pedidos.service';

declare var Swal: any;

@Component({
  selector: 'app-order-card',
  standalone: false,
  templateUrl: './order-card.component.html',
  styleUrl: './order-card.component.scss',
})
export class OrderCardComponent {
  @Input() pedido!: Pedido;
  @Output() onAceitar = new EventEmitter<Pedido>();
  @Output() onRecusar = new EventEmitter<Pedido>();
  @Output() onConfirmarPreparo = new EventEmitter<Pedido>();
  @Output() onEntrega = new EventEmitter<Pedido>();

  get statusMsg(): string {
    if (this.pedido.atrasado) return 'Pedido Atrasado ⚠️';
    if (this.pedido.status === 'preparo') return 'Em Preparo...';
    if (this.pedido.status === 'validacao_pendente')
      return 'Comprovante Enviado!';
    if (this.pedido.status === 'aguardando_pix') return 'Aguardando Pix...';
    if (this.pedido.status === 'finalizado') return 'Concluído ✅';
    if (this.pedido.status === 'cancelado') return 'Cancelado ❌';
    if (this.pedido.status === 'cancelado_timeout') return 'Expirado ⏱️';
    return 'Aguardando Confirmação...';
  }

  get pgColor(): string {
    if (this.pedido.pagamento === 'Pix') return '#00b894';
    if (this.pedido.pagamento === 'Dinheiro') return '#f1c40f';
    return '#4f8cff';
  }

  get thumbUrl(): string {
    if (!this.pedido.comprovante) return '';
    return this.pedido.comprovante.startsWith('data:')
      ? this.pedido.comprovante
      : `data:image/jpeg;base64,${this.pedido.comprovante}`;
  }

  get iniciais(): string {
    if (!this.pedido.nome) return '?';
    return this.pedido.nome
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');
  }

  get corAvatar(): string {
    const cores = [
      '#4f8cff',
      '#2ecc71',
      '#e74c3c',
      '#f39c12',
      '#9b59b6',
      '#1abc9c',
    ];
    const idx = this.pedido.nome?.charCodeAt(0) % cores.length || 0;
    return cores[idx];
  }

  verComprovante(): void {
    if (!this.pedido.comprovante) return;
    Swal.fire({
      title: 'Comprovante Recebido',
      imageUrl: this.thumbUrl,
      imageWidth: 400,
      showCancelButton: true,
      confirmButtonText: 'Confirmar Pagamento',
      cancelButtonText: 'Fechar',
      confirmButtonColor: '#2ecc71',
    }).then((r: any) => {
      if (r.isConfirmed) this.onConfirmarPreparo.emit(this.pedido);
    });
  }
}
