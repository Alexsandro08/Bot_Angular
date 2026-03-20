import { Component, Output, EventEmitter } from '@angular/core';
import { LojaService, HorarioLoja } from '../../services/loja.service';

@Component({
  selector: 'app-onboarding',
  standalone: false,
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss',
})
export class OnboardingComponent {
  @Output() concluido = new EventEmitter<void>();

  abertura = '08:00';
  fechamento = '22:00';

  diasSemana = [
    { label: 'Dom', valor: 'dom' },
    { label: 'Seg', valor: 'seg' },
    { label: 'Ter', valor: 'ter' },
    { label: 'Qua', valor: 'qua' },
    { label: 'Qui', valor: 'qui' },
    { label: 'Sex', valor: 'sex' },
    { label: 'Sáb', valor: 'sab' },
  ];

  diasSelecionados: string[] = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']; // padrão seg-sex

  constructor(private lojaService: LojaService) {}

  toggleDia(dia: string): void {
    const idx = this.diasSelecionados.indexOf(dia);
    if (idx >= 0) {
      this.diasSelecionados.splice(idx, 1);
    } else {
      this.diasSelecionados.push(dia);
    }
  }

  salvar(): void {
    if (!this.abertura || !this.fechamento || this.diasSelecionados.length === 0) return;
    this.lojaService.definirHorario({
      abertura: this.abertura,
      fechamento: this.fechamento,
      dias: this.diasSelecionados,
    });
    this.concluido.emit();
  }
}