import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pedido } from './pedidos.service';

export interface ProdutoVendido {
  nome: string;
  quantidade: number;
}

export interface Relatorio {
  id: number;
  restaurante_id: number;
  data: string;
  faturamento: number;
  total_pedidos: number;
  pix: number;
  dinheiro: number;
  cartao: number;
  produtos_mais_vendidos: ProdutoVendido[];
  criado_em: string;
}

export interface RelatorioPayload {
  faturamento: number;
  total_pedidos: number;
  pix: number;
  dinheiro: number;
  cartao: number;
  produtos_mais_vendidos: ProdutoVendido[];
}

@Injectable({ providedIn: 'root' })
export class RelatoriosService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  salvar(payload: RelatorioPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/relatorios`, payload, {
      withCredentials: true,
    });
  }

  listar(): Observable<Relatorio[]> {
    return this.http.get<Relatorio[]>(`${this.apiUrl}/api/relatorios`, {
      withCredentials: true,
    });
  }

  montarPayload(historico: Pedido[]): RelatorioPayload {
  const mapa: Record<string, number> = {};
  historico.forEach(p => {
    p.carrinho.forEach((item: string) => {
      const match = item.match(/(\d+)x\s+(.+?)(?:\s+\(R\$|$)/);
      if (match) {
        const nome = match[2]?.trim() ?? '';
        const qtd = parseInt(match[1] ?? '0');
        mapa[nome] = (mapa[nome] || 0) + qtd;
      }
    });
  });

  return {
    faturamento: historico.reduce((acc, p) => acc + p.total, 0),
    total_pedidos: historico.length,
    pix: historico.filter(p => p.pagamento === 'Pix').length,
    dinheiro: historico.filter(p => p.pagamento === 'Dinheiro').length,
    cartao: historico.filter(p => p.pagamento === 'Cartão').length,
    produtos_mais_vendidos: Object.entries(mapa)
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
  };
}
}
