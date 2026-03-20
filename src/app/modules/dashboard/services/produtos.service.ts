import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Produto {
  rowIndex: number;
  nome: string;
  preco: string;
  quantidade: string;
  status: string;
  categoria?: string;
  tempoPreparo?: string;
}

@Injectable({ providedIn: 'root' })
export class ProdutosService {
  private apiUrl = 'http://localhost:3000/api/produtos';

  constructor(private http: HttpClient) {}

  listar(): Observable<Produto[]> {
    return this.http.get<Produto[]>(this.apiUrl, { withCredentials: true });
  }

  adicionar(produto: Partial<Produto>): Observable<any> {
    return this.http.post(this.apiUrl, produto, { withCredentials: true });
  }

  editar(index: number, produto: Partial<Produto>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${index}`, produto, {
      withCredentials: true,
    });
  }

  deletar(index: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${index}`, {
      withCredentials: true,
    });
  }
}
