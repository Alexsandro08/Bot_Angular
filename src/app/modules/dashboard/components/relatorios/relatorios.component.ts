import {
  ChangeDetectorRef,
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  RelatoriosService,
  Relatorio,
  RelatorioPayload,
  ProdutoVendido,
} from '../../../../services/relatorios.service';
import { PedidosService } from '../../../../services/pedidos.service';
import { AuthService } from '../../../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

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
  modoGrafico = 'recentes';
  logoUrl: string | null = null;

  filtroInicio = '';
  filtroFim = '';

  abaAtiva: 'historico' | 'comprovantes' | 'graficos' = 'historico';
  comprovantes: any[] = [];
  carregandoComp = false;
  filtroCompInicio = '';
  filtroCompFim = '';
  filtroGraficoMes = '';
  searchComp: string = '';
  comprovantesFiltrados: any[] = [];

  constructor(
    private relatoriosService: RelatoriosService,
    private pedidosService: PedidosService,
    private authService: AuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  // ============================================================
  // LIFECYCLE
  // ============================================================
  @ViewChild('chartFaturamento', { read: ElementRef })
  chartFaturamento!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartPagamentos', { read: ElementRef })
  chartPagamentos!: ElementRef<HTMLCanvasElement>;

  private chartFatInstance: any = null;
  private chartPagInstance: any = null;

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
  // FINANCEIRO
  // ============================================================

  // renderGraficos(): void {
  //   const Chart = (window as any).Chart;
  //   const { dias, vendas } = this.pedidosFiltrados;

  //   if (!Chart) return;

  //   this.cdr.detectChanges();

  //   setTimeout(() => {
  //     if (!this.chartFaturamento || !this.chartPagamentos) return;

  //     if (this.chartFatInstance) this.chartFatInstance.destroy();
  //     if (this.chartPagInstance) this.chartPagInstance.destroy();

  //     // agrupa faturamento por mês
  //     const porMes: Record<string, number> = {};
  //     this.relatorios.forEach((r) => {
  //       const mes = r.data?.slice(3);
  //       porMes[mes] = (porMes[mes] || 0) + r.faturamento;
  //     });
  //     const meses = Object.keys(porMes).slice(-7);
  //     const fatData = meses.map((m) => porMes[m]);

  //     this.chartFatInstance = new Chart(this.chartFaturamento.nativeElement, {
  //       type: 'line',
  //       data: {
  //         labels: meses,
  //         datasets: [
  //           {
  //             label: 'Faturamento (R$)',
  //             data: fatData,
  //             borderColor: '#4f8cff',
  //             backgroundColor: 'rgba(79,140,255,0.1)',
  //             borderWidth: 2,
  //             tension: 0.4,
  //             fill: true,
  //             pointRadius: 4,
  //             pointHoverRadius: 6,
  //           },
  //         ],
  //       },
  //       options: {
  //         responsive: true,
  //         plugins: { legend: { display: false } },
  //         scales: {
  //           x: {
  //             grid: { color: 'rgba(255,255,255,0.05)' },
  //             ticks: { color: 'rgba(255,255,255,0.4)' },
  //           },
  //           y: {
  //             grid: { color: 'rgba(255,255,255,0.05)' },
  //             ticks: {
  //               color: 'rgba(255,255,255,0.4)',
  //               callback: (v: any) => `R$ ${v}`,
  //             },
  //           },
  //         },
  //       },
  //     });

  //     this.chartPagInstance = new Chart(this.chartPagamentos.nativeElement, {
  //       type: 'bar',
  //       data: {
  //         labels: dias,
  //         datasets: [
  //           {
  //             label: 'Pedidos',
  //             data: vendas,
  //             backgroundColor: 'rgba(79,140,255,0.6)',
  //             borderColor: '#4f8cff',
  //             borderWidth: 2,
  //             borderRadius: 6,
  //           },
  //         ],
  //       },
  //       options: {
  //         responsive: true,
  //         plugins: { legend: { display: false } },
  //         scales: {
  //           x: {
  //             grid: { color: 'rgba(255,255,255,0.05)' },
  //             ticks: { color: 'rgba(255,255,255,0.4)' },
  //           },
  //           y: {
  //             grid: { color: 'rgba(255,255,255,0.05)' },
  //             ticks: { color: 'rgba(255,255,255,0.4)', stepSize: 1 },
  //           },
  //         },
  //       },
  //     });
  //   }, 300);
  // }

  // get mesesDisponiveis(): string[] {
  //   const meses = new Set(this.relatorios.map((r) => r.data.slice(3)));
  //   return Array.from(meses).sort();
  // }

  // get pedidosFiltrados(): { dias: string[]; vendas: number[] } {
  //   let lista;
  //   if (this.modoGrafico === 'mes' && this.filtroGraficoMes) {
  //     lista = this.relatorios.filter(
  //       (r) => r.data.slice(3) === this.filtroGraficoMes,
  //     );
  //   } else {
  //     lista = this.relatorios.slice(-7);
  //   }
  //   return {
  //     dias: lista.map((r) => r.data.slice(0, 5)),
  //     vendas: lista.map((r) => r.total_pedidos),
  //   };
  // }

  // ============================================================
  // COMPROVANTES
  // ============================================================
  carregarComprovantes(): void {
    this.carregandoComp = true;
    let url = '/api/comprovantes';
    const params: string[] = [];
    if (this.filtroCompInicio) params.push(`inicio=${this.filtroCompInicio}`);
    if (this.filtroCompFim) params.push(`fim=${this.filtroCompFim}`);
    if (params.length) url += '?' + params.join('&');

    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        this.comprovantes = data;
        this.atualizarFiltrados();
        this.carregandoComp = false;
      },
      error: () => (this.carregandoComp = false),
    });
  }

  private searchTimer: any;
  onSearchChange(valor: string): void {
    this.searchComp = valor.replace(/\D/g, '');
    this.carregandoComp = true;

    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.atualizarFiltrados();
      this.carregandoComp = false;
    }, 1000);
  }

  atualizarFiltrados(): void {
    console.log('atualizando, search:', this.searchComp);
    if (!this.searchComp.trim()) {
      this.comprovantesFiltrados = [...this.comprovantes];
      return;
    }
    this.comprovantesFiltrados = this.comprovantes.filter(
      (c) =>
        c.num_pedido != null && String(c.num_pedido).includes(this.searchComp),
    );
  }

  limparFiltroComp(): void {
    this.filtroCompInicio = '';
    this.filtroCompFim = '';
    this.searchComp = '';
    this.carregarComprovantes();
  }

  verComprovante(url: string): void {
    Swal.fire({
      imageUrl: url,
      imageAlt: 'Comprovante Pix',
      imageWidth: '100%',
      showCloseButton: true,
      showConfirmButton: false,
      background: '#2a2f45',
      width: '600px',
    });
  }

  async baixarComprovante(url: string, numPedido: number): Promise<void> {
    const response = await fetch(url);
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `comprovante_${numPedido || 'sem_numero'}.jpg`;
    link.click();
    URL.revokeObjectURL(link.href);
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
      next: () => {
        this.salvando = false;
        this.carregarRelatorios();
      },
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

    // LOGO
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
    doc.text(
      `Faturamento Total: R$ ${this.faturamentoTotal.toFixed(2)}`,
      14,
      cursorY,
    );
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
