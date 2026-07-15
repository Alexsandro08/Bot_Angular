import { Component, OnInit } from '@angular/core';
import {
  AvaliacoesService,
  Avaliacao,
  ResumoAvaliacoes,
} from '../../../../services/avaliacoes.service';
import { TourService } from '../../../../services/tour.service';
@Component({
  selector: 'app-avaliacoes',
  standalone: false,
  templateUrl: './avaliacoes.component.html',
  styleUrl: './avaliacoes.component.scss',
})
export class AvaliacoesComponent implements OnInit {
  avaliacoes: Avaliacao[] = [];
  resumo: ResumoAvaliacoes | null = null;
  filtroTipo: string = '';
  carregando = true;
  Math: any;

  constructor(
    private avaliacoesService: AvaliacoesService,
    private tourService: TourService,
  ) {}

  ngOnInit(): void {
    this.carregarResumo();
    this.carregarAvaliacoes();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.tourService.verificarEIniciar('avaliacoes'), 800);
  }

  carregarResumo(): void {
    this.avaliacoesService.resumo().subscribe({
      next: (r) => (this.resumo = r),
      error: () => {},
    });
  }

  carregarAvaliacoes(): void {
    this.carregando = true;
    this.avaliacoesService.listar(this.filtroTipo || undefined).subscribe({
      next: (data) => {
        this.avaliacoes = data;
        this.carregando = false;
      },
      error: () => (this.carregando = false),
    });
  }

  arredondar(n: number): number {
    return Math.round(n);
  }

  filtrar(tipo: string): void {
    this.filtroTipo = tipo;
    this.carregarAvaliacoes();
  }

  renderStars(nota: number): string {
    return '⭐'.repeat(nota) + '☆'.repeat(5 - nota);
  }

  getLabelTipo(tipo: string): string {
    return tipo === 'humano' ? '👨‍💼 Atendente' : '🤖 Bot';
  }
}
