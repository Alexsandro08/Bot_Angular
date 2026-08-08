import { Component } from '@angular/core';

interface Feature {
  title: string;
  desc: string;
}

@Component({
  selector: 'app-features',
  standalone: false,
  templateUrl: './features.component.html',
  styleUrl: './features.component.scss',
})
export class FeaturesComponent {
  features: Feature[] = [
    {
      title: 'Pedidos via WhatsApp',
      desc: 'Receba pedidos de forma automática e organizada.',
    },
    {
      title: 'IA Inteligente',
      desc: 'Entende, responde e sugere produtos para vender mais.',
    },
    {
      title: 'Cardápio Digital',
      desc: 'Cardápio sempre atualizado, com categorias, preços e opcionais.',
    },
    {
      title: 'Acompanhamento',
      desc: 'Cliente acompanha o status do pedido em tempo real.',
    },
    {
      title: 'Relatórios e Métricas',
      desc: 'Dados e relatórios completos para decisões melhores.',
    },
    {
      title: 'Promoções e Cupons',
      desc: 'Crie promoções e cupons para fidelizar seus clientes.',
    },
    {
      title: 'Formas de Pagamento',
      desc: 'Pix, cartão, dinheiro e integrações com maquininhas.',
    },
    {
      title: 'Suporte Prioritário',
      desc: 'Suporte rápido e humanizado sempre que você precisar.',
    },
  ];
}
