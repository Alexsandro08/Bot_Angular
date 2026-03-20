import { Component, OnInit, HostListener } from '@angular/core';
import { ProdutosService, Produto } from '../../services/produtos.service';
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

  indexAtual: number | null = null;

  categorias = CATEGORIAS;

  // dropdown
  dropdownAberto = false;

  form: Partial<Produto> = {
    nome: '',
    preco: '',
    quantidade: '',
    status: 'Disponível',
    categoria: '',
    tempoPreparo: '',
  };

  constructor(private produtosService: ProdutosService) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.produtosService.listar().subscribe((p) => (this.produtos = p));
  }

  abrirModal(rowIndex: number | null): void {
    console.log('abrirModal chamado', rowIndex);
    this.indexAtual = rowIndex;
    this.editando = rowIndex !== null;

    if (rowIndex !== null) {
      const p = this.produtos.find((p) => p.rowIndex === rowIndex);

      if (!p) return;

      this.form = {
        nome: p.nome,
        preco: p.preco,
        quantidade: p.quantidade,
        status: p.status,
        categoria: p.categoria || '',
        tempoPreparo: p.tempoPreparo || '',
      };
    } else {
      this.form = {
        nome: '',
        preco: '',
        quantidade: '',
        status: 'Disponível',
        categoria: '',
        tempoPreparo: '',
      };
    }

    this.modalAberto = true;
  }

  fecharModal(): void {
    this.modalAberto = false;
  }

  salvar(): void {
    const obs =
      this.editando && this.indexAtual !== null
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

  deletar(index: number): void {
    Swal.fire({
      title: 'Remover produto?',
      text: 'Isso também removerá da planilha.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, remover',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ff4757',
    }).then((r: any) => {
      if (r.isConfirmed) {
        this.produtosService.deletar(index).subscribe(() => {
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
