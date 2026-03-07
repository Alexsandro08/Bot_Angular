import { Component, OnInit, OnDestroy } from '@angular/core';
import { SocketService } from '../../services/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-qr-modal',
  standalone: false,
  templateUrl: './qr-modal.component.html',
  styleUrls: ['./qr-modal.component.scss']
})
export class QrModalComponent implements OnInit, OnDestroy {
  mostrar = false;
  qrUrl = '';
  carregando = true;
  conectado = false;
  private subs: Subscription[] = [];

  constructor(private socketService: SocketService) {
    console.log('📱 QrModalComponent inicializado');
  }

  ngOnInit(): void {
    // Inscrição para quando o servidor pedir para mostrar QR
    this.subs.push(
      this.socketService.on('qr_loading').subscribe(() => {
        console.log('📱 Evento qr_loading recebido');
        this.mostrar = true;
        this.carregando = true;
        this.qrUrl = '';
        this.conectado = false;
      })
    );

    // Quando o QR Code chegar
    this.subs.push(
      this.socketService.on('qr').subscribe((url: string) => {
        console.log('📱 QR Code recebido:', url.substring(0, 50) + '...');
        this.mostrar = true;
        this.carregando = false;
        this.conectado = false;
        
        // Verifica se é uma URL de imagem válida
        if (url.startsWith('data:image') || url.startsWith('http')) {
          this.qrUrl = url;
        } else {
          // Se não for imagem, usa API do QR Server
          this.qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;
        }
      })
    );

    // Quando o WhatsApp conectar
    this.subs.push(
      this.socketService.on('ready').subscribe(() => {
        console.log('📱 WhatsApp conectado!');
        this.conectado = true;
        this.carregando = false;
        
        // Fecha o modal após 2 segundos
        setTimeout(() => {
          this.mostrar = false;
          this.conectado = false;
        }, 2000);
      })
    );

    // Se desconectar
    this.subs.push(
      this.socketService.on('disconnected').subscribe(() => {
        console.log('📱 WhatsApp desconectado');
        this.mostrar = false;
      })
    );
  }

  fecharModal(): void {
    this.mostrar = false;
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}