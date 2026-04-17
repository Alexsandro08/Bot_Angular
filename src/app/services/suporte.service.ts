import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Chamado {
  userId: string;
  nome: string;
  motivo: string;
  numPedido?: number;
  hora: Date;
  status: 'aguardando' | 'em_atendimento' | 'encerrado';
  mensagens: { texto: string; hora: Date; deAtendente: boolean }[];
}

@Injectable({ providedIn: 'root' })
export class SuporteService {
  private chamadosSubject = new BehaviorSubject<Chamado[]>([]);
  chamados$ = this.chamadosSubject.asObservable();

  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos

  get chamadosAbertos(): number {
    return this.chamadosSubject.value.filter((c) => c.status !== 'encerrado').length;
  }

  adicionarChamado(dados: any): void {
    const existente = this.chamadosSubject.value.find((c) => c.userId === dados.userId);

    if (existente) {
      const chamados = this.chamadosSubject.value.map((c) =>
        c.userId === dados.userId
          ? { ...c, motivo: dados.motivo, hora: new Date(), status: 'aguardando' as const }
          : c
      );
      this.chamadosSubject.next(chamados);
      this.resetarTimer(dados.userId); // reinicia o timer se chamou de novo
      return;
    }

    this.chamadosSubject.next([
      {
        userId: dados.userId,
        nome: dados.nome,
        motivo: dados.motivo,
        numPedido: dados.numPedido,
        hora: new Date(),
        status: 'aguardando',
        mensagens: [],
      },
      ...this.chamadosSubject.value,
    ]);

    this.resetarTimer(dados.userId);
  }

  getChamados(): Chamado[] {
    return this.chamadosSubject.value;
  }

  atualizarStatus(userId: string, status: Chamado['status']): void {
    const chamados = this.chamadosSubject.value.map((c) =>
      c.userId === userId ? { ...c, status } : c,
    );
    this.chamadosSubject.next(chamados);

    // se encerrou manualmente, cancela o timer
    if (status === 'encerrado') {
      this.cancelarTimer(userId);
    }
  }

  private resetarTimer(userId: string): void {
    this.cancelarTimer(userId);
    const timer = setTimeout(() => {
      this.encerrarPorTimeout(userId);
    }, this.TIMEOUT_MS);
    this.timers.set(userId, timer);
  }

  private cancelarTimer(userId: string): void {
    const timer = this.timers.get(userId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(userId);
    }
  }

  private encerrarPorTimeout(userId: string): void {
    const chamado = this.chamadosSubject.value.find((c) => c.userId === userId);
    if (!chamado || chamado.status === 'encerrado') return;

    const chamados = this.chamadosSubject.value.map((c) =>
      c.userId === userId ? { ...c, status: 'encerrado' as const } : c,
    );
    this.chamadosSubject.next(chamados);
    this.timers.delete(userId);
    console.log(`⏱️ Chamado de ${chamado.nome} encerrado por timeout.`);
  }
}