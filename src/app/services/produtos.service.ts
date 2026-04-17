import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Produto {
  _id?: string;
  nome: string;
  preco: number;
  quantidade: number;
  status: string;
  categoria?: string;
  tempoPreparo?: number;
  descricao?: string;
}

@Injectable({ providedIn: 'root' })
export class ProdutosService {
  private apiUrl = '/api/produtos';

  constructor(private http: HttpClient) {}

  listar(): Observable<Produto[]> {
    return this.http.get<Produto[]>(this.apiUrl, { withCredentials: true });
  }

  adicionar(produto: Partial<Produto>): Observable<any> {
    return this.http.post(this.apiUrl, produto, { withCredentials: true });
  }

  editar(id: string, produto: Partial<Produto>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, produto, { withCredentials: true });
  }

  deletar(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { withCredentials: true });
  }
}