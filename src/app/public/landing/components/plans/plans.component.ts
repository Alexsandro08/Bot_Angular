import { Component } from '@angular/core';

interface Plan {
  name: string;
  desc: string;
  price?: string;
  priceSuffix?: string;
  consult?: string;
  features: string[];
  featured?: boolean;
  badge?: string;
  ctaLabel: string;
  ctaStyle: 'primary' | 'outline';
}

@Component({
  selector: 'app-plans',
  standalone: false,
  templateUrl: './plans.component.html',
  styleUrl: './plans.component.scss',
})
export class PlansComponent {
  plans: Plan[] = [
    {
      name: 'Starter',
      desc: 'Ideal para quem está começando',
      price: 'R$ 79',
      priceSuffix: '/mês',
      features: [
        'Pedidos via WhatsApp',
        'IA Inteligente',
        'Cardápio Digital',
        'Até 1.000 pedidos/mês',
        'Suporte por e-mail',
      ],
      ctaLabel: 'Começar grátis',
      ctaStyle: 'outline',
    },
    {
      name: 'Pro',
      desc: 'Para restaurantes em crescimento',
      price: 'R$ 149',
      priceSuffix: '/mês',
      featured: true,
      badge: 'MAIS ESCOLHIDO',
      features: [
        'Tudo do plano Starter',
        'Relatórios e Dashboards',
        'Promoções e Cupons',
        'Até 5.000 pedidos/mês',
        'Suporte prioritário',
      ],
      ctaLabel: 'Começar grátis',
      ctaStyle: 'primary',
    },
    {
      name: 'Enterprise',
      desc: 'Para grandes operações',
      consult: 'Sob consulta',
      features: [
        'Tudo do plano Pro',
        'Pedidos ilimitados',
        'Integrações personalizadas',
        'Gerente de conta dedicado',
        'SLA e suporte 24/7',
      ],
      ctaLabel: 'Falar com especialista',
      ctaStyle: 'outline',
    },
  ];
}
