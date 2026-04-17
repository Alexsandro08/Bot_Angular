import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-financeiro',
  standalone: false,
  templateUrl: './financeiro.component.html',
  styleUrls: ['./financeiro.component.scss'],
})
export class FinanceiroComponent implements OnInit, AfterViewInit {
  @ViewChild('chartFaturamento') chartFaturamento!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartClientes') chartClientes!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartPlanos') chartPlanos!: ElementRef<HTMLCanvasElement>;

  resumo = {
    faturamentoMes: 1470,
    faturamentoTotal: 8320,
    assinantesAtivos: 3,
    ticketMedio: 490,
  };

  meses = ['Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr'];

  faturamentoData = [490, 980, 490, 1470, 980, 1470, 1470];
  clientesData    = [1, 2, 2, 3, 3, 3, 4];
  planosData      = { ilimitado: 3, mensal: 1, expirado: 1 };

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.renderCharts();
  }

  renderCharts(): void {
    const Chart = (window as any).Chart;
    if (!Chart) return;

    const defaults = {
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointRadius: 4,
      pointHoverRadius: 6,
    };

    // Faturamento
    new Chart(this.chartFaturamento.nativeElement, {
      type: 'line',
      data: {
        labels: this.meses,
        datasets: [{
          label: 'Faturamento (R$)',
          data: this.faturamentoData,
          borderColor: '#a78bfa',
          backgroundColor: 'rgba(167,139,250,0.1)',
          ...defaults,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.4)' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.4)', callback: (v: any) => `R$ ${v}` } }
        }
      }
    });

    // Clientes
    new Chart(this.chartClientes.nativeElement, {
      type: 'bar',
      data: {
        labels: this.meses,
        datasets: [{
          label: 'Clientes',
          data: this.clientesData,
          backgroundColor: 'rgba(96,165,250,0.6)',
          borderColor: '#60a5fa',
          borderWidth: 2,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.4)' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.4)', stepSize: 1 } }
        }
      }
    });

    // Planos (donut)
    new Chart(this.chartPlanos.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Ilimitado', 'Mensal', 'Expirado'],
        datasets: [{
          data: [this.planosData.ilimitado, this.planosData.mensal, this.planosData.expirado],
          backgroundColor: ['rgba(167,139,250,0.8)', 'rgba(52,211,153,0.8)', 'rgba(248,113,113,0.8)'],
          borderColor: ['#a78bfa', '#34d399', '#f87171'],
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: 'rgba(255,255,255,0.5)', padding: 16, font: { size: 12 } }
          }
        }
      }
    });
  }
}