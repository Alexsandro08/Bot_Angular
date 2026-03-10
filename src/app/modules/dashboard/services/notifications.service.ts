import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: number;
  tipo: 'pedido' | 'pagamento' | 'alerta' | 'loja';
  titulo: string;
  mensagem: string;
  hora: Date;
  lida: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private notificacoesSubject = new BehaviorSubject<Notification[]>([]);
  notificacoes$ = this.notificacoesSubject.asObservable();

  get naoLidas(): number {
    return this.notificacoesSubject.value.filter(n => !n.lida).length;
  }

  adicionar(tipo: Notification['tipo'], titulo: string, mensagem: string): void {
    const nova: Notification = {
      id: Date.now(),
      tipo,
      titulo,
      mensagem,
      hora: new Date(),
      lida: false
    };
    this.notificacoesSubject.next([nova, ...this.notificacoesSubject.value]);
    this.tocar();
  }

  marcarTodasLidas(): void {
    const atualizadas = this.notificacoesSubject.value.map(n => ({ ...n, lida: true }));
    this.notificacoesSubject.next(atualizadas);
  }

  limpar(): void {
    this.notificacoesSubject.next([]);
  }

  private tocar(): void {
    try {
      const ctx = new AudioContext();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      o.start(ctx.currentTime);
      o.stop(ctx.currentTime + 0.3);
    } catch {}
  }
}