import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'horario',
  standalone: false,
})
export class HorarioPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';

    const data = new Date(value);
    const agora = new Date();

    const hoje = agora.toDateString();
    const ontem = new Date(agora);
    ontem.setDate(ontem.getDate() - 1);

    let dia = '';
    if (data.toDateString() === hoje) {
      dia = 'Hoje';
    } else if (data.toDateString() === ontem.toDateString()) {
      dia = 'Ontem';
    } else {
      dia = data.toLocaleDateString('pt-BR');
    }

    const horas = data.getHours();
    const minutos = data.getMinutes().toString().padStart(2, '0');
    const periodo = horas >= 12 ? 'PM' : 'AM';
    const horas12 = horas % 12 || 12;

    return `${dia}, ${horas12}:${minutos} ${periodo}`;
  }
}
