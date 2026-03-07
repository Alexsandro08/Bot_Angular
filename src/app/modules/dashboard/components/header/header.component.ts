import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { SocketService } from '../../services/socket.service';
import { AuthService } from '../../../auth/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() paginaAtual = 'dashboard';
  @Output() paginaMudou = new EventEmitter<string>();

  botOnline = false;
  private subs: Subscription[] = [];

  constructor(
    private socketService: SocketService,
    private authService: AuthService
  ) {
    console.log('📋 HeaderComponent inicializado');
  }

  ngOnInit(): void {
    // Status do bot
    this.subs.push(
      this.socketService.on('ready').subscribe(() => {
        console.log('✅ Bot ONLINE');
        this.botOnline = true;
      })
    );

    this.subs.push(
      this.socketService.on('qr_loading').subscribe(() => {
        console.log('📱 Solicitando QR Code...');
        this.botOnline = false;
      })
    );

    this.subs.push(
      this.socketService.on('disconnected').subscribe(() => {
        console.log('❌ Bot OFFLINE');
        this.botOnline = false;
      })
    );
  }

  navegar(pagina: string): void {
    this.paginaMudou.emit(pagina);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}