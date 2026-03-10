import { Component, OnInit } from '@angular/core';
import {
  RelatoriosService,
  Relatorio,
  RelatorioPayload,
  ProdutoVendido,
} from '../../services/relatorios.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PedidosService } from '../../services/pedidos.service';

@Component({
  selector: 'app-relatorios',
  standalone: false,
  templateUrl: './relatorios.component.html',
  styleUrl: './relatorios.component.scss',
})
export class RelatoriosComponent implements OnInit {
  relatorios: Relatorio[] = [];
  carregando = true;
  salvando = false;
  jaExisteHoje = false;
  rankingProdutos: ProdutoVendido[] = [];
  totalPedidos = 0;

  filtroInicio = '';
  filtroFim = '';
  relatoriosFiltrados: Relatorio[] = [];
  

  constructor(
    private relatoriosService: RelatoriosService,
    private pedidosService: PedidosService,
  ) {}

  ngOnInit(): void {
    this.carregarRelatorios();
    this.relatoriosFiltrados = this.relatorios;
  }

  filtrar(): void {
  console.log('filtroInicio:', this.filtroInicio);
  console.log('filtroFim:', this.filtroFim);
  
  this.relatoriosFiltrados = this.relatorios.filter(r => {
    const [d, m, a] = r.data.split('/');
    const dataStr = `${a}-${m}-${d}`;
    console.log('dataStr:', dataStr);
    if (this.filtroInicio && dataStr < this.filtroInicio) return false;
    if (this.filtroFim && dataStr > this.filtroFim) return false;
    return true;
  });

  console.log('resultado:', this.relatoriosFiltrados);
}

limparFiltro(): void {
  this.filtroInicio = '';
  this.filtroFim = '';
  this.relatoriosFiltrados = this.relatorios;
}

  carregarRelatorios(): void {
  this.relatoriosService.listar().subscribe({
    next: (data) => {
      this.relatorios = data;
      this.relatoriosFiltrados = data; // ← precisa disso
      const hoje = new Date().toLocaleDateString('pt-BR');
      this.jaExisteHoje = data.some(r => r.data === hoje);
      this.totalPedidos = data.reduce((acc, r) => acc + r.total_pedidos, 0);
      this.rankingProdutos = this.calcularRanking(data);
      this.carregando = false;
    },
    error: () => this.carregando = false
  });
}

  calcularRanking(relatorios: Relatorio[]): ProdutoVendido[] {
    const mapa: Record<string, number> = {};
    relatorios.forEach((r) => {
      r.produtos_mais_vendidos.forEach((p) => {
        mapa[p.nome] = (mapa[p.nome] || 0) + p.quantidade;
      });
    });
    return Object.entries(mapa)
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);
  }
  get faturamentoTotal(): number {
    return this.relatorios.reduce((acc, r) => acc + r.faturamento, 0);
  }

  montarPayload(): RelatorioPayload {
    const historico = this.pedidosService.getHistorico();
    const mapa: Record<string, number> = {};

    historico.forEach((p) => {
      p.carrinho.forEach((item) => {
        const match = item.match(/(\d+)x\s+(.+?)(?:\s+\(R\$|$)/);
        if (match) {
          const nome = match[2]?.trim() ?? '';
          const qtd = parseInt(match[1] ?? '0');
          mapa[nome] = (mapa[nome] || 0) + qtd;
        }
      });
    });

    return {
      faturamento: historico.reduce((acc, p) => acc + p.total, 0),
      total_pedidos: historico.length,
      pix: historico.filter((p) => p.pagamento === 'Pix').length,
      dinheiro: historico.filter((p) => p.pagamento === 'Dinheiro').length,
      cartao: historico.filter((p) => p.pagamento === 'Cartão').length,
      produtos_mais_vendidos: Object.entries(mapa)
        .map(([nome, quantidade]) => ({ nome, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade),
    };
  }

  salvarManual(): void {
    if (this.salvando || this.jaExisteHoje) return;
    this.salvando = true;
    const payload = this.montarPayload();
    this.relatoriosService.salvar(payload).subscribe({
      next: () => {
        this.salvando = false;
        this.carregarRelatorios();
      },
      error: () => (this.salvando = false),
    });
  }

  exportarPDF(): void {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Relatório de Vendas - SuperTech', 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(150);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);

    // Cards resumo
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text(
      `Faturamento Total: R$ ${this.faturamentoTotal.toFixed(2)}`,
      14,
      40,
    );
    doc.text(`Total de Pedidos: ${this.totalPedidos}`, 14, 48);
    doc.text(`Total de Dias: ${this.relatorios.length}`, 14, 56);

    // Tabela histórico
    autoTable(doc, {
      startY: 65,
      head: [['Data', 'Pedidos', 'Faturamento', 'Pix', 'Dinheiro', 'Cartão']],
      body: this.relatoriosFiltrados.map((r) => [
        r.data,
        r.total_pedidos,
        `R$ ${r.faturamento.toFixed(2)}`,
        r.pix,
        r.dinheiro,
        r.cartao,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [79, 140, 255] },
    });

    // Ranking
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(13);
    doc.text('Produtos Mais Vendidos', 14, finalY);

    autoTable(doc, {
      startY: finalY + 6,
      head: [['Posição', 'Produto', 'Quantidade']],
      body: this.rankingProdutos.map((p, i) => [
        `${i + 1}º`,
        p.nome,
        `${p.quantidade}x`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [79, 140, 255] },
    });

    doc.save(
      `relatorio-supertech-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`,
    );
  }
}
