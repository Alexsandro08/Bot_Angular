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
  criadoEm?: string; // ← adiciona
}

@Injectable({ providedIn: 'root' })
export class PedidosService {
  private pedidosSubject = new BehaviorSubject<Pedido[]>(
    this.carregarStorage('pedidos_v4'),
  );
  private historicoSubject = new BehaviorSubject<Pedido[]>(
    this.carregarStorage('historico_vendas'),
  );

  pedidos$ = this.pedidosSubject.asObservable();
  historico$ = this.historicoSubject.asObservable();

  private carregarStorage(key: string): Pedido[] {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      return [];
    }
  }

  private salvarStorage(): void {
    localStorage.setItem(
      'pedidos_v4',
      JSON.stringify(this.pedidosSubject.value),
    );
    localStorage.setItem(
      'historico_vendas',
      JSON.stringify(this.historicoSubject.value),
    );
  }

  adicionarPedido(pedido: Pedido): void {
    pedido.status = 'pendente';
    pedido.criadoEm = new Date().toISOString();
    this.pedidosSubject.next([...this.pedidosSubject.value, pedido]);
    this.salvarStorage();
  }
  atualizarStatus(numPedido: number, status: string): void {
    const pedidos = this.pedidosSubject.value.map((p) =>
      p.numPedido == numPedido ? { ...p, status } : p,
    );
    this.pedidosSubject.next(pedidos);
    this.salvarStorage();
  }

  adicionarComprovante(numPedido: number, imagem: string): void {
    const pedidos = this.pedidosSubject.value.map((p) =>
      p.numPedido == numPedido
        ? { ...p, status: 'validacao_pendente', comprovante: imagem }
        : p,
    );
    this.pedidosSubject.next(pedidos);
    this.salvarStorage();
  }

  removerPedido(numPedido: number): void {
    this.pedidosSubject.next(
      this.pedidosSubject.value.filter((p) => p.numPedido != numPedido),
    );
    this.salvarStorage();
  }

  finalizarPedido(numPedido: number): void {
    const pedido = this.pedidosSubject.value.find(
      (p) => p.numPedido == numPedido,
    );
    if (pedido) {
      pedido.status = 'finalizado';
      this.historicoSubject.next([...this.historicoSubject.value, pedido]);
      this.removerPedido(numPedido);
    }
    this.salvarStorage();
  }

  getPedidos(): Pedido[] {
    return this.pedidosSubject.value;
  }
  getHistorico(): Pedido[] {
    return this.historicoSubject.value;
  }

  limparPendentes(): void {
    const pendentes = this.pedidosSubject.value.filter(
      (p) => p.status === 'pendente' || p.status === 'validacao_pendente',
    );
    pendentes.forEach((p) => this.removerPedido(p.numPedido));
  }
  zerarHistorico(): void {
    this.historicoSubject.next([]);
    localStorage.removeItem('historico_vendas');
    localStorage.removeItem('pedidos_v4');
    this.pedidosSubject.next([]);
    this.salvarStorage();
  }
}
