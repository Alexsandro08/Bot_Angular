import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { SocketService } from './services/socket.service';
import { PedidosService } from './services/pedidos.service';
import { LojaService } from './services/loja.service';
import { NotificationsService } from './services/notifications.service';
import {
  RelatoriosService,
  RelatorioPayload,
} from './services/relatorios.service';
import { AuthService } from '../auth/auth.service';
import { AudioService } from './services/audio.service';

// ============================================================
// CONSTANTES
// ============================================================
const INTERVALO_CHECAGEM_MS = 10_000;
const DELAY_DESLOGAR_MS = 4_000;
const MINUTOS_AVISO_EXPIRACAO = 10;

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  // ============================================================
  // ESTADO
  // ============================================================
  paginaAtual = 'dashboard';
  mostrarOnboarding = false;
  mostrarSaindo = false;

  private saindo = false;
  private jaAvisouExpiracao = false;
  private subs: Subscription[] = [];

  constructor(
    private socketService: SocketService,
    private pedidosService: PedidosService,
    private lojaService: LojaService,
    private notificationsService: NotificationsService,
    private authService: AuthService,
    private relatoriosService: RelatoriosService,
    private cdr: ChangeDetectorRef,
    private audioService: AudioService,
  ) {}

  // ============================================================
  // LIFECYCLE
  // ============================================================
  ngOnInit(): void {
    console.log('🚀 DashboardComponent ngOnInit chamado');
    this.verificarOnboarding();
    this.identificarSocket();
    this.inscreverEventos();
    this.verificarExpiracao();
    this.iniciarChecagemSessao();

    document.addEventListener('click', () => this.audioService.inicializar(), {
      once: true,
    });

    this.lojaService.salvarRelatorio$.subscribe(() => {
      const payload = this.relatoriosService.montarPayload(
        this.pedidosService.getHistorico(),
      );
      if (payload.total_pedidos > 0) {
        this.relatoriosService.salvar(payload).subscribe();
      }
    });

    this.socketService.on('novo_pedido').subscribe((p) => {
      console.log('pedido recebido completo:', p);
      console.log('observacao:', p.observacao);
      if (!this.lojaService.aberta) return;
      this.pedidosService.adicionarPedido(p);
      this.notificationsService.adicionar(
        'pedido',
        'Novo Pedido',
        `${p.numPedido} - ${p.nome}`,
      );
      this.audioService.novoPedido();
    });

    this.socketService.on('novo_comprovante').subscribe((d) => {
      this.pedidosService.adicionarComprovante(d.numPedido, d.imagem);
      this.notificationsService.adicionar(
        'pagamento',
        'Comprovante Recebido',
        `Pedido${d.numPedido} aguardando validação`,
      );
      this.audioService.comprovanteRecebido();
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  // ============================================================
  // NAVEGAÇÃO
  // ============================================================
  trocarPagina(pagina: string): void {
    this.paginaAtual = pagina;
  }
  onOnboardingConcluido(): void {
    this.mostrarOnboarding = false;
  }

  // ============================================================
  // INICIALIZAÇÃO
  // ============================================================
  private verificarOnboarding(): void {
    if (!this.lojaService.horarioDefinido) this.mostrarOnboarding = true;
  }

  private identificarSocket(): void {
    this.authService.getMe().subscribe((me: any) => {
      if (me?.id) this.socketService.identificar(me.id);
    });
  }

  private iniciarChecagemSessao(): void {
    setInterval(() => {
      this.authService.getMe().subscribe({ error: () => this.deslogar() });
    }, INTERVALO_CHECAGEM_MS);
  }

  // ============================================================
  // EVENTOS SOCKET / LOJA
  // ============================================================
  private inscreverEventos(): void {
    this.subs.push(
      // novo pedido
      this.socketService.on('novo_pedido').subscribe((p) => {
        if (!this.lojaService.aberta) return;
        this.pedidosService.adicionarPedido(p);
        this.notificationsService.adicionar(
          'pedido',
          'Novo Pedido',
          `#${p.numPedido} - ${p.nome}`,
        );
      }),

      // comprovante pix
      this.socketService.on('novo_comprovante').subscribe((d) => {
        this.pedidosService.adicionarComprovante(d.numPedido, d.imagem);
        this.notificationsService.adicionar(
          'pagamento',
          'Comprovante Recebido',
          `Pedido #${d.numPedido} aguardando validação`,
        );
      }),

      // aviso fechamento
      this.lojaService.aviso5min$.subscribe((aviso) => {
        if (!aviso) return;
        this.notificationsService.adicionar(
          'alerta',
          'Atenção!',
          'Sua loja fecha em 1 minuto!',
        );
        this.mostrarToast(
          '⚠️ Atenção!',
          'Sua loja fecha em 1 minuto!',
          'warning',
        );
      }),

      // status loja
      this.lojaService.aberta$.subscribe((aberta) => {
        this.notificationsService.adicionar(
          'loja',
          aberta ? 'Loja Aberta' : 'Loja Fechada',
          aberta ? 'Pronto para receber pedidos!' : 'O painel foi resetado.',
        );
      }),
    );
  }

  // ============================================================
  // EXPIRAÇÃO
  // ============================================================
  private verificarExpiracao(): void {
    const checar = () => {
      this.authService.getMe().subscribe({
        next: (me: any) => {
          if (!me?.expira_em) return;
          const minutosRestantes = Math.ceil(
            (new Date(me.expira_em).getTime() - Date.now()) / 60_000,
          );
          if (
            minutosRestantes <= MINUTOS_AVISO_EXPIRACAO &&
            minutosRestantes > 0 &&
            !this.jaAvisouExpiracao
          ) {
            this.jaAvisouExpiracao = true;
            this.notificationsService.adicionar(
              'alerta',
              '⚠️ Assinatura expirando!',
              `Expira em ${minutosRestantes} minuto(s).`,
            );
            this.mostrarToast(
              '⚠️ Atenção!',
              `Sua assinatura expira em ${minutosRestantes} minuto(s)!`,
              'warning',
            );
          }
        },
        error: () => this.deslogar(),
      });
    };

    checar();
    setInterval(checar, INTERVALO_CHECAGEM_MS);
  }

  // ============================================================
  // UTILITÁRIOS
  // ============================================================
  private deslogar(): void {
    if (this.saindo) return;
    this.saindo = true;
    this.mostrarSaindo = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      sessionStorage.removeItem('logado');
      window.location.href = '/login';
    }, DELAY_DESLOGAR_MS);
  }

  private mostrarToast(title: string, text: string, icon: any): void {
    Swal.fire({
      title,
      text,
      icon,
      toast: true,
      position: 'top-end',
      timer: 8000,
      timerProgressBar: true,
      showConfirmButton: false,
    });
  }
}
