import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,  // ← ADICIONAR
} from '@angular/core';
import { Subscription } from 'rxjs';
import { SocketService } from '../../../../services/socket.service';
import { AuthService } from '../../../../services/auth.service';
import { SuporteService } from '../../../../services/suporte.service';

interface MsgChat {
  texto: string;
  hora: Date;
  deAtendente: boolean;
}

interface Chamado {
  userId: string;
  nome: string;
  motivo: string;
  numPedido?: number;
  hora: Date;
  status: 'aguardando' | 'em_atendimento' | 'encerrado';
  mensagens: MsgChat[];
}

@Component({
  selector: 'app-suporte',
  standalone: false,
  templateUrl: './suporte.component.html',
  styleUrl: './suporte.component.scss',
})
export class SuporteComponent implements OnInit, OnDestroy {
  @ViewChild('msgContainer') msgContainer!: ElementRef;

  chamados: Chamado[] = [];
  chamadoAtivo: Chamado | null = null;
  mensagemDigitada = '';
  restauranteId = '';

  private subs: Subscription[] = [];

  constructor(
    private socketService: SocketService,
    private authService: AuthService,
    private suporteService: SuporteService,
    private cdr: ChangeDetectorRef,  // ← ADICIONAR
  ) {}

  ngOnInit(): void {
    this.authService.getMe().subscribe((me: any) => {
      this.restauranteId = me?.id || me?._id;
    });

    this.subs.push(
      // lista de chamados vindos do service
      this.suporteService.chamados$.subscribe((chamados) => {
        this.chamados = chamados;
        this.cdr.detectChanges();  // ← ADICIONAR
      }),

      // mensagens do cliente durante atendimento
      this.socketService.on('mensagem_cliente').subscribe((d: any) => {
        const chamado = this.chamados.find((c: Chamado) => c.userId === d.userId);
        if (!chamado) return;
        chamado.mensagens.push({
          texto: d.mensagem,
          hora: new Date(),
          deAtendente: false,
        });
        this.cdr.detectChanges();
        setTimeout(() => this.scrollBottom(), 50);
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  selecionarChamado(chamado: Chamado): void {
    this.chamadoAtivo = chamado;
    setTimeout(() => this.scrollBottom(), 50);
  }

  entrarAtendimento(): void {
    if (!this.chamadoAtivo) return;
    this.chamadoAtivo.status = 'em_atendimento';
    this.socketService.emit('entrar_atendimento', {
      userId: this.chamadoAtivo.userId,
      restauranteId: this.restauranteId,
    });
  }

  encerrarAtendimento(): void {
    if (!this.chamadoAtivo) return;
    this.socketService.emit('encerrar_atendimento', {
      userId: this.chamadoAtivo.userId,
      restauranteId: this.restauranteId,
    });
    this.chamadoAtivo.status = 'encerrado';
    this.chamadoAtivo = null;
  }

  enviarMensagem(): void {
    if (!this.mensagemDigitada.trim() || !this.chamadoAtivo) return;
    this.socketService.emit('mensagem_atendente', {
      userId: this.chamadoAtivo.userId,
      restauranteId: this.restauranteId,
      mensagem: this.mensagemDigitada,
    });
    this.chamadoAtivo.mensagens.push({
      texto: this.mensagemDigitada,
      hora: new Date(),
      deAtendente: true,
    });
    this.mensagemDigitada = '';
    setTimeout(() => this.scrollBottom(), 50);
  }

  private scrollBottom(): void {
    if (this.msgContainer) {
      this.msgContainer.nativeElement.scrollTop =
        this.msgContainer.nativeElement.scrollHeight;
    }
  }

  getStatusLabel(status: string): string {
    if (status === 'aguardando') return '🟡 Aguardando';
    if (status === 'em_atendimento') return '🟢 Em atendimento';
    return '⚫ Encerrado';
  }
}