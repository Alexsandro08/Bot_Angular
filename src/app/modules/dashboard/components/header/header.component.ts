import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { SocketService } from '../../services/socket.service';
import { AuthService } from '../../../auth/auth.service';
import { LojaService } from '../../services/loja.service';
import { Subscription } from 'rxjs';

declare var Swal: any;

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() paginaAtual = 'dashboard';
  @Output() paginaMudou = new EventEmitter<string>();

  botOnline = false;
  lojaAberta = false;
  horario: any = null;
  alertaFechamento = false;
  private subs: Subscription[] = [];

  mostrarInfo = false;
  piscando = false;


toggleAvatarInfo(): void {
  this.mostrarInfo = !this.mostrarInfo;
  this.piscando = true;
  setTimeout(() => this.piscando = false, 800);
}

  constructor(
    private socketService: SocketService,
    private authService: AuthService,
    private lojaService: LojaService
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.socketService.on('ready').subscribe(() => this.botOnline = true),
      this.socketService.on('qr_loading').subscribe(() => this.botOnline = false),
      this.socketService.on('disconnected').subscribe(() => this.botOnline = false),
      this.lojaService.aberta$.subscribe(a => this.lojaAberta = a),
      this.lojaService.horario$.subscribe(h => this.horario = h),
      this.lojaService.alertaAmarelo$.subscribe(a => this.alertaFechamento = a)
    );
  }

  navegar(pagina: string): void { this.paginaMudou.emit(pagina); }

  toggleLoja(): void {
    if (this.lojaAberta) {
      Swal.fire({
        title: 'Fechar a loja?',
        text: 'Pedidos pendentes serão removidos do painel.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, fechar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ff4757'
      }).then((r: any) => {
        if (r.isConfirmed) this.lojaService.fecharLoja();
      });
    } else {
      this.lojaService.abrirLoja();
    }
  }

  editarHorario(): void {
  const h = this.lojaService.horario;
  Swal.fire({
    title: 'Editar Horário',
    html: `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:10px;">
        <div>
          <label style="font-size:12px; color:#888; display:block; margin-bottom:6px;">Abertura</label>
          <input id="swal-abertura" type="time" value="${h?.abertura || '08:00'}" 
            style="width:100%; padding:10px; border-radius:8px; border:1px solid #363b4a; background:#1b1e29; color:white; font-size:16px; text-align:center;">
        </div>
        <div>
          <label style="font-size:12px; color:#888; display:block; margin-bottom:6px;">Fechamento</label>
          <input id="swal-fechamento" type="time" value="${h?.fechamento || '22:00'}"
            style="width:100%; padding:10px; border-radius:8px; border:1px solid #363b4a; background:#1b1e29; color:white; font-size:16px; text-align:center;">
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Salvar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#4f8cff',
    background: '#252936',
    color: '#fff',
    preConfirm: () => {
      const abertura = (document.getElementById('swal-abertura') as HTMLInputElement).value;
      const fechamento = (document.getElementById('swal-fechamento') as HTMLInputElement).value;
      if (!abertura || !fechamento) {
        Swal.showValidationMessage('Preencha os dois horários!');
        return false;
      }
      return { abertura, fechamento };
    }
  }).then((r: any) => {
    if (r.isConfirmed) {
      this.lojaService.definirHorario(r.value);
      Swal.fire({ title: 'Horário atualizado!', icon: 'success', timer: 1500, showConfirmButton: false });
    }
  });
}

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }
}