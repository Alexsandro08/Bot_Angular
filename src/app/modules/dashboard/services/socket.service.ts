import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;

  constructor() {
    console.log('🔌 SocketService inicializado');
    this.socket = io('http://localhost:3000', {
      withCredentials: true,
      transports: ['websocket', 'polling'], // Força usar websocket
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket conectado! ID:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket desconectado');
    });

    this.socket.on('connect_error', (err) => {
      console.log('🚨 Erro na conexão:', err);
    });
  }

  on(event: string): Observable<any> {
    return new Observable((observer) => {
      this.socket.on(event, (data: any) => {
        console.log(`📨 Evento recebido [${event}]:`, data);
        observer.next(data);
      });
    });
  }

  emit(event: string, data?: any): void {
    console.log(`📤 Evento emitido [${event}]:`, data);
    this.socket.emit(event, data);
  }

  disconnect(): void {
    this.socket.disconnect();
  }
}
