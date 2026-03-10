import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { SocketService } from './services/socket.service';
import { PedidosService } from './services/pedidos.service';
import { LojaService } from './services/loja.service';
import { NotificationsService } from './services/notifications.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
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
    private cdr: ChangeDetectorRef
  ) {}

  verificarExpiracao(): void {
  const checar = () => {
    this.authService.getMe().subscribe({
      next: (me: any) => {
        console.log('getMe retornou:', me);
        if (!me?.expira_em) return;
        const expira = new Date(me.expira_em);
        const agora = new Date();
        const minutosRestantes = Math.ceil((expira.getTime() - agora.getTime()) / (1000 * 60));
        console.log('Minutos restantes:', minutosRestantes);

        if (minutosRestantes <= 10 && minutosRestantes > 0 && !this.jaAvisouExpiracao) {
          this.jaAvisouExpiracao = true;
          this.notificationsService.adicionar(
            'alerta',
            '⚠️ Assinatura expirando!',
            `Sua assinatura expira em ${minutosRestantes} minuto(s). Renove para continuar.`
          );
          Swal.fire({
            title: '⚠️ Atenção!',
            text: `Sua assinatura expira em ${minutosRestantes} minuto(s)!`,
            icon: 'warning',
            toast: true,
            position: 'top-end',
            timer: 8000,
            timerProgressBar: true,
            showConfirmButton: false
          });
        }
      },
      error: (err: any) => {
        this.mostrarSaindo = true;
        this.cdr.detectChanges();
        setTimeout(() => {
          sessionStorage.removeItem('logado');
          window.location.href = '/login';
        }, 4000);
  }
    });
  };

  checar();
  setInterval(checar, 10000); // era 60000
}


  private deslogar(): void {
  if (this.saindo) return;
  this.saindo = true;
  this.mostrarSaindo = true;
  this.cdr.detectChanges();
  setTimeout(() => {
    sessionStorage.removeItem('logado');
    window.location.href = '/login';
  }, 4000);
}

  ngOnInit(): void {
    if (!this.lojaService.horarioDefinido) {
      this.mostrarOnboarding = true;
    }

    this.verificarExpiracao();

   setInterval(() => {
    this.authService.getMe().subscribe({
    error: () => {
      this.deslogar();
    }
  });
}, 10000);

    this.subs.push(
      this.socketService.on('novo_pedido').subscribe(p => {
        if (this.lojaService.aberta) {
          this.pedidosService.adicionarPedido(p);
          this.notificationsService.adicionar('pedido', 'Novo Pedido', `#${p.numPedido} - ${p.nome}`);
        }
      }),
      this.socketService.on('novo_comprovante').subscribe(d => {
        this.pedidosService.adicionarComprovante(d.numPedido, d.imagem);
        this.notificationsService.adicionar('pagamento', 'Comprovante Recebido', `Pedido #${d.numPedido} aguardando validação`);
      }),
      this.lojaService.aviso5min$.subscribe(aviso => {
        if (aviso) {
          this.notificationsService.adicionar('alerta', 'Atenção!', 'Sua loja fecha em 1 minuto!');
          Swal.fire({
            title: '⚠️ Atenção!',
            text: 'Sua loja fecha em 1 minuto!',
            icon: 'warning',
            timer: 8000,
            timerProgressBar: true,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
        }
      }),
      this.lojaService.aberta$.subscribe(aberta => {
        if (!aberta) {
          this.notificationsService.adicionar('loja', 'Loja Fechada', 'O painel foi resetado.');
        } else {
          this.notificationsService.adicionar('loja', 'Loja Aberta', 'Pronto para receber pedidos!');
        }
      })
    );
  }

  trocarPagina(pagina: string): void { this.paginaAtual = pagina; }
  onOnboardingConcluido(): void { this.mostrarOnboarding = false; }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }
}