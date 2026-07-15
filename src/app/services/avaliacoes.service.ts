import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Avaliacao {
  _id: string;
  nome: string;
  nota: number;
  tipo: 'humano' | 'bot';
  criado_em: string;
}

export interface ResumoAvaliacoes {
  total: number;
  media: number;
  humano: { total: number; media: number };
  bot: { total: number; media: number };
  distribuicao: { nota: number; quantidade: number }[];
}

@Injectable({ providedIn: 'root' })
export class AvaliacoesService {
  constructor(private http: HttpClient) {}

  listar(tipo?: string): Observable<Avaliacao[]> {
    const params = tipo ? `?tipo=${tipo}` : '';
    return this.http.get<Avaliacao[]>(`/api/avaliacoes${params}`);
  }

  resumo(): Observable<ResumoAvaliacoes> {
    return this.http.get<ResumoAvaliacoes>('/api/avaliacoes/resumo');
  }
}
