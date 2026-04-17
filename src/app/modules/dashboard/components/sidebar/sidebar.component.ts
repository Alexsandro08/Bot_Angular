import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { PedidosService } from '../../../../services/pedidos.service';

import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  percPix = 0;
  percDinheiro = 0;
  percCartao = 0;
  maiorLabel = '';
  maiorPerc = 0;
  gradiente = 'conic-gradient(#363b4a 0% 100%)';

  constructor(
    private pedidosService: PedidosService,
    private http: HttpClient,
  ) {}

  @ViewChild('chartPagamentos') chartPagamentos!: ElementRef<HTMLCanvasElement>;

  private chartInstance: any = null;
  private viewIniciada = false;

  ngAfterViewInit(): void {
    this.viewIniciada = true;
    this.renderChart();
  }

  renderChart(): void {
    if (!this.viewIniciada || !this.chartPagamentos) return;
    const Chart = (window as any).Chart;
    if (!Chart) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const historico = this.pedidosService.getHistorico();
    const total = historico.length;

    const pix = total
      ? historico.filter((p) => p.pagamento === 'Pix').length
      : 0;
    const dinheiro = total
      ? historico.filter((p) => p.pagamento === 'Dinheiro').length
      : 0;
    const cartao = total - pix - dinheiro;

    this.chartInstance = new Chart(this.chartPagamentos.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Pix', 'Dinheiro', 'Cartão'],
        datasets: [
          {
            data: total ? [pix, dinheiro, cartao] : [1, 1, 1],
            backgroundColor: total
              ? [
                  'rgba(74,176,167,0.8)',
                  'rgba(241,196,15,0.8)',
                  'rgba(162,155,254,0.8)',
                ]
              : [
                  'rgba(255,255,255,0.08)',
                  'rgba(255,255,255,0.08)',
                  'rgba(255,255,255,0.08)',
                ],
            borderColor: total
              ? ['#4ab0a7', '#f1c40f', '#a29bfe']
              : [
                  'rgba(255,255,255,0.1)',
                  'rgba(255,255,255,0.1)',
                  'rgba(255,255,255,0.1)',
                ],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: total > 0 },
        },
      },
    });
  }

  ngOnInit(): void {
    this.pedidosService.pedidos$.subscribe(() => {
      this.calcular();
      this.carregarImagens();
    });
    this.pedidosService.historico$.subscribe(() => {
      this.calcular();
      this.carregarImagens();
    });
    setTimeout(() => this.carregarImagens(), 500);
  }

  calcular(): void {
    const historico = this.pedidosService.getHistorico();
    const total = historico.length;

    if (!total) {
      this.percPix = 0;
      this.percDinheiro = 0;
      this.percCartao = 0;
      this.gradiente = 'conic-gradient(#9499a57c 0% 100%)';
      return;
    }

    const pix = historico.filter((p) => p.pagamento === 'Pix').length;
    const dinheiro = historico.filter((p) => p.pagamento === 'Dinheiro').length;

    this.percPix = Math.round((pix / total) * 100);
    this.percDinheiro = Math.round((dinheiro / total) * 100);
    this.percCartao = 100 - this.percPix - this.percDinheiro;

    const p1 = this.percPix;
    const p2 = p1 + this.percDinheiro;

    this.renderChart();
    this.gradiente = `conic-gradient(#4ab0a7 0% ${p1}%, #f1c40f ${p1}% ${p2}%, #a29bfe ${p2}% 100%)`;
  }

  get ticketMedio(): string {
    const historico = this.pedidosService.getHistorico();
    if (!historico.length) return 'R$ 0,00';
    const total = historico.reduce((a, b) => a + b.total, 0);
    return `R$ ${(total / historico.length).toFixed(2).replace('.', ',')}`;
  }

  get maisVendidos(): { nome: string; quantidade: number }[] {
    const todos = [
      ...this.pedidosService
        .getPedidos()
        .filter(
          (p) =>
            p.pagamento !== 'Pix' ||
            p.status === 'em_preparo' ||
            p.status === 'finalizado',
        ),
      ...this.pedidosService.getHistorico(),
    ];

    const contagem: Record<string, number> = {};
    todos.forEach((pedido) => {
      pedido.carrinho.forEach((item) => {
        const nome = item
          .replace(/^\d+x\s*/i, '')
          .replace(/\s*\(R\$.*?\)/g, '')
          .trim();
        contagem[nome] = (contagem[nome] || 0) + 1;
      });
    });

    return Object.entries(contagem)
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);
  }

  imagensCache: Record<string, string> = {};

  carregarImagens(): void {
    console.log('carregarImagens chamado, maisVendidos:', this.maisVendidos);
    this.maisVendidos.forEach((item) => {
      console.log('buscando imagem para:', item.nome);
      if (!this.imagensCache[item.nome]) {
        this.imagensCache[item.nome] = 'assets/default.png';
        this.http
          .get<{
            url: string;
          }>(`/api/imagens/produto?nome=${encodeURIComponent(item.nome)}`)
          .subscribe((res) => {
            console.log('resposta pexels:', item.nome, res);
            if (res.url) this.imagensCache[item.nome] = res.url;
          });
      }
    });
  }

  getIconeProduto(nome: string): string {
    if (this.imagensCache[nome]) return this.imagensCache[nome];

    this.http
      .get<{
        url: string;
      }>(`/api/imagens/produto?nome=${encodeURIComponent(nome)}`)
      .subscribe((res) => {
        if (res.url) this.imagensCache[nome] = res.url;
      });

    return this.imagensCache[nome] || 'assets/defaultt.png';
  }
}
