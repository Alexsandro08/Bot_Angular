import { HorarioPipe } from './horario.pipe';

describe('HorarioPipe', () => {
  let pipe: HorarioPipe;

  beforeEach(() => {
    pipe = new HorarioPipe();
  });

  it('deve retornar string vazia para valor vazio', () => {
    expect(pipe.transform('')).toBe('');
  });

  it('deve retornar "Hoje" para data atual', () => {
    const agora = new Date().toISOString();
    const resultado = pipe.transform(agora);
    expect(resultado).toContain('Hoje');
  });

  it('deve retornar "Ontem" para data de ontem', () => {
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    const resultado = pipe.transform(ontem.toISOString());
    expect(resultado).toContain('Ontem');
  });

  it('deve retornar data formatada em pt-BR para datas antigas', () => {
    const antiga = new Date('2026-01-15T10:00:00');
    const resultado = pipe.transform(antiga.toISOString());
    expect(resultado).toContain('15/01/2026');
  });

  it('deve formatar horário no formato 12h com AM/PM', () => {
    const manha = new Date();
    manha.setHours(9, 30, 0, 0);
    const resultado = pipe.transform(manha.toISOString());
    expect(resultado).toContain('AM');

    const tarde = new Date();
    tarde.setHours(14, 45, 0, 0);
    const resultado2 = pipe.transform(tarde.toISOString());
    expect(resultado2).toContain('PM');
  });

  it('deve formatar minutos com zero à esquerda', () => {
    const data = new Date();
    data.setHours(10, 5, 0, 0);
    const resultado = pipe.transform(data.toISOString());
    expect(resultado).toContain('05');
  });
});