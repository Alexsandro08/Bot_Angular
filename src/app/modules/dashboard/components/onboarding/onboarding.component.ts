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

  constructor(private lojaService: LojaService) {}

  salvar(): void {
    if (!this.abertura || !this.fechamento) return;
    this.lojaService.definirHorario({
      abertura: this.abertura,
      fechamento: this.fechamento,
    });
    this.concluido.emit();
  }
}
