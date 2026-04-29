import {
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';

declare var Swal: any;

@Component({
  selector: 'app-image-cropper',
  standalone: false,
  templateUrl: './image-cropper.component.html',
  styleUrl: './image-cropper.component.scss',
})
export class ImageCropperComponent {
  @Output() logoAtualizada = new EventEmitter<string>();

  aberto = false;
  salvando = false;
  imagemParaCrop: string | null = null;

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private img = new Image();
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;
  private isDragging = false;
  private lastX = 0;
  private lastY = 0;

  constructor(private http: HttpClient) {}

  abrir(imagemBase64: string): void {
    this.imagemParaCrop = imagemBase64;
    this.aberto = true;
    setTimeout(() => this.iniciarCanvas(), 50);
  }

  fechar(): void {
    this.aberto = false;
    this.imagemParaCrop = null;
    this.salvando = false;
  }

  private iniciarCanvas(): void {
    this.canvas = document.getElementById('crop-canvas') as HTMLCanvasElement;
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
      this.img.height * this.scale,
    );
  }

  private bindEventos(): void {
    this.canvas.onmousedown = (e) => {
      this.isDragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    };
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
    this.canvas.ontouchstart = (e) => {
      this.lastX = e.touches[0].clientX;
      this.lastY = e.touches[0].clientY;
    };
    this.canvas.ontouchmove = (e) => {
      e.preventDefault();
      this.offsetX += e.touches[0].clientX - this.lastX;
      this.offsetY += e.touches[0].clientY - this.lastY;
      this.lastX = e.touches[0].clientX;
      this.lastY = e.touches[0].clientY;
      this.desenhar();
    };
  }

  confirmar(): void {
    this.salvando = true;
    this.canvas.toBlob((blob) => {
      if (!blob) return;
      const formData = new FormData();
      formData.append('logo', blob, 'logo.png');
      this.http
        .post<{ ok: boolean; url: string }>('/api/logo', formData)
        .subscribe({
          next: (res) => {
            if (res.ok) {
              this.logoAtualizada.emit(res.url);
              this.fechar();
              Swal.fire({
                title: 'Logo atualizada!',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
              });
            }
            this.salvando = false;
          },
          error: () => (this.salvando = false),
        });
    }, 'image/png');
  }
}