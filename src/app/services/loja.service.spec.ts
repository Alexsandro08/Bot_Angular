import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { LojaService } from './loja.service';
import { PedidosService } from './pedidos.service';

describe('LojaService', () => {
  let service: LojaService;
  let http: HttpTestingController;

  const pedidosServiceMock = {
    limparPendentes: jasmine.createSpy('limparPendentes'),
    zerarHistorico: jasmine.createSpy('zerarHistorico'),
    getHistorico: jasmine.createSpy('getHistorico').and.returnValue([]),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        LojaService,
        { provide: PedidosService, useValue: pedidosServiceMock },
      ],
    });

    service = TestBed.inject(LojaService);
    http = TestBed.inject(HttpTestingController);
    sessionStorage.clear();
  });

  afterEach(() => {
    http.verify();
  });

  it('deve inicializar com loja fechada', () => {
    expect(service.aberta).toBeFalse();
  });

  it('deve abrir a loja', () => {
    service.abrirLoja();
    const req = http.expectOne('/api/loja/status');
    req.flush({});
    expect(service.aberta).toBeTrue();
  });

  it('deve fechar a loja', () => {
    service.abrirLoja();
    http.expectOne('/api/loja/status').flush({});

    service.fecharLoja();
    http.expectOne('/api/loja/status').flush({});

    expect(service.aberta).toBeFalse();
    expect(pedidosServiceMock.limparPendentes).toHaveBeenCalled();
    expect(pedidosServiceMock.zerarHistorico).toHaveBeenCalled();
  });

  it('deve salvar fechado_manualmente no sessionStorage ao fechar', () => {
    service.abrirLoja();
    http.expectOne('/api/loja/status').flush({});
    service.fecharLoja();
    http.expectOne('/api/loja/status').flush({});
    expect(sessionStorage.getItem('fechado_manualmente')).toBe('1');
  });

  it('deve inicializar com horário e loja aberta', async () => {
    const me = {
      horario_abertura: '08:00',
      horario_fechamento: '22:00',
      dias_funcionamento: ['seg', 'ter', 'qua', 'qui', 'sex'],
      loja_aberta: true,
    };
    await service.inicializarComDados(me);

    // consome requisição que pode ter sido disparada
    const reqs = http.match('/api/loja/status');
    reqs.forEach((r) => r.flush({}));

    expect(service.horario).toBeTruthy();
    expect(service.horarioDefinido).toBeTrue();
  });

  it('não deve abrir loja se já estiver aberta', () => {
    service.abrirLoja();
    http.expectOne('/api/loja/status').flush({});
    service.abrirLoja(); // segunda vez não deve chamar
    http.expectNone('/api/loja/status');
    expect(service.aberta).toBeTrue();
  });
});
