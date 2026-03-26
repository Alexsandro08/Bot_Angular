import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  HostListener,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import Cropper from 'cropperjs';
import { SocketService } from '../../services/socket.service';
import { AuthService } from '../../../auth/auth.service';
import { LojaService } from '../../services/loja.service';
import { AudioService } from '../../services/audio.service';

declare var Swal: any;

// ============================================================
// CONSTANTES
// ============================================================
const DIAS_SEMANA = [
  { label: 'Dom', valor: 'dom' },
  { label: 'Seg', valor: 'seg' },
  { label: 'Ter', valor: 'ter' },
  { label: 'Qua', valor: 'qua' },
  { label: 'Qui', valor: 'qui' },
  { label: 'Sex', valor: 'sex' },
  { label: 'Sáb', valor: 'sab' },
];

const MOTIVOS_FECHAMENTO = [
  { valor: 'estoque', emoji: '📦', label: 'Estoque esgotado' },
  { valor: 'imprevisto', emoji: '🙏', label: 'Imprevisto' },
  { valor: 'manutencao', emoji: '🔧', label: 'Manutenção' },
];

const MOTIVOS_AVISO = [
  { valor: 'folga', emoji: '🌴', label: 'Folga' },
  { valor: 'feriado', emoji: '🎉', label: 'Feriado' },
  { valor: 'limpar', emoji: '✅', label: 'Remover aviso ativo' },
];

