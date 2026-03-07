import { Component, OnInit } from '@angular/core';
import { ProdutosService, Produto } from '../../services/produtos.service';

declare var Swal: any;

@Component({
  selector: 'app-produtos',
  standalone: false,
  templateUrl: './produtos.component.html',
  styleUrl: './produtos.component.scss'
})
export class ProdutosComponent implements OnInit {
  produtos: Produto[] = [];
  modalAberto = false;
  editando = false;
  indexAtual: number | null = null;

  form: Partial<Produto> = { nome: '', preco: '', quantidade: '', status: 'Disponível' };

  constructor(private produtosService: ProdutosService) {}

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.produtosService.listar().subscribe(p => this.produtos = p);
  }

  abrirModal(index: number | null): void {
    this.indexAtual = index;
    this.editando = index !== null;
    if (index !== null) {
      const p = this.produtos[index];
      this.form = { nome: p.nome, preco: p.preco, quantidade: p.quantidade, status: p.status };
    } else {
      this.form = { nome: '', preco: '', quantidade: '', status: 'Disponível' };
    }
    this.modalAberto = true;
  }

  fecharModal(): void { this.modalAberto = false; }

  salvar(): void {
    const obs = this.editando && this.indexAtual !== null
      ? this.produtosService.editar(this.indexAtual, this.form)
      : this.produtosService.adicionar(this.form);

    obs.subscribe((res: any) => {
      if (res.ok) {
        this.fecharModal();
        this.carregar();
        Swal.fire({ title: 'Salvo!', icon: 'success', timer: 1500, showConfirmButton: false });
      }
    });
  }

  deletar(index: number): void {
    Swal.fire({
      title: 'Remover produto?',
      text: 'Isso também removerá da planilha.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, remover',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ff4757'
    }).then((r: any) => {
      if (r.isConfirmed) {
        this.produtosService.deletar(index).subscribe(() => {
          this.carregar();
          Swal.fire({ title: 'Removido!', icon: 'success', timer: 1500, showConfirmButton: false });
        });
      }
    });
  }
}