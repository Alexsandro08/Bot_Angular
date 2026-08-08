import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

interface ChatMessage {
  from: 'cliente' | 'bot';
  text: string;
}

@Component({
  selector: 'app-whatsapp-mock',
  templateUrl: './whatsapp-mock.component.html',
  styleUrls: ['./whatsapp-mock.component.scss'],
  standalone: false,
})
export class WhatsappMockComponent implements OnInit, OnDestroy {
  @ViewChild('waBody') waBody?: ElementRef<HTMLElement>;

  private script: ChatMessage[] = [
    { from: 'cliente', text: 'Oi, quero fazer um pedido' },
    {
      from: 'bot',
      text: 'Claro! 😊 Aqui está nosso cardápio de hoje. O que vai ser?',
    },
    { from: 'cliente', text: '2 pizzas grandes de calabresa' },
    { from: 'bot', text: 'Perfeito! Pedido confirmado ✅ Chega em 35 min.' },
  ];

  visibleMessages: ChatMessage[] = [];
  isTyping = false;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private loopTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.playScript();
  }

  ngOnDestroy(): void {
    this.timers.forEach((t) => clearTimeout(t));
    if (this.loopTimeout) clearTimeout(this.loopTimeout);
  }

  private scrollToBottom(): void {
    // Espera o Angular renderizar a nova bolha antes de rolar
    setTimeout(() => {
      const el = this.waBody?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 0);
  }

  private playScript(): void {
    this.visibleMessages = [];
    let delay = 600;

    this.script.forEach((msg) => {
      const typingTimer = setTimeout(() => {
        this.isTyping = true;
        this.scrollToBottom();
      }, delay);
      this.timers.push(typingTimer);

      delay += 1000;

      const msgTimer = setTimeout(() => {
        this.isTyping = false;
        this.visibleMessages = [...this.visibleMessages, msg];
        this.scrollToBottom();
      }, delay);
      this.timers.push(msgTimer);

      delay += 900;
    });

    this.loopTimeout = setTimeout(() => this.playScript(), delay + 2500);
  }
}
