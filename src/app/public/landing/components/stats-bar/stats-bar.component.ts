import { Component } from '@angular/core';

interface Stat {
  value: string;
  label: string;
  icon: 'pedidos' | 'restaurantes' | 'uptime' | 'satisfacao';
}

@Component({
  selector: 'app-stats-bar',
  standalone: false,
  templateUrl: './stats-bar.component.html',
  styleUrl: './stats-bar.component.scss',
})
export class StatsBarComponent {
  stats: Stat[] = [
    {
      value: '+15 mil',
      label: 'pedidos processados todos os dias',
      icon: 'pedidos',
    },
    { value: '+120', label: 'restaurantes ativos', icon: 'restaurantes' },
    { value: '99,9%', label: 'de disponibilidade do sistema', icon: 'uptime' },
    {
      value: '4,8/5',
      label: 'satisfação dos nossos clientes',
      icon: 'satisfacao',
    },
  ];
}
