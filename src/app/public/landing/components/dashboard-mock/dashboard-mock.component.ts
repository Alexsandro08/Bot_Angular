import { Component, OnDestroy, OnInit } from '@angular/core';

interface Bar {
  label: string;
  targetPercent: number;
  currentPercent: number;
}

@Component({
  selector: 'app-dashboard-mock',
  standalone: false,
  templateUrl: './dashboard-mock.component.html',
  styleUrl: './dashboard-mock.component.scss',
})
export class DashboardMockComponent implements OnInit, OnDestroy {
  pedidosHoje = 0;
  faturamentoHoje = 0;

  bars: Bar[] = [
    { label: 'Seg', targetPercent: 45, currentPercent: 0 },
    { label: 'Ter', targetPercent: 60, currentPercent: 0 },
    { label: 'Qua', targetPercent: 38, currentPercent: 0 },
    { label: 'Qui', targetPercent: 72, currentPercent: 0 },
    { label: 'Sex', targetPercent: 90, currentPercent: 0 },
    { label: 'Sáb', targetPercent: 100, currentPercent: 0 },
  ];

  private interval?: ReturnType<typeof setInterval>;
  private loopTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.playAnimation();
  }

  ngOnDestroy(): void {
    if (this.interval) clearInterval(this.interval);
    if (this.loopTimeout) clearTimeout(this.loopTimeout);
  }

  private playAnimation(): void {
    // Reseta
    this.pedidosHoje = 0;
    this.faturamentoHoje = 0;
    this.bars.forEach((b) => (b.currentPercent = 0));

    const durationMs = 1400;
    const steps = 40;
    const stepMs = durationMs / steps;
    let step = 0;

    this.interval = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);

      this.pedidosHoje = Math.round(128 * progress);
      this.faturamentoHoje = Math.round(4870 * progress);
      this.bars.forEach((b) => (b.currentPercent = b.targetPercent * progress));

      if (progress >= 1 && this.interval) {
        clearInterval(this.interval);
      }
    }, stepMs);

    this.loopTimeout = setTimeout(
      () => this.playAnimation(),
      durationMs + 3000,
    );
  }
}