const SWAL_BASE = {
  showCancelButton: true,
  cancelButtonText: 'Cancelar',
  background: '#252936',
  color: '#fff',
};

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit, OnDestroy {
  // ============================================================
  // INPUTS / OUTPUTS
  // ============================================================
  @Input() paginaAtual = 'dashboard';
  @Output() paginaMudou = new EventEmitter<string>();
  @ViewChild('cropperImg') cropperImg!: ElementRef<HTMLImageElement>;

  // ============================================================
  // ESTADO GERAL
  // ============================================================
  nomeRestaurante = '';
  botOnline = false;
  lojaAberta = false;
  horario: any = null;
  alertaFechamento = false;
  mostrarInfo = false;

  // ============================================================
  // MENUS
  // ============================================================
  menuAberto = false;
  configMenuAberto = false;

  // ============================================================
  // LOGO / CROP
  // ============================================================
  logoUrl: string | null = null;
  cropModalAberto = false;
  imagemParaCrop: string | null = null;
  salvandoLogo = false;

  private subs: Subscription[] = [];

  constructor(
    private socketService: SocketService,
    private authService: AuthService,
    private lojaService: LojaService,
    private http: HttpClient,
    private audioService: AudioService
  ) {}

  
  // Sons de notificação 
  get somAtivo(): boolean {
    return this.audioService.somAtivo;
  }

  toggleSom(): void {
    this.audioService.inicializar();
    this.audioService.toggleSom(!this.audioService.somAtivo);
  }

  // ============================================================
  // LIFECYCLE
  // ============================================================
  ngOnInit(): void {
    this.authService.getMe().subscribe((res: any) => {
      if (res?.nome) this.nomeRestaurante = res.nome;
    });

    this.carregarLogo();

    this.subs.push(
      this.socketService.on('ready').subscribe(() => (this.botOnline = true)),
      this.socketService
        .on('qr_loading')
        .subscribe(() => (this.botOnline = false)),
      this.socketService
        .on('disconnected')
        .subscribe(() => (this.botOnline = false)),
      this.lojaService.aberta$.subscribe((a) => (this.lojaAberta = a)),
      this.lojaService.horario$.subscribe((h) => (this.horario = h)),
      this.lojaService.alertaAmarelo$.subscribe(
        (a) => (this.alertaFechamento = a),
      ),
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  // ============================================================
  // NAVEGAÇÃO
  // ============================================================
  navegar(pagina: string): void {
    this.paginaMudou.emit(pagina);
  }

  toggleMenu(): void {
    this.menuAberto = !this.menuAberto;
  }
  fecharMenu(): void {
    this.menuAberto = false;
  }
  toggleConfigMenu(): void {
    this.configMenuAberto = !this.configMenuAberto;
  }
  fecharConfigMenu(): void {
    this.configMenuAberto = false;
  }
  toggleAvatarInfo(): void {
    this.mostrarInfo = !this.mostrarInfo;
  }

  @HostListener('document:click', ['$event'])
  clickFora(event: Event): void {
    const el = event.target as HTMLElement;
    if (!el.closest('.config-wrapper')) this.configMenuAberto = false;
    if (!el.closest('.avatar-bot')) this.mostrarInfo = false;
  }

  // ============================================================
  // LOGO
  // ============================================================
  carregarLogo(): void {
    this.http.get<{ url: string | null }>('/api/logo').subscribe((res) => {
      this.logoUrl = res.url;
    });
  }

// novas propriedades
canvasRef!: ElementRef<HTMLCanvasElement>;
private img = new Image();
private scale = 1;
private offsetX = 0;
private offsetY = 0;
private isDragging = false;
private lastX = 0;
private lastY = 0;
private canvas!: HTMLCanvasElement;
private ctx!: CanvasRenderingContext2D;

uploadLogo(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    this.imagemParaCrop = e.target?.result as string;
    this.cropModalAberto = true;
    setTimeout(() => this.iniciarCanvas(), 50);
  };
  reader.readAsDataURL(file);
  (event.target as HTMLInputElement).value = '';
}

private iniciarCanvas(): void {
  this.canvas = document.getElementById('crop-canvas') as HTMLCanvasElement;
  
  // ajusta o canvas ao container
  const container = this.canvas.parentElement!;
  const size = container.offsetWidth;
  this.canvas.width = size;
  this.canvas.height = size;
  
  this.ctx = this.canvas.getContext('2d')!;

  this.img.onload = () => {
    const scaleX = size / this.img.width;
    const scaleY = size / this.img.height;
    this.scale = Math.max(scaleX, scaleY);
    this.offsetX = (size - this.img.width * this.scale) / 2;
    this.offsetY = (size - this.img.height * this.scale) / 2;
    this.desenhar();
    this.bindEventos();
  };
  this.img.src = this.imagemParaCrop!;
}

private desenhar(): void {
  const size = this.canvas.width;
  this.ctx.fillStyle = '#151929';
  this.ctx.fillRect(0, 0, size, size);
  this.ctx.drawImage(
    this.img,
    this.offsetX,
    this.offsetY,
    this.img.width * this.scale,
    this.img.height * this.scale
  );
}

private bindEventos(): void {
  this.canvas.onmousedown = (e) => { this.isDragging = true; this.lastX = e.clientX; this.lastY = e.clientY; };
  this.canvas.onmousemove = (e) => {
    if (!this.isDragging) return;
    this.offsetX += e.clientX - this.lastX;
    this.offsetY += e.clientY - this.lastY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.desenhar();
  };
  this.canvas.onmouseup = () => (this.isDragging = false);
  this.canvas.onwheel = (e) => {
    e.preventDefault();
    this.scale *= e.deltaY < 0 ? 1.1 : 0.9;
    this.desenhar();
  };

  // touch
  this.canvas.ontouchstart = (e) => { this.lastX = e.touches[0].clientX; this.lastY = e.touches[0].clientY; };
  this.canvas.ontouchmove = (e) => {
    e.preventDefault();
    this.offsetX += e.touches[0].clientX - this.lastX;
    this.offsetY += e.touches[0].clientY - this.lastY;
    this.lastX = e.touches[0].clientX;
    this.lastY = e.touches[0].clientY;
    this.desenhar();
  };
}

confirmarCrop(): void {
  this.salvandoLogo = true;
  this.canvas.toBlob((blob) => {
    if (!blob) return;
    const formData = new FormData();
    formData.append('logo', blob, 'logo.png');
    this.http.post<{ ok: boolean; url: string }>('/api/logo', formData).subscribe((res) => {
      if (res.ok) {
        this.logoUrl = res.url;
        this.fecharCrop();
        Swal.fire({ title: 'Logo atualizada!', icon: 'success', timer: 1500, showConfirmButton: false });
      }
      this.salvandoLogo = false;
    });
  }, 'image/png');
}

fecharCrop(): void {
  this.cropModalAberto = false;
  this.imagemParaCrop = null;
  this.salvandoLogo = false;
}
  // ============================================================
  // LOJA
  // ============================================================
  toggleLoja(): void {
    if (this.lojaAberta) {
      this.abrirSwalMotivos(
        'Fechar a loja?',
        'Selecione o motivo do fechamento:',
        MOTIVOS_FECHAMENTO,
        (motivo) => {
          this.http.post('/api/loja/motivo', { motivo }).subscribe();
          this.lojaService.fecharLoja();
        },
      );
    } else {
      this.lojaService.abrirLoja();
    }
  }

  abrirMotivoFechamento(): void {
    this.abrirSwalMotivos(
      'Aviso de fechamento',
      'Selecione o motivo — o bot avisará os clientes automaticamente.',
      MOTIVOS_AVISO,
      (motivo) => {
        if (motivo === 'limpar') {
          this.http.delete('/api/loja/motivo').subscribe();
        } else {
          this.http.post('/api/loja/motivo', { motivo }).subscribe();
        }
      },
    );
  }

  private abrirSwalMotivos(
    titulo: string,
    descricao: string,
    motivos: typeof MOTIVOS_FECHAMENTO,
    callback: (motivo: string) => void,
  ): void {
    const botoesHtml = motivos
      .map(
        (m) => `
      <button type="button" id="motivo-${m.valor}" style="
        width:100%; padding:12px 16px; border-radius:10px; font-size:14px;
        font-weight:600; cursor:pointer; border:1px solid #363b4a;
        background:#1b1e29; color:#8892a4; text-align:left;
        display:flex; align-items:center; gap:10px; margin-bottom:8px;
      ">${m.emoji} ${m.label}</button>
    `,
      )
      .join('');

    Swal.fire({
      title: titulo,
      html: `<p style="color:#8892a4; font-size:13px; margin-bottom:16px;">${descricao}</p>${botoesHtml}`,
      showConfirmButton: false,
      ...SWAL_BASE,
      didOpen: () => {
        motivos.forEach((m) => {
          const btn = document.getElementById(`motivo-${m.valor}`);
          btn?.addEventListener('click', (e) => {
            e.stopPropagation();
            setTimeout(() => {
              Swal.close();
              callback(m.valor);
            }, 300);
          });
        });
      },
    });
  }

  // ============================================================
  // HORÁRIO
  // ============================================================
  editarHorario(): void {
    const h = this.lojaService.horario;

    const diasHtml = DIAS_SEMANA.map((d) => {
      const ativo =
        h?.dias?.includes(d.valor) ??
        ['seg', 'ter', 'qua', 'qui', 'sex'].includes(d.valor);
      return `
        <button type="button" id="dia-${d.valor}" style="
          padding:8px 10px; border-radius:8px; font-size:12px; font-weight:600;
          cursor:pointer; border:1px solid ${ativo ? '#4f8cff' : '#363b4a'};
          background:${ativo ? 'rgba(79,140,255,0.15)' : '#1b1e29'};
          color:${ativo ? '#4f8cff' : '#888'}; flex:1;
        " class="${ativo ? 'dia-ativo' : ''}">${d.label}</button>
      `;
    }).join('');

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
        <div style="margin-top:16px;">
          <label style="font-size:12px; color:#888; display:block; margin-bottom:10px; text-align:left;">Dias de funcionamento</label>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">${diasHtml}</div>
        </div>
      `,
      confirmButtonText: 'Salvar',
      confirmButtonColor: '#4f8cff',
      ...SWAL_BASE,
      didOpen: () => {
        DIAS_SEMANA.forEach((d) => {
          const btn = document.getElementById(`dia-${d.valor}`);
          btn?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const ativo = btn.classList.contains('dia-ativo');
            btn.classList.toggle('dia-ativo');
            btn.style.border = ativo
              ? '1px solid #363b4a'
              : '1px solid #4f8cff';
            btn.style.background = ativo ? '#1b1e29' : 'rgba(79,140,255,0.15)';
            btn.style.color = ativo ? '#888' : '#4f8cff';
          });
        });
      },
      preConfirm: () => {
        const abertura = (
          document.getElementById('swal-abertura') as HTMLInputElement
        ).value;
        const fechamento = (
          document.getElementById('swal-fechamento') as HTMLInputElement
        ).value;
        const dias = DIAS_SEMANA.filter((d) =>
          document
            .getElementById(`dia-${d.valor}`)
            ?.classList.contains('dia-ativo'),
        ).map((d) => d.valor);

        if (!abertura || !fechamento) {
          Swal.showValidationMessage('Preencha os dois horários!');
          return false;
        }
        if (!dias.length) {
          Swal.showValidationMessage('Selecione pelo menos um dia!');
          return false;
        }
        return { abertura, fechamento, dias };
      },
    }).then((r: any) => {
      if (r.isConfirmed) {
        this.lojaService.definirHorario(r.value);
        Swal.fire({
          title: 'Horário atualizado!',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  }
}
