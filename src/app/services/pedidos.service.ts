import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Pedido {
  userId: string;
  numPedido: number;
  nome: string;
  carrinho: string[];
  total: number;
  endereco: string;
  pagamento: string;
  status: string;
  comprovante?: string;
  observacao?: string;
  horario?: string;
  criadoEm?: string;
  troco?: string;
}

@Injectable({ providedIn: 'root' })
export class PedidosService {
  private pedidosSubject = new BehaviorSubject<Pedido[]>(
    this.carregar('pedidos'),
  );
  private historicoSubject = new BehaviorSubject<Pedido[]>(
    this.carregar('historico'),
  );

  pedidos$ = this.pedidosSubject.asObservable();
  historico$ = this.historicoSubject.asObservable();

  private carregar(chave: string): Pedido[] {
    try {
      return JSON.parse(sessionStorage.getItem(chave) || '[]');
    } catch {
      return [];
    }
  }

  private salvar(chave: string, dados: Pedido[]): void {
    sessionStorage.setItem(chave, JSON.stringify(dados));
  }

  adicionarPedido(pedido: Pedido): void {
    pedido.status = 'pendente';
    pedido.criadoEm = new Date().toISOString();
    const atualizados = [...this.pedidosSubject.value, pedido];
    this.pedidosSubject.next(atualizados);
    this.salvar('pedidos', atualizados);
  }

  atualizarStatus(numPedido: number, status: string): void {
    const pedidos = this.pedidosSubject.value.map((p) =>
      p.numPedido == numPedido ? { ...p, status } : p,
    );
    this.pedidosSubject.next(pedidos);
    this.salvar('pedidos', pedidos);
  }

  adicionarComprovante(numPedido: number, imagem: string): void {
    const pedidos = this.pedidosSubject.value.map((p) =>
      p.numPedido == numPedido
        ? { ...p, status: 'validacao_pendente', comprovante: imagem }
        : p,
    );
    this.pedidosSubject.next(pedidos);
    this.salvar('pedidos', pedidos);
  }

  removerPedido(numPedido: number): void {
    const pedidos = this.pedidosSubject.value.filter(
      (p) => p.numPedido != numPedido,
    );
    this.pedidosSubject.next(pedidos);
    this.salvar('pedidos', pedidos);
  }

  finalizarPedido(numPedido: number): void {
    const pedido = this.pedidosSubject.value.find(
      (p) => p.numPedido == numPedido,
    );
    if (pedido) {
      pedido.status = 'finalizado';
      const historico = [...this.historicoSubject.value, pedido];
      this.historicoSubject.next(historico);
      this.salvar('historico', historico);
      this.removerPedido(numPedido);
    }
  }

  getPedidos(): Pedido[] {
    return this.pedidosSubject.value;
  }
  getHistorico(): Pedido[] {
    return this.historicoSubject.value;
  }

  cancelarPedido(numPedido: number, motivo = 'cancelado'): void {
    const pedido = this.pedidosSubject.value.find(
      (p) => p.numPedido == numPedido,
    );
    if (pedido) {
      const cancelado = { ...pedido, status: motivo };
      const historico = [...this.historicoSubject.value, cancelado];
      this.historicoSubject.next(historico);
      this.salvar('historico', historico);
      this.removerPedido(numPedido);
    }
  }

  iniciarTimeoutPix(numPedido: number): void {
    setTimeout(
      () => {
        const pedido = this.pedidosSubject.value.find(
          (p) => p.numPedido == numPedido,
        );
        if (
          pedido &&
          (pedido.status === 'aguardando_pix' ||
            pedido.status === 'validacao_pendente')
        ) {
          this.cancelarPedido(numPedido, 'cancelado_timeout');
        }
      },
      10 * 60 * 1000,
    ); 
  }

  limparPendentes(): void {
    const pendentes = this.pedidosSubject.value.filter(
      (p) => p.status === 'pendente' || p.status === 'validacao_pendente',
    );
    pendentes.forEach((p) => this.removerPedido(p.numPedido));
  }

  zerarHistorico(): void {
    this.historicoSubject.next([]);
    this.pedidosSubject.next([]);
    sessionStorage.removeItem('pedidos');
    sessionStorage.removeItem('historico');
  }
}
