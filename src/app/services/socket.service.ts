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
      transports: ['websocket', 'polling'],
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

  identificar(restauranteId: number): void {
    this.socket.emit('identificar', restauranteId);
    console.log(`🏠 Identificado como restaurante ${restauranteId}`);
  }

  on(event: string): Observable<any> {
    return new Observable((observer) => {
      const handler = (data: any) => {
        console.log(`📨 Evento recebido [${event}]:`, data);
        observer.next(data);
      };
      // REMOVIDO: this.socket.off(event) ← apagava listeners de outros componentes
      this.socket.on(event, handler);
      return () => this.socket.off(event, handler);
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
