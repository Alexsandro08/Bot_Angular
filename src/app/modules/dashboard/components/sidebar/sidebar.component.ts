import { Component, OnInit } from '@angular/core';
import { PedidosService } from '../../services/pedidos.service';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  percPix = 0;
  percDinheiro = 0;
  percCartao = 0;
  maiorLabel = '';
  maiorPerc = 0;
  gradiente = 'conic-gradient(#363b4a 0% 100%)';

  constructor(private pedidosService: PedidosService) {}

  ngOnInit(): void {
    this.pedidosService.historico$.subscribe(() => this.calcular());
  }

  calcular(): void {
  const historico = this.pedidosService.getHistorico();
  const total = historico.length;


  const pix = historico.filter(p => p.pagamento === 'Pix').length;
  const dinheiro = historico.filter(p => p.pagamento === 'Dinheiro').length;
  const cartao = historico.filter(p => p.pagamento === 'Cartão').length;

  this.percPix = Math.round((pix / total) * 100);
  this.percDinheiro = Math.round((dinheiro / total) * 100);
  this.percCartao = 100 - this.percPix - this.percDinheiro;

  const p1 = this.percPix;
  const p2 = p1 + this.percDinheiro;

  this.gradiente = `conic-gradient(#4ab0a7 0% ${p1}%, #f1c40f ${p1}% ${p2}%, #a29bfe ${p2}% 100%)`;
}

  get ticketMedio(): string {
  const historico = this.pedidosService.getHistorico();
  if (!historico.length) return 'R$ 0,00';
  const total = historico.reduce((a, b) => a + b.total, 0);
  return `R$ ${(total / historico.length).toFixed(2).replace('.', ',')}`;
}
}
