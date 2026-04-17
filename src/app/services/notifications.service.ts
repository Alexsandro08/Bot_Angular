import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: number;
  tipo: 'pedido' | 'pagamento' | 'alerta' | 'loja' | 'atendente';
  titulo: string;
  mensagem: string;
  hora: Date;
  lida: boolean;
  dadosAtendente?: {
    userId: string;
    nome: string;
    motivo: string;
    numPedido?: number;
  };
}
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private notificacoesSubject = new BehaviorSubject<Notification[]>([]);
  notificacoes$ = this.notificacoesSubject.asObservable();

  constructor() {
    const salvas = sessionStorage.getItem('notificacoes');
    if (salvas) {
      const notifs = JSON.parse(salvas).map((n: Notification) => ({
        ...n,
        lida: true,
      }));
      this.notificacoesSubject = new BehaviorSubject<Notification[]>(notifs);
      this.notificacoes$ = this.notificacoesSubject.asObservable();
    }
  }

  get naoLidas(): number {
    return this.notificacoesSubject.value.filter((n) => !n.lida).length;
  }

  adicionar(
    tipo: Notification['tipo'],
    titulo: string,
    mensagem: string,
    dadosAtendente?: Notification['dadosAtendente'],
  ): void {
    const nova: Notification = {
      id: Date.now(),
      tipo,
      titulo,
      mensagem,
      hora: new Date(),
      lida: false,
      dadosAtendente,
    };
    const atualizadas = [nova, ...this.notificacoesSubject.value];
    this.notificacoesSubject.next(atualizadas);
    sessionStorage.setItem('notificacoes', JSON.stringify(atualizadas));
  }

  marcarTodasLidas(): void {
    const atualizadas = this.notificacoesSubject.value.map((n) => ({
      ...n,
      lida: true,
    }));
    this.notificacoesSubject.next(atualizadas);
    sessionStorage.setItem('notificacoes', JSON.stringify(atualizadas));
  }

  limpar(): void {
    this.notificacoesSubject.next([]);
    sessionStorage.removeItem('notificacoes');
    sessionStorage.removeItem('notif_loja_aberta'); // ← ADICIONA
    sessionStorage.removeItem('notif_loja_fechada'); // ← ADICIONA
  }
}
