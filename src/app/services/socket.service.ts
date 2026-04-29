import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });
  }

  identificar(restauranteId: number): void {
    this.socket.emit('identificar', restauranteId);
  }

  on(event: string): Observable<any> {
    return new Observable((observer) => {
      const handler = (data: any) => {
        observer.next(data);
      };
      // REMOVIDO: this.socket.off(event) ← apagava listeners de outros componentes
      this.socket.on(event, handler);
      return () => this.socket.off(event, handler);
    });
  }

  emit(event: string, data?: any): void {
    this.socket.emit(event, data);
  }

  disconnect(): void {
    this.socket.disconnect();
  }
}
