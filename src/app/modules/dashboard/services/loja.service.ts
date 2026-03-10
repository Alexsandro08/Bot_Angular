import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { PedidosService } from './pedidos.service';

export interface HorarioLoja {
  abertura: string;
  fechamento: string;
}

@Injectable({ providedIn: 'root' })
export class LojaService {
  private abertaSubject = new BehaviorSubject<boolean>(this.carregarEstado());
  private horarioSubject = new BehaviorSubject<HorarioLoja | null>(
    this.carregarHorario(),
  );

  private salvarRelatorioSubject = new Subject<void>();
  salvarRelatorio$ = this.salvarRelatorioSubject.asObservable();

  private aviso5minSubject = new BehaviorSubject<boolean>(false);
  private alertaAmareloSubject = new BehaviorSubject<boolean>(false);
  

  aberta$ = this.abertaSubject.asObservable();
  horario$ = this.horarioSubject.asObservable();
  aviso5min$ = this.aviso5minSubject.asObservable();
  alertaAmarelo$ = this.alertaAmareloSubject.asObservable();

  private timer: any;
  private avisou5min = false;

  constructor(private pedidosService: PedidosService) {
    if (this.horarioSubject.value) {
      this.iniciarTimer();
    }
  }

  get aberta(): boolean {
    return this.abertaSubject.value;
  }
  get horario(): HorarioLoja | null {
    return this.horarioSubject.value;
  }
  get horarioDefinido(): boolean {
    return !!this.horarioSubject.value;
  }

  private carregarEstado(): boolean {
    return localStorage.getItem('loja_aberta') === 'true';
  }

  private carregarHorario(): HorarioLoja | null {
    try {
      const h = localStorage.getItem('loja_horario');
      return h ? JSON.parse(h) : null;
    } catch {
      return null;
    }
  }

  definirHorario(horario: HorarioLoja): void {
    localStorage.setItem('loja_horario', JSON.stringify(horario));
    this.horarioSubject.next(horario);
    this.iniciarTimer();
  }

  abrirLoja(): void {
    localStorage.setItem('loja_aberta', 'true');
    this.abertaSubject.next(true);
  }

  fecharLoja(): void {
  this.salvarRelatorioSubject.next();
  localStorage.setItem('loja_aberta', 'false');
  this.abertaSubject.next(false);
  this.alertaAmareloSubject.next(false);
  this.pedidosService.limparPendentes();
  this.pedidosService.zerarHistorico();
}

  private iniciarTimer(): void {
    clearInterval(this.timer);
    this.timer = setInterval(() => this.verificarHorario(), 10000);
    this.verificarHorario();
  }

  private verificarHorario(): void {
    const horario = this.horarioSubject.value;
    if (!horario) return;

    const agora = new Date();
    const [hFe, mFe] = horario.fechamento.split(':').map(Number);
    const [hAb, mAb] = horario.abertura.split(':').map(Number);

    const segundosAgora =
      agora.getHours() * 3600 + agora.getMinutes() * 60 + agora.getSeconds();
    const segundosAbertura = hAb * 3600 + mAb * 60;
    const segundosFechamento = hFe * 3600 + mFe * 60;

    const deveEstarAberta =
      segundosAgora >= segundosAbertura && segundosAgora < segundosFechamento;
    const segundosRestantes = segundosFechamento - segundosAgora;

    if (
      segundosRestantes >= 60 &&
      segundosRestantes <= 70 &&
      this.aberta &&
      !this.avisou5min
    ) {
      this.avisou5min = true;
      this.aviso5minSubject.next(true);
      this.alertaAmareloSubject.next(true);
    }

    if (segundosRestantes > 70) {
      this.avisou5min = false;
      this.alertaAmareloSubject.next(false);
    }

    if (deveEstarAberta && !this.aberta) {
      this.abrirLoja();
    } else if (!deveEstarAberta && this.aberta) {
      this.fecharLoja();
    }
  }
}
