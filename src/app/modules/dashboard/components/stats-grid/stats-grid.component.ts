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

  faturamentoHoje = 0;
faturamentoOntem = 0;
tendencia: 'up' | 'down' | 'neutral' = 'neutral';
diferenca = 0;

calcular(): void {
  const historico = this.pedidosService.getHistorico();
  const pedidos = this.pedidosService.getPedidos();

  const hoje = new Date().toDateString();
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  const ontemStr = ontem.toDateString();

  const pedidosHoje = historico.filter(p => p.criadoEm && new Date(p.criadoEm).toDateString() === hoje);
  const pedidosOntem = historico.filter(p => p.criadoEm && new Date(p.criadoEm).toDateString() === ontemStr);

  this.faturamentoHoje = pedidosHoje.reduce((a, b) => a + b.total, 0);
  this.faturamentoOntem = pedidosOntem.reduce((a, b) => a + b.total, 0);
  this.diferenca = this.faturamentoHoje - this.faturamentoOntem;
  this.tendencia = this.diferenca > 0 ? 'up' : this.diferenca < 0 ? 'down' : 'neutral';

  this.faturamento = historico.reduce((a, b) => a + b.total, 0);
  this.finalizados = historico.length;
  this.pendentes = pedidos.length;

  const todayStr = new Date().toDateString();
  this.hoje = historico.filter(p => p.criadoEm && new Date(p.criadoEm).toDateString() === todayStr).length;
}

}