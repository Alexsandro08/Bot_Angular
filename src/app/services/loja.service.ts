import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { PedidosService } from './pedidos.service';

export interface HorarioLoja {
  abertura: string;
  fechamento: string;
  dias: string[];
}

@Injectable({ providedIn: 'root' })
export class LojaService {
  private abertaSubject = new BehaviorSubject<boolean>(false);
  private horarioSubject = new BehaviorSubject<HorarioLoja | null>(null);

  private salvarRelatorioSubject = new Subject<void>();
  salvarRelatorio$ = this.salvarRelatorioSubject.asObservable();

  private inicializado = false;

  private aviso10minSubject = new BehaviorSubject<boolean>(false);
  private aviso5minSubject = new BehaviorSubject<boolean>(false);
  private aviso1minSubject = new BehaviorSubject<boolean>(false);
  private alertaAmareloSubject = new BehaviorSubject<boolean>(false);

  aviso10min$ = this.aviso10minSubject.asObservable();
  aviso5min$ = this.aviso5minSubject.asObservable();
  aviso1min$ = this.aviso1minSubject.asObservable();
  alertaAmarelo$ = this.alertaAmareloSubject.asObservable();

  private avisou10min = false;
  private avisou5min = false;
  private avisou1min = false;

  aberta$ = this.abertaSubject.asObservable();
  horario$ = this.horarioSubject.asObservable();

  private timer: any;

  constructor(
    private pedidosService: PedidosService,
    private http: HttpClient,
  ) {}

  // ============================================================
  // INICIALIZAÇÃO — busca estado do backend
  // ============================================================
  inicializarComDados(me: any): Promise<void> {
    return new Promise((resolve) => {
      const horarioValido = me.horario_abertura && me.horario_fechamento;

      const horario: HorarioLoja | null = horarioValido
        ? {
            abertura: me.horario_abertura,
            fechamento: me.horario_fechamento,
            dias: me.dias_funcionamento || ['seg', 'ter', 'qua', 'qui', 'sex'],
          }
        : null;

      this.horarioSubject.next(horario);
      this.abertaSubject.next(me.loja_aberta || false);
      if (horario) this.iniciarTimer();
      setTimeout(() => {
        this.inicializado = true;
      }, 1000); // ← ADICIONA
      resolve();
    });
  }

  // ============================================================
  // GETTERS
  // ============================================================
  get aberta(): boolean {
    return this.abertaSubject.value;
  }
  get horario(): HorarioLoja | null {
    return this.horarioSubject.value;
  }
  get horarioDefinido(): boolean {
    return !!this.horarioSubject.value;
  }

  // ============================================================
  // AÇÕES
  // ============================================================
  definirHorario(horario: HorarioLoja): void {
    this.horarioSubject.next(horario);
    this.iniciarTimer();
    this.sincronizar(this.aberta);
  }

  abrirLoja(): void {
    if (this.abertaSubject.value === true) return; // ← não emite se já estava aberta
    this.abertaSubject.next(true);
    this.sincronizar(true);
  }

  fecharLoja(): void {
    if (this.abertaSubject.value === false) return; // ← não emite se já estava fechada
    this.salvarRelatorioSubject.next();
    this.abertaSubject.next(false);
    this.alertaAmareloSubject.next(false);
    this.pedidosService.limparPendentes();
    this.pedidosService.zerarHistorico();
    this.sincronizar(false);
  }

  // ============================================================
  // SINCRONIZAÇÃO COM BACKEND
  // ============================================================
  private sincronizar(aberta: boolean): void {
    const horario = this.horarioSubject.value;
    this.http
      .post('/api/loja/status', {
        aberta,
        abertura: horario?.abertura,
        fechamento: horario?.fechamento,
        dias: horario?.dias,
      })
      .subscribe();
  }

  // ============================================================
  // TIMER
  // ============================================================
  private iniciarTimer(): void {
    clearInterval(this.timer);
    this.timer = setInterval(() => this.verificarHorario(), 10000);
    this.verificarHorario();
  }

  private verificarHorario(): void {
    const horario = this.horarioSubject.value;
    if (!horario) return;

    const agora = new Date();
    const diasSemana = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    const diaAtual = diasSemana[agora.getDay()];
    const diaFuncionamento = horario.dias?.includes(diaAtual) ?? true;

    const [hFe, mFe] = horario.fechamento.split(':').map(Number);
    const [hAb, mAb] = horario.abertura.split(':').map(Number);

    const segundosAgora =
      agora.getHours() * 3600 + agora.getMinutes() * 60 + agora.getSeconds();
    const segundosAbertura = hAb * 3600 + mAb * 60;
    const segundosFechamento = hFe * 3600 + mFe * 60;

    const deveEstarAberta =
      diaFuncionamento &&
      segundosAgora >= segundosAbertura &&
      segundosAgora < segundosFechamento;

    const segundosRestantes = diaFuncionamento
      ? segundosFechamento - segundosAgora
      : 0;

    // reseta flags quando tá longe do fechamento
    if (segundosRestantes > 600) {
      this.avisou10min = false;
      this.avisou5min = false;
      this.avisou1min = false;
      this.alertaAmareloSubject.next(false);
    }

    // aviso 10 minutos (600s ± 10s de tolerância pro intervalo de 10s)
    if (
      segundosRestantes <= 610 &&
      segundosRestantes > 300 &&
      this.aberta &&
      !this.avisou10min
    ) {
      this.avisou10min = true;
      this.aviso10minSubject.next(true);
      this.alertaAmareloSubject.next(true);
    }

    // aviso 5 minutos
    if (
      segundosRestantes <= 310 &&
      segundosRestantes > 60 &&
      this.aberta &&
      !this.avisou5min
    ) {
      this.avisou5min = true;
      this.aviso5minSubject.next(true);
    }

    // aviso 1 minuto
    if (
      segundosRestantes <= 70 &&
      segundosRestantes > 0 &&
      this.aberta &&
      !this.avisou1min
    ) {
      this.avisou1min = true;
      this.aviso1minSubject.next(true);
    }

    if (deveEstarAberta && !this.aberta) {
      this.abrirLoja();
    } else if (!deveEstarAberta && this.aberta) {
      this.fecharLoja();
    }
  }
}
