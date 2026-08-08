import { Component } from '@angular/core';

interface Step {
  title: string;
  desc: string;
}

@Component({
  selector: 'app-steps',
  standalone: false,
  templateUrl: './steps.component.html',
  styleUrl: './steps.component.scss',
})
export class StepsComponent {
  steps: Step[] = [
    {
      title: 'Cliente envia mensagem',
      desc: 'O cliente chama no WhatsApp e faz o pedido como de costume.',
    },
    {
      title: 'IA entende o pedido',
      desc: 'Nossa IA entende, confirma os itens e envia para o sistema.',
    },
    {
      title: 'Pedido no painel',
      desc: 'O pedido aparece no painel e sua equipe prepara para a entrega.',
    },
  ];
}
