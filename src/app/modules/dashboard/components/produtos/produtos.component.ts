import { Component, OnInit, HostListener } from '@angular/core';
import { ProdutosService, Produto } from '../../../../services/produtos.service';
import Swal from 'sweetalert2';

const CATEGORIAS = [
  'Lanches',
  'Bebidas',
  'Sobremesas',
  'Acompanhamentos',
  'Combos',
];

@Component({
  selector: 'app-produtos',
  standalone: false,
  templateUrl: './produtos.component.html',
  styleUrl: './produtos.component.scss',
})
export class ProdutosComponent implements OnInit {
  produtos: Produto[] = [];

  modalAberto = false;
  editando = false;

  filtroCategoria = '';
  busca = '';

  indexAtual: string  | null = null;

  categorias = CATEGORIAS;

  // dropdown
  dropdownAberto = false;

  form: Partial<Produto> = {
  nome: '',
  preco: 0,       
  quantidade: 0,
  status: 'Disponível',
  categoria: '',
  tempoPreparo: 0, 
  descricao: '',
};
  constructor(private produtosService: ProdutosService) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.produtosService.listar().subscribe((p) => (this.produtos = p));
  }

  abrirModal(id: string | null): void {
    this.indexAtual = id;
    this.editando = id !== null;

    if (id !== null) {
      const p = this.produtos.find((p) => p._id === id);
      if (!p) return;
      this.form = {
        nome: p.nome,
        preco: p.preco,
        quantidade: p.quantidade,
        status: p.status,
        categoria: p.categoria || '',
        tempoPreparo: p.tempoPreparo || 0,
        descricao: p.descricao || '',
      };
    } else {
      this.form = {
        nome: '',
        preco: 0,
        quantidade: 0,
        status: 'Disponível',
        categoria: '',
        tempoPreparo: 0,
        descricao: '',
      };
    }
    this.modalAberto = true;
  }

  salvar(): void {
    const obs =
      this.editando && this.indexAtual
        ? this.produtosService.editar(this.indexAtual, this.form)
        : this.produtosService.adicionar(this.form);

    obs.subscribe((res: any) => {
      if (res.ok) {
        this.fecharModal();
        this.carregar();
        Swal.fire({
          title: 'Salvo!',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  }
  fecharModal() {
    this.modalAberto = false;
  }

  deletar(id: string): void {
    Swal.fire({
      title: 'Remover produto?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, remover',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ff4757',
    }).then((r: any) => {
      if (r.isConfirmed) {
        this.produtosService.deletar(id).subscribe(() => {
          this.carregar();
          Swal.fire({
            title: 'Removido!',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
          });
        });
      }
    });
  }

  // filtro + busca

  normalizar(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[-\s]/g, '');
  }

  get produtosFiltrados() {
    return this.produtos.filter((p) => {
      const nomeProduto = this.normalizar(p.nome);
      const busca = this.normalizar(this.busca || '');

      const matchBusca = nomeProduto.includes(busca);

      const matchCategoria =
        !this.filtroCategoria || p.categoria === this.filtroCategoria;

      return matchBusca && matchCategoria;
    });
  }

  // dropdown
  toggleDropdown() {
    this.dropdownAberto = !this.dropdownAberto;
  }

  selecionarCategoria(cat: string) {
    this.filtroCategoria = cat;
    this.dropdownAberto = false;
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    const element = event.target as HTMLElement;

    if (!element.closest('.dropdown')) {
      this.dropdownAberto = false;
    }
  }
}
