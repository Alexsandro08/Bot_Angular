import { Component, OnInit } from '@angular/core';
import { PedidosService } from '../../services/pedidos.service';

@Component({
  selector: 'app-stats-grid',
  standalone: false,
  templateUrl: './stats-grid.component.html',
  styleUrl: './stats-grid.component.scss'
})
export class StatsGridComponent implements OnInit {
  faturamento = 0;
  pendentes = 0;
  finalizados = 0;
  hoje = 0;

  constructor(private pedidosService: PedidosService) {}

  ngOnInit(): void {
    this.pedidosService.pedidos$.subscribe(() => this.calcular());
    this.pedidosService.historico$.subscribe(() => this.calcular());
  }

  calcular(): void {
  const historico = this.pedidosService.getHistorico();
  const pedidos = this.pedidosService.getPedidos();
  
  this.faturamento = historico.reduce((a, b) => a + b.total, 0);
  this.finalizados = historico.length;
  this.pendentes = pedidos.length;

  const hoje = new Date().toDateString();
  this.hoje = historico.filter(p => {
    if (!p.criadoEm) return false;
    return new Date(p.criadoEm).toDateString() === hoje;
  }).length;
}
}