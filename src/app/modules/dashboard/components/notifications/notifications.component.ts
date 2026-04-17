import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { NotificationsService, Notification } from '../../../../services/notifications.service';

@Component({
  selector: 'app-notifications',
  standalone: false,
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
})
export class NotificationsComponent implements OnInit, OnDestroy {
  aberto = false;
  notificacoes: Notification[] = [];
  naoLidas = 0;

  constructor(private notificationsService: NotificationsService) {}

  ngOnInit(): void {
    this.notificationsService.notificacoes$.subscribe((n) => {
      this.notificacoes = n;
      this.naoLidas = this.notificationsService.naoLidas;
    });
  }

  ngOnDestroy(): void {}

  toggle(): void {
    this.aberto = !this.aberto;
    if (this.aberto) this.notificationsService.marcarTodasLidas();
  }

  limpar(): void {
    this.notificationsService.limpar();
  }

  getIcone(tipo: string): string {
    if (tipo === 'pedido') return 'bi-bag-fill';
    if (tipo === 'pagamento') return 'bi-cash-coin';
    if (tipo === 'alerta') return 'bi-exclamation-triangle-fill';
    if (tipo === 'atendente') return 'bi-person-fill';
    if (tipo === 'loja') return 'bi-shop';
    return 'bi-bell-fill';
  }

  getCor(tipo: string): string {
    if (tipo === 'pedido') return '#4f8cff';
    if (tipo === 'pagamento') return '#2ed573';
    if (tipo === 'alerta') return '#f1c40f';
    if (tipo === 'atendente') return '#ff6b6b';
    if (tipo === 'loja') return '#a29bfe';
    return '#9499a5';
  }

  @HostListener('document:click', ['$event'])
  fecharFora(event: MouseEvent): void {
    const el = (event.target as HTMLElement).closest('app-notifications');
    if (!el) this.aberto = false;
  }
}