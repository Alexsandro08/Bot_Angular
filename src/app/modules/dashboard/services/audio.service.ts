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

  // 🔔 Novo pedido — alerta tipo "ding dong" curto
  novoPedido(): void {
    if (!this.ctx || !this._somAtivo) return;
    this.bip(880, 0.0,  0.08, 0.4);
    this.bip(660, 0.1,  0.08, 0.3);
    this.bip(880, 0.22, 0.15, 0.5);
  }

  // 💰 Comprovante — moeda tipo PicPay
  comprovanteRecebido(): void {
    if (!this.ctx || !this._somAtivo) return;
    // som metálico de moeda
    this.bip(1200, 0.0,  0.04, 0.6, 'triangle');
    this.bip(1600, 0.04, 0.04, 0.4, 'triangle');
    this.bip(1200, 0.08, 0.08, 0.3, 'triangle');
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