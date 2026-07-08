import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { SocketService } from '../../services/socket.service';
import { PedidosService } from '../../services/pedidos.service';
import { LojaService } from '../../services/loja.service';
import { NotificationsService } from '../../services/notifications.service';
import { RelatoriosService } from '../../services/relatorios.service';
import { AuthService } from '../../services/auth.service';
import { AudioService } from '../../services/audio.service';
import { SuporteService } from '../../services/suporte.service';
import { TourService } from '../../services/tour.service';

// ============================================================
// CONSTANTES
// ============================================================
const INTERVALO_CHECAGEM_MS = 5 * 60 * 1000;
const DELAY_DESLOGAR_MS = 4_000;
const MINUTOS_AVISO_EXPIRACAO = 10;

declare var particlesJS: any;

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

  @ViewChild('vantaRef', { static: true }) vantaRef!: ElementRef;

  private vantaEffect: any;
  private saindo = false;
  private jaAvisouExpiracao = false;
  private subs: Subscription[] = [];
  private _ultimoEstadoLoja: boolean | null = null;

  constructor(
    private socketService: SocketService,
    private pedidosService: PedidosService,
    private lojaService: LojaService,
    private notificationsService: NotificationsService,
    private authService: AuthService,
    private relatoriosService: RelatoriosService,
    private cdr: ChangeDetectorRef,
    private audioService: AudioService,
    private suporteService: SuporteService,
    private tourService: TourService,
  ) {}

  // ============================================================
  // LIFECYCLE
  // ============================================================

  ngAfterViewInit(): void {
    setTimeout(() => this.tourService.verificarEIniciar('dashboard'), 800);
  }

  ngOnInit(): void {
    this.identificarSocket();
    this.inscreverEventos();
    this.verificarExpiracao();
    this.iniciarChecagemSessao();

    // no ngOnInit, após o código atual:
    particlesJS('particles-js', {
      particles: {
        number: { value: 60, density: { enable: true, value_area: 800 } },
        color: { value: '#4f8cff' },
        shape: { type: 'circle' },
        opacity: { value: 0.15, random: true },
        size: { value: 3, random: true },
        line_linked: {
          enable: true,
          distance: 150,
          color: '#4f8cff',
          opacity: 0.08,
          width: 1,
        },
        move: {
          enable: true,
          speed: 1.2,
          direction: 'none',
          random: true,
          out_mode: 'out',
        },
      },
      interactivity: {
        detect_on: 'canvas',
        events: {
          onhover: { enable: false, mode: 'repulse' },
          resize: true,
        },
        modes: {
          repulse: { distance: 80, duration: 0.4 },
        },
      },
      retina_detect: true,
    });

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
  }

  private intervalSessao: any;
  private intervalExpiracao: any;

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    if (this.vantaEffect) this.vantaEffect.destroy();
    clearInterval(this.intervalSessao);
    clearInterval(this.intervalExpiracao);
  }

  // ============================================================
  // TOUR GUIADO
  // ============================================================

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

  carregando = true;

  private identificarSocket(): void {
    this.authService.getMe().subscribe((me: any) => {
      const id = me?.id || me?._id;
      if (id) {
        this.socketService.identificar(id);
        this.lojaService.inicializarComDados(me).then(() => {
          this.mostrarOnboarding = !this.lojaService.horarioDefinido;
          this.carregando = false;
          this.cdr.detectChanges();

          const primeiroAcesso = !sessionStorage.getItem('dashboard_iniciado');
          this._ultimoEstadoLoja = primeiroAcesso
            ? null
            : this.lojaService.aberta;
          sessionStorage.setItem('dashboard_iniciado', '1');

          this.subs.push(
            this.lojaService.aberta$.subscribe((aberta) => {
              if (aberta === this._ultimoEstadoLoja) return;
              this._ultimoEstadoLoja = aberta;
              this.notificationsService.adicionar(
                'loja',
                aberta ? 'Loja Aberta' : 'Loja Fechada',
                aberta
                  ? 'Pronto para receber pedidos!'
                  : 'O painel foi resetado.',
              );
              if (aberta) {
                Swal.fire({
                  toast: true,
                  position: 'top-end',
                  icon: 'success',
                  title: '🟢 Loja Aberta!',
                  text: 'Sua loja está pronta para receber pedidos. Bom Trabalho!',
                  timer: 6000,
                  timerProgressBar: true,
                  showConfirmButton: false,
                });
                this.audioService.lojaAberta();
              }
            }),
          );
        });
      }
    });
  }

  private iniciarChecagemSessao(): void {
    this.intervalSessao = setInterval(() => {
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
        this.audioService.novoPedido();

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'info',
          title: '🛍️ Novo Pedido!',
          text: `#${p.numPedido} - ${p.nome}`,
          showConfirmButton: true,
          confirmButtonText: 'Ver pedido',
          confirmButtonColor: '#4f8cff',
          timer: 10000,
          timerProgressBar: true,
        }).then((result) => {
          if (result.isConfirmed) {
            this.trocarPagina('dashboard');
          }
        });
      }),

      this.socketService.on('pedido_timeout').subscribe((d: any) => {
        console.log('🔴 [pedido_timeout] recebido:', d);
        this.pedidosService.cancelarPedido(d.numPedido, 'cancelado_timeout');
      }),

      this.socketService.on('chamar_atendente').subscribe((d) => {
        this.suporteService.adicionarChamado(d);
        this.notificationsService.adicionar(
          'alerta',
          '👨‍💼 Cliente quer falar com atendente',
          `${d.nome} — ${d.motivo}`,
        );
        this.audioService.novoPedido();

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'info',
          title: '👨‍💼 Cliente aguardando!',
          text: `${d.nome} — ${d.motivo}`,
          showConfirmButton: true,
          confirmButtonText: 'Ver chamado',
          confirmButtonColor: '#4f8cff',
          timer: 10000,
          timerProgressBar: true,
        }).then((result) => {
          if (result.isConfirmed) {
            this.trocarPagina('suporte');
          }
        });
      }),

      // comprovante pix
      this.socketService.on('novo_comprovante').subscribe((d) => {
        this.pedidosService.adicionarComprovante(d.numPedido, d.imagem);
        this.notificationsService.adicionar(
          'pagamento',
          'Comprovante Recebido',
          `Pedido #${d.numPedido} aguardando validação`,
        );
        this.audioService.comprovanteRecebido();

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: '💰 Comprovante Recebido!',
          text: `Pedido #${d.numPedido} aguardando validação.`,
          timer: 8000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      }),

      // aviso fechamento
      this.lojaService.aviso10min$.subscribe((aviso) => {
        if (!aviso) return;
        this.notificationsService.adicionar(
          'alerta',
          'Atenção!',
          'Sua loja fecha em 10 minutos!',
        );
        this.mostrarToast(
          '⚠️ Atenção!',
          'Sua loja fecha em 10 minutos!',
          'warning',
        );
      }),

      this.lojaService.aviso5min$.subscribe((aviso) => {
        if (!aviso) return;
        this.notificationsService.adicionar(
          'alerta',
          'Atenção!',
          'Sua loja fecha em 5 minutos!',
        );
        this.mostrarToast(
          '⚠️ Atenção!',
          'Sua loja fecha em 5 minutos!',
          'warning',
        );
      }),

      this.lojaService.aviso1min$.subscribe((aviso) => {
        if (!aviso) return;
        this.notificationsService.adicionar(
          'alerta',
          '🚨 Fechando!',
          'Sua loja fecha em 1 minuto!',
        );
        this.mostrarToast(
          '🚨 Fechando!',
          'Sua loja fecha em 1 minuto!',
          'error',
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
    this.intervalExpiracao = setInterval(checar, INTERVALO_CHECAGEM_MS); // ← troca essa linha
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
      sessionStorage.removeItem('dashboard_iniciado'); // ← ADICIONA
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
