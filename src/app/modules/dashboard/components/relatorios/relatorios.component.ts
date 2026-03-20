import { Component, OnInit } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  RelatoriosService,
  Relatorio,
  RelatorioPayload,
  ProdutoVendido,
} from '../../services/relatorios.service';
import { PedidosService } from '../../services/pedidos.service';
import { AuthService } from '../../../auth/auth.service';
import { HttpClient } from '@angular/common/http';

// ============================================================
// CONSTANTES
// ============================================================
const COR_HEADER_PDF: [number, number, number] = [79, 140, 255];

@Component({
  selector: 'app-relatorios',
  standalone: false,
  templateUrl: './relatorios.component.html',
  styleUrl: './relatorios.component.scss',
})
export class RelatoriosComponent implements OnInit {
  // ============================================================
  // ESTADO
  // ============================================================
  relatorios: Relatorio[] = [];
  relatoriosFiltrados: Relatorio[] = [];
  rankingProdutos: ProdutoVendido[] = [];

  carregando = true;
  salvando = false;
  jaExisteHoje = false;
  totalPedidos = 0;
  nomeRestaurante = '';
  logoUrl: string | null = null;

  filtroInicio = '';
  filtroFim = '';

  constructor(
    private relatoriosService: RelatoriosService,
    private pedidosService: PedidosService,
    private authService: AuthService,
    private http: HttpClient,
  ) {}

  // ============================================================
  // LIFECYCLE
  // ============================================================
  ngOnInit(): void {
    this.carregarRelatorios();
    this.authService.getMe().subscribe((res: any) => {
      this.nomeRestaurante = res?.nome || 'SuperTech';
    });
    this.http.get<{ url: string | null }>('/api/logo').subscribe((res) => {
      this.logoUrl = res.url;
    });
  }

  // ============================================================
  // RELATÓRIOS
  // ============================================================
  carregarRelatorios(): void {
    this.relatoriosService.listar().subscribe({
      next: (data) => {
        this.relatorios = data;
        this.relatoriosFiltrados = data;
        this.jaExisteHoje = data.some(
          (r) => r.data === new Date().toLocaleDateString('pt-BR'),
        );
        this.totalPedidos = data.reduce((acc, r) => acc + r.total_pedidos, 0);
        this.rankingProdutos = this.calcularRanking(data);
        this.carregando = false;
      },
      error: () => (this.carregando = false),
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

  // ============================================================
  // FILTROS
  // ============================================================
  filtrar(): void {
    this.relatoriosFiltrados = this.relatorios.filter((r) => {
      const [d, m, a] = r.data.split('/');
      const dataStr = `${a}-${m}-${d}`;
      if (this.filtroInicio && dataStr < this.filtroInicio) return false;
      if (this.filtroFim && dataStr > this.filtroFim) return false;
      return true;
    });
  }

  limparFiltro(): void {
    this.filtroInicio = '';
    this.filtroFim = '';
    this.relatoriosFiltrados = this.relatorios;
  }

  // ============================================================
  // SALVAR
  // ============================================================
  private montarPayload(): RelatorioPayload {
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
    this.relatoriosService.salvar(this.montarPayload()).subscribe({
      next: () => { this.salvando = false; this.carregarRelatorios(); },
      error: () => (this.salvando = false),
    });
  }

  // ============================================================
  // EXPORTAR PDF
  // ============================================================
  exportarPDF(): void {
    const doc = new jsPDF();
    const dataHoje = new Date().toLocaleDateString('pt-BR');
    let cursorY = 20;

    // logo
    if (this.logoUrl) {
      doc.addImage(this.logoUrl, 'PNG', 14, cursorY, 20, 20);
      cursorY += 2;
    }

    // cabeçalho
    const tituloX = this.logoUrl ? 38 : 14;
    doc.setFontSize(18);
    doc.setTextColor(0);
    doc.text(`Relatório de Vendas`, tituloX, cursorY + 6);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(this.nomeRestaurante, tituloX, cursorY + 14);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${dataHoje}`, tituloX, cursorY + 20);

    cursorY += 36;

    // resumo
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text(`Faturamento Total: R$ ${this.faturamentoTotal.toFixed(2)}`, 14, cursorY);
    doc.text(`Total de Pedidos: ${this.totalPedidos}`, 14, cursorY + 8);
    doc.text(`Total de Dias: ${this.relatorios.length}`, 14, cursorY + 16);

    cursorY += 26;

    // tabela histórico
    autoTable(doc, {
      startY: cursorY,
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
      headStyles: { fillColor: COR_HEADER_PDF },
    });

    // ranking
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(13);
    doc.setTextColor(0);
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
      headStyles: { fillColor: COR_HEADER_PDF },
    });

    // salva
    const nomeArquivo = this.nomeRestaurante.toLowerCase().replace(/\s+/g, '-');
    doc.save(`relatorio-${nomeArquivo}-${dataHoje.replace(/\//g, '-')}.pdf`);
  }
}