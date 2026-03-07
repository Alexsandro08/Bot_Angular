import { Component, OnInit, OnDestroy } from '@angular/core';
import { SocketService } from './services/socket.service';
import { PedidosService } from './services/pedidos.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  paginaAtual = 'dashboard';
  private subs: Subscription[] = [];

  constructor(
    private socketService: SocketService,
    private pedidosService: PedidosService
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.socketService.on('novo_pedido').subscribe(p => {
        this.pedidosService.adicionarPedido(p);
      }),
      this.socketService.on('novo_comprovante').subscribe(d => {
        this.pedidosService.adicionarComprovante(d.numPedido, d.imagem);
      })
    );
  }

  trocarPagina(pagina: string): void {
    this.paginaAtual = pagina;
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}