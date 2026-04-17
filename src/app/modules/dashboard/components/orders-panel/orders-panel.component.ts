import { Component, OnInit } from '@angular/core';
import { PedidosService, Pedido } from '../../../../services/pedidos.service';
import { SocketService } from '../../../../services/socket.service';
import { AuthService } from '../../../../services/auth.service';
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
  cancelados: Pedido[] = [];
  private restauranteId: string = '';

  constructor(
    private pedidosService: PedidosService,
    private socketService: SocketService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.pedidosService.pedidos$.subscribe((p) => (this.pedidos = p));
    this.pedidosService.historico$.subscribe((h) => {
      this.historico = h.filter((p) => p.status === 'finalizado');
      this.cancelados = h.filter(
        (p) => p.status === 'cancelado' || p.status === 'cancelado_timeout',
      );
    });
    this.authService.getMe().subscribe((me: any) => {
      if (me?.id || me?._id) this.restauranteId = me.id || me._id;
    });
  }

  get countAguardando(): number {
    return this.pedidos.filter(
      (p) =>
        p.status === 'pendente' ||
        p.status === 'aguardando_pix' ||
        p.status === 'validacao_pendente',
    ).length;
  }

  get countPreparo(): number {
    return this.pedidos.filter((p) => p.status === 'preparo').length;
  }

  get lista(): Pedido[] {
    if (this.filtro === 'finalizados') return this.historico;
    if (this.filtro === 'cancelados') return this.cancelados;
    if (this.filtro === 'aguardando')
      return this.pedidos.filter(
        (p) =>
          p.status === 'pendente' ||
          p.status === 'validacao_pendente' ||
          p.status === 'aguardando_pix',
      );
    if (this.filtro === 'preparo')
      return this.pedidos.filter((p) => p.status === 'preparo');
    return [...this.pedidos];
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
    const novoStatus = p.pagamento === 'Pix' ? 'aguardando_pix' : 'preparo';
    this.pedidosService.atualizarStatus(p.numPedido, novoStatus);

    if (p.pagamento === 'Pix') {
      this.pedidosService.iniciarTimeoutPix(p.numPedido); // ← inicia timer 10min
    }
  }

  recusar(p: Pedido): void {
    Swal.fire({
      title: 'Recusar pedido?',
      text: `Pedido #${p.numPedido} de ${p.nome} será cancelado.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, recusar',
      cancelButtonText: 'Voltar',
      confirmButtonColor: '#ff4757',
    }).then((r: any) => {
      if (r.isConfirmed) {
        this.socketService.emit('recusar_pedido', {
          userId: p.userId,
          numPedido: p.numPedido,
          restauranteId: this.restauranteId,
        });
        this.pedidosService.cancelarPedido(p.numPedido, 'cancelado');
      }
    });
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
