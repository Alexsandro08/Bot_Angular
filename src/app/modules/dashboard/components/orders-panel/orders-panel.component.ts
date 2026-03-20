import { Component, OnInit } from '@angular/core';
import { PedidosService, Pedido } from '../../services/pedidos.service';
import { SocketService } from '../../services/socket.service';
import { AuthService } from '../../../auth/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-orders-panel',
  standalone: false,
  templateUrl: './orders-panel.component.html',
  styleUrl: './orders-panel.component.scss',
})
export class OrdersPanelComponent implements OnInit {
  filtro = 'todos';
  pedidos: Pedido[] = [];
  historico: Pedido[] = [];
  private restauranteId: number = 0;

  constructor(
    private pedidosService: PedidosService,
    private socketService: SocketService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.pedidosService.pedidos$.subscribe((p) => (this.pedidos = p));
    this.pedidosService.historico$.subscribe((h) => (this.historico = h));
    this.authService.getMe().subscribe((me: any) => {
      if (me?.id) this.restauranteId = me.id;
    });
  }

  get lista(): Pedido[] {
    if (this.filtro === 'finalizados') return this.historico;
    if (this.filtro === 'aguardando')
      return this.pedidos.filter(
        (p) => p.status === 'pendente' || p.status === 'validacao_pendente',
      );
    if (this.filtro === 'preparo')
      return this.pedidos.filter((p) => p.status === 'preparo');
    return this.pedidos;
  }

  filtrar(filtro: string): void {
    this.filtro = filtro;
  }

  aceitar(p: Pedido): void {
    this.socketService.emit('aceitar_pedido', {
      userId: p.userId,
      numPedido: p.numPedido,
      total: p.total,
      restauranteId: this.restauranteId,
    });
    this.pedidosService.atualizarStatus(
      p.numPedido,
      p.pagamento === 'Pix' ? 'aguardando_pix' : 'preparo',
    );
  }

  recusar(p: Pedido): void {
    this.socketService.emit('recusar_pedido', {
      userId: p.userId,
      numPedido: p.numPedido,
      restauranteId: this.restauranteId,
    });
    this.pedidosService.removerPedido(p.numPedido);
  }

  confirmarPreparo(p: Pedido): void {
    this.socketService.emit('confirmar_preparo', {
      userId: p.userId,
      numPedido: p.numPedido,
      restauranteId: this.restauranteId,
    });
    this.pedidosService.atualizarStatus(p.numPedido, 'preparo');
  }

  entrega(p: Pedido): void {
    this.socketService.emit('saiu_entrega', {
      userId: p.userId,
      numPedido: p.numPedido,
      restauranteId: this.restauranteId,
    });
    this.pedidosService.finalizarPedido(p.numPedido);
  }

  limparPainel(): void {
    Swal.fire({
      title: 'Limpar painel?',
      text: 'Remove todos os pedidos pendentes e em preparo.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, limpar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ff4757',
    }).then((r: any) => {
      if (r.isConfirmed) {
        this.pedidos.forEach((p) =>
          this.pedidosService.removerPedido(p.numPedido),
        );
      }
    });
  }
}
