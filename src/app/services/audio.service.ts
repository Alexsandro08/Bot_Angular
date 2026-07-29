import { Injectable } from '@angular/core';
import { Howl } from 'howler';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private _somAtivo = true;

  private sons = {
    novoPedido: new Howl({
      src: ['assets/sounds/novo_pedido.wav'],
      volume: 0.7,
    }),
    comprovante: new Howl({
      src: ['assets/sounds/comprovante.wav'],
      volume: 0.7,
    }),
    alerta: new Howl({ src: ['assets/sounds/alerta.wav'], volume: 0.7 }),
    lojaAberta: new Howl({
      src: ['assets/sounds/loja_aberta.wav'],
      volume: 0.7,
    }),
  };

  toggleSom(valor: boolean): void {
    this._somAtivo = valor;
  }

  get somAtivo(): boolean {
    return this._somAtivo;
  }

  inicializar(): void {}

  novoPedido(): void {
    if (!this._somAtivo) return;
    this.sons.novoPedido.once('end', () => {
      if (this._somAtivo) this.sons.novoPedido.play();
    });
    this.sons.novoPedido.play();
  }

  comprovanteRecebido(): void {
    if (!this._somAtivo) return;
    this.sons.comprovante.play();
  }

  pedidoSemConfirmacao(): void {
    if (!this._somAtivo) return;
    this.sons.alerta.play();
  }

  lojaAberta(): void {
    if (!this._somAtivo) return;
    this.sons.lojaAberta.play();
  }
}
