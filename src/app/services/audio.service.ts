import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private ctx: AudioContext | null = null;
  private _somAtivo = true;

  inicializar(): void {
    if (this.ctx) return;
    this.ctx = new AudioContext();
  }

  toggleSom(valor: boolean): void {
    this._somAtivo = valor;
  }

  get somAtivo(): boolean {
    return this._somAtivo;
  }

  // Loja aberta
  lojaAberta(): void {
    if (!this._somAtivo) return;
    if (!this.ctx) this.inicializar();
    if (!this.ctx) return;
    // som ascendente positivo
    this.bip(523, 0.0, 0.12, 0.4); // Dó
    this.bip(659, 0.13, 0.12, 0.4); // Mi
    this.bip(784, 0.26, 0.2, 0.5); // Sol
  }

  // 🔔 Novo pedido — alerta tipo "ding dong" curto
  novoPedido(): void {
    if (!this.ctx || !this._somAtivo) return;
    this.bip(880, 0.0, 0.08, 0.4);
    this.bip(660, 0.1, 0.08, 0.3);
    this.bip(880, 0.22, 0.15, 0.5);
  }

  // 💰 Comprovante — moeda tipo PicPay
  comprovanteRecebido(): void {
    if (!this.ctx || !this._somAtivo) return;

    // ataque agudo metálico
    this.bip(2500, 0.0, 0.015, 0.5, 'triangle');
    // corpo do pling
    this.bip(1800, 0.01, 0.08, 0.4, 'sine');
    // ressonância suave
    this.bip(900, 0.04, 0.18, 0.2, 'sine');
    // eco final
    this.bip(1200, 0.1, 0.12, 0.1, 'sine');
}

  private bip(
    frequencia: number,
    inicioSeg: number,
    duracaoSeg: number,
    volume = 0.3,
    tipo: OscillatorType = 'sine',
  ): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = tipo;
    osc.frequency.setValueAtTime(frequencia, this.ctx.currentTime + inicioSeg);

    gain.gain.setValueAtTime(volume, this.ctx.currentTime + inicioSeg);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      this.ctx.currentTime + inicioSeg + duracaoSeg,
    );

    osc.start(this.ctx.currentTime + inicioSeg);
    osc.stop(this.ctx.currentTime + inicioSeg + duracaoSeg + 0.01);
  }
}
