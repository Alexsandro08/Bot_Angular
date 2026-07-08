import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  RelatoriosService,
  Relatorio,
  ProdutoVendido,
} from '../../../../services/relatorios.service';
import { PedidosService } from '../../../../services/pedidos.service';
import { AuthService } from '../../../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { TourService } from '../../../../services/tour.service';

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
    private tourService: TourService,
  ) {}

  // ============================================================
  // LIFECYCLE
  // ============================================================

  ngAfterViewInit(): void {
    setTimeout(() => this.tourService.verificarEIniciar('relatorios'), 800);
  }

  ngOnInit(): void {
    this.carregarRelatorios();
    this.carregarComprovantes();
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
  
  trocarParaComprovantes(): void {
    this.abaAtiva = 'comprovantes';
    // só carrega se ainda não tiver dados
    if (this.comprovantes.length === 0) {
      this.carregarComprovantes();
    }
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
    let lista = [...this.comprovantes];

    // filtro por número do pedido
    if (this.searchComp.trim()) {
      lista = lista.filter((c) =>
        String(c.num_pedido ?? '').includes(this.searchComp),
      );
    }

    // filtro por data início
    if (this.filtroCompInicio) {
      lista = lista.filter(
        (c) => new Date(c.criado_em) >= new Date(this.filtroCompInicio),
      );
    }

    // filtro por data fim
    if (this.filtroCompFim) {
      lista = lista.filter(
        (c) => new Date(c.criado_em) <= new Date(this.filtroCompFim),
      );
    }

    this.comprovantesFiltrados = lista;
    this.paginaComprovantes = 1;
  }

  limparFiltroComp(): void {
    this.filtroCompInicio = '';
    this.filtroCompFim = '';
    this.searchComp = '';
    this.paginaComprovantes = 1;

    this.comprovantesFiltrados = [...this.comprovantes];
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
    this.paginaHistorico = 1; // ← adiciona essa linha
    this.relatoriosFiltrados = this.relatorios.filter((r) => {
      const [d, m, a] = r.data.split('/');
      const dataStr = `${a}-${m}-${d}`;
      if (this.filtroInicio && dataStr < this.filtroInicio) return false;
      if (this.filtroFim && dataStr > this.filtroFim) return false;
      return true;
    });
  }

  limparFiltro(): void {
    this.paginaHistorico = 1; // ← adiciona essa linha
    this.filtroInicio = '';
    this.filtroFim = '';
    this.relatoriosFiltrados = this.relatorios;
  }

  // ============================================================
  // SALVAR
  // ============================================================

  salvarManual(): void {
    if (this.salvando || this.jaExisteHoje) return;
    this.salvando = true;
    const payload = this.relatoriosService.montarPayload(
      this.pedidosService.getHistorico(),
    );
    this.relatoriosService.salvar(payload).subscribe({
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
  async exportarPDF(): Promise<void> {
    const doc = new jsPDF();
    const dataHoje = new Date().toLocaleDateString('pt-BR');
    let cursorY = 20;

    // LOGO
    if (this.logoUrl) {
      try {
        const base64 = await this.urlParaBase64(this.logoUrl);
        doc.addImage(base64, 'PNG', 14, cursorY, 20, 20);
      } catch {
        console.warn('Logo não carregou, pulando...');
      }
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

  // ============================================================
  // HELPER — converte URL de imagem pra base64
  // ============================================================
  private urlParaBase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d')!.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = url;
    });
  }

  // ============================================================
  // PAGINAÇÃO
  // ============================================================

  paginaHistorico = 1;
  paginaComprovantes = 1;
  itensPorPagina = 7;

  /* =========================
   HISTÓRICO
========================= */

  get totalPaginas(): number {
    return Math.ceil(this.relatoriosFiltrados.length / this.itensPorPagina);
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  get relatoriosPaginados(): Relatorio[] {
    const inicio = (this.paginaHistorico - 1) * this.itensPorPagina;

    return this.relatoriosFiltrados.slice(inicio, inicio + this.itensPorPagina);
  }

  irParaPagina(p: number): void {
    if (p >= 1 && p <= this.totalPaginas) {
      this.paginaHistorico = p;
    }
  }

  /* =========================
   COMPROVANTES
========================= */

  get totalPaginasComprovantes(): number {
    return Math.ceil(this.comprovantesFiltrados.length / this.itensPorPagina);
  }

  get paginasComprovantes(): number[] {
    return Array.from(
      { length: this.totalPaginasComprovantes },
      (_, i) => i + 1,
    );
  }

  get comprovantesPaginados(): any[] {
    const inicio = (this.paginaComprovantes - 1) * this.itensPorPagina;

    return this.comprovantesFiltrados.slice(
      inicio,
      inicio + this.itensPorPagina,
    );
  }

  irParaPaginaComprovantes(p: number): void {
    if (p >= 1 && p <= this.totalPaginasComprovantes) {
      this.paginaComprovantes = p;
    }
  }
}
