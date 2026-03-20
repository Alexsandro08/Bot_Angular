import { Component, OnInit, OnDestroy } from '@angular/core';
import { SocketService } from '../../services/socket.service';
import { AuthService } from '../../../auth/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-qr-modal',
  standalone: false,
  templateUrl: './qr-modal.component.html',
  styleUrls: ['./qr-modal.component.scss'],
})
export class QrModalComponent implements OnInit, OnDestroy {
  mostrar = false;
  qrUrl = '';
  carregando = true;
  conectado = false;
  private subs: Subscription[] = [];

  constructor(
    private socketService: SocketService,
  ) {
    console.log('📱 QrModalComponent inicializado');
  }

  ngOnInit(): void {
    this.subs.push(
      this.socketService.on('qr_loading').subscribe(() => {
        this.mostrar = true;
        this.carregando = true;
        this.qrUrl = '';
        this.conectado = false;
      }),

      this.socketService.on('qr').subscribe((url: string) => {
        this.mostrar = true;
        this.carregando = false;
        this.conectado = false;
        if (url.startsWith('data:image') || url.startsWith('http')) {
          this.qrUrl = url;
        } else {
          this.qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;
        }
      }),

      this.socketService.on('ready').subscribe(() => {
        console.log('📱 WhatsApp conectado!');
        this.conectado = true;
        this.carregando = false;
        setTimeout(() => {
          this.mostrar = false;
          this.conectado = false;
        }, 2000);
      }),

      this.socketService.on('disconnected').subscribe(() => {
        this.mostrar = false;
      }),
    );
  }

  fecharModal(): void {
    this.mostrar = false;
  }
  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
