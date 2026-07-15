import { Injectable } from '@angular/core';
import Shepherd from 'shepherd.js';

// ============================================================
// TOUR SERVICE — tour por página
// ============================================================

type Pagina = 'dashboard' | 'produtos' | 'relatorios' | 'suporte' | 'avaliacoes';

@Injectable({ providedIn: 'root' })
export class TourService {
  // ============================================================
  // STEPS POR PÁGINA
  // ============================================================
  private readonly stepsPorPagina: Record<Pagina, any[]> = {
    dashboard: [
      {
        id: 'boas-vindas',
        title: '👋 Bem-vindo ao SuperTech!',
        text: 'Vamos fazer um tour rápido pela sua dashboard. Vai levar menos de 1 minuto!',
      },
      {
        id: 'logo',
        attachTo: { element: '#tour-logo', on: 'right' },
        title: '🏪 Seu restaurante',
        text: 'Aqui fica o logo e o nome do estabelecimento. Clique no logo para trocar a imagem.',
      },
      {
        id: 'nav',
        attachTo: { element: '#tour-nav', on: 'right' },
        title: '🗺️ Navegação',
        text: 'Use o menu para acessar Dashboard, Produtos, Relatórios e Suporte ao Cliente.',
      },
      {
        id: 'btn-loja',
        attachTo: { element: '#tour-btn-loja', on: 'right' },
        title: '🔴 Abrir / Fechar loja',
        text: 'Controla se o bot está aceitando pedidos. Clique para abrir ou fechar quando quiser.',
      },
      {
        id: 'som',
        attachTo: { element: '#tour-btn-som', on: 'bottom' },
        title: '🔊 Som',
        text: 'Ativa ou desativa o som de notificação quando chegar um pedido novo.',
      },
      {
        id: 'notificacoes',
        attachTo: { element: '#tour-notificacoes', on: 'bottom' },
        title: '🔔 Notificações',
        text: 'Alertas importantes, como pedidos aguardando sua atenção.',
      },
      {
        id: 'config',
        attachTo: { element: '#tour-config', on: 'bottom' },
        title: '⚙️ Configurações',
        text: 'Ajuste horário de funcionamento e configure avisos de fechamento.',
      },
      {
        id: 'bot-status',
        attachTo: { element: '#tour-bot-status', on: 'bottom' },
        title: '🤖 Status do Bot',
        text: 'Indica se o bot está online. Ponto verde = recebendo pedidos normalmente!',
      },
      {
        id: 'stats',
        attachTo: { element: '#tour-stats', on: 'bottom' },
        title: '📊 Métricas do dia',
        text: 'Faturamento total, pedidos de hoje, pendentes e finalizados em tempo real.',
      },
      {
        id: 'pedidos',
        attachTo: { element: '#tour-orders', on: 'top' },
        title: '📋 Painel de pedidos',
        text: 'Todos os pedidos aparecem aqui. Use as abas para filtrar por status.',
      },
      {
        id: 'grafico',
        attachTo: { element: '#tour-grafico', on: 'left' },
        title: '💳 Formas de pagamento',
        text: 'Proporção de pedidos por Pix, Dinheiro ou Cartão, e o ticket médio.',
      },
      {
        id: 'mais-vendidos',
        attachTo: { element: '#tour-mais-vendidos', on: 'left' },
        title: '🏆 Mais vendidos',
        text: 'Ranking dos seus produtos campeões de venda.',
      },
      {
        id: 'fim-dashboard',
        title: '✅ Dashboard dominada!',
        text: 'Explore as outras seções pelo menu. O tour vai aparecer automaticamente em cada uma! 🚀',
      },
      {
        id: 'avaliacoes',
        attachTo: { element: '#tour-nav', on: 'right' },
        title: '⭐ Avaliações',
        text: 'Acompanhe as avaliações dos seus clientes após cada atendimento, tanto humano quanto pelo bot.',
      },
    ],

    produtos: [
      {
        id: 'produtos-intro',
        title: '📦 Gerenciar Produtos',
        text: 'Aqui você controla todo o seu cardápio. Vamos ver o que tem disponível!',
      },
      {
        id: 'produtos-filtros',
        attachTo: { element: '#tour-produtos-filtros', on: 'bottom' },
        title: '🔍 Busca e filtros',
        text: 'Busque produtos pelo nome ou filtre por categoria.',
      },
      {
        id: 'produtos-novo',
        attachTo: { element: '#tour-produtos-novo', on: 'bottom' },
        title: '➕ Novo Produto',
        text: 'Clique aqui para cadastrar um item no cardápio: nome, preço, estoque, categoria e tempo de preparo.',
      },
      {
        id: 'produtos-tabela',
        attachTo: { element: '#tour-produtos-tabela', on: 'top' },
        title: '📋 Lista de produtos',
        text: 'Seus produtos aparecem aqui. Use ✏️ para editar e 🗑️ para excluir.',
      },
      {
        id: 'fim-produtos',
        title: '✅ Produtos dominados!',
        text: 'Mantenha seu cardápio sempre atualizado para o bot funcionar certinho! 🍔',
      },
    ],

    relatorios: [
      {
        id: 'relatorios-intro',
        title: '📊 Relatórios',
        text: 'Acompanhe o desempenho do seu negócio com dados detalhados.',
      },
      {
        id: 'relatorios-acoes',
        attachTo: { element: '#tour-relatorios-acoes', on: 'bottom' },
        title: '💾 Salvar e Exportar',
        text: '<b>Salvar hoje</b> registra o movimento do dia. <b>Exportar PDF</b> gera um relatório para baixar.',
      },
      {
        id: 'relatorios-cards',
        attachTo: { element: '#tour-relatorios-cards', on: 'bottom' },
        title: '📈 Resumo geral',
        text: 'Faturamento total acumulado, dias registrados e total de pedidos.',
      },
      {
        id: 'relatorios-tabs',
        attachTo: { element: '#tour-relatorios-tabs', on: 'bottom' },
        title: '🗂️ Abas',
        text: '<b>Histórico</b> mostra o movimento por dia. <b>Comprovantes de Pix</b> lista todos os comprovantes enviados.',
      },
      {
        id: 'relatorios-historico',
        attachTo: { element: '#tour-relatorios-historico', on: 'top' },
        title: '📅 Histórico por dia',
        text: 'Filtre por período e veja pedidos, faturamento e formas de pagamento de cada dia.',
      },
      {
        id: 'relatorios-ranking',
        attachTo: { element: '#tour-relatorios-ranking', on: 'left' },
        title: '🏆 Ranking de produtos',
        text: 'Os produtos mais vendidos no período selecionado.',
      },
      {
        id: 'fim-relatorios',
        title: '✅ Relatórios dominados!',
        text: 'Salve todo dia para ter um histórico completo do seu negócio! 📈',
      },
    ],

    suporte: [
      {
        id: 'suporte-intro',
        title: '🎧 Suporte ao Cliente',
        text: 'Quando um cliente pedir para falar com atendente no bot, o chamado aparece aqui.',
      },
      {
        id: 'suporte-lista',
        attachTo: { element: '#tour-suporte-lista', on: 'right' },
        title: '📋 Lista de chamados',
        text: 'Chamados abertos aparecem aqui. Ponto laranja = aguardando atendimento.',
      },
      {
        id: 'suporte-chat',
        attachTo: { element: '#tour-suporte-chat-vazio', on: 'left' },
        title: '💬 Área de chat',
        text: 'Selecione um chamado para abrir o chat e trocar mensagens com o cliente via WhatsApp.',
      },
      {
        id: 'fim-suporte',
        title: '✅ Suporte dominado!',
        text: 'Responda rápido para garantir uma boa experiência ao seu cliente! 😊',
      },
    ],

    avaliacoes: [
      {
        id: 'avaliacoes-intro',
        title: '⭐ Avaliações',
        text: 'Aqui você acompanha o feedback dos seus clientes após cada atendimento.',
      },
      {
        id: 'avaliacoes-resumo',
        attachTo: { element: '#tour-aval-resumo', on: 'bottom' },
        title: '📊 Resumo',
        text: 'Média geral, média do atendimento humano e do bot separados.',
      },
      {
        id: 'avaliacoes-dist',
        attachTo: { element: '#tour-aval-dist', on: 'bottom' },
        title: '📈 Distribuição',
        text: 'Veja quantas avaliações cada nota recebeu.',
      },
      {
        id: 'avaliacoes-lista',
        attachTo: { element: '#tour-aval-lista', on: 'top' },
        title: '📋 Lista',
        text: 'Todas as avaliações com nome, nota, tipo e horário.',
      },
      {
        id: 'fim-avaliacoes',
        title: '✅ Pronto!',
        text: 'Use as avaliações pra melhorar seu atendimento! 🚀',
      },
    ],
  };

  // ============================================================
  // CHAVE DO LOCALSTORAGE POR PÁGINA
  // ============================================================
  private chave(pagina: Pagina): string {
    return `tour_${pagina}_feito`;
  }

  // ============================================================
  // VERIFICAR SE DEVE DISPARAR
  // ============================================================
  verificarEIniciar(pagina: Pagina): void {
    const jaFeito = localStorage.getItem(this.chave(pagina));
    if (!jaFeito) {
      setTimeout(() => this.iniciar(pagina), 800);
    }
  }

  // ============================================================
  // INICIAR TOUR DE UMA PÁGINA
  // ============================================================
  iniciar(pagina: Pagina): void {
    const tour = new (Shepherd as any).Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        scrollTo: { behavior: 'smooth', block: 'center' },
        modalOverlayOpeningPadding: 8,
        modalOverlayOpeningRadius: 8,
      },
    });

    const steps = this.stepsPorPagina[pagina];

    steps.forEach((step, index) => {
      const isFirst = index === 0;
      const isLast = index === steps.length - 1;

      tour.addStep({
        id: step.id,
        attachTo: step.attachTo,
        title: step.title,
        text: step.text,
        buttons: [
          ...(!isFirst
            ? [
                {
                  text: 'Voltar',
                  action: tour.back,
                  classes: 'shepherd-button-secondary',
                },
              ]
            : []),
          {
            text: isLast ? 'Concluir 🎉' : 'Próximo →',
            action: isLast ? tour.complete : tour.next,
            classes: 'shepherd-button-primary',
          },
        ],
      });
    });

    tour.on('complete', () => localStorage.setItem(this.chave(pagina), 'true'));
    tour.on('cancel', () => localStorage.setItem(this.chave(pagina), 'true'));

    tour.start();
  }

  // ============================================================
  // VER NOVAMENTE (reseta o localStorage)
  // ============================================================
  verNovamente(pagina: Pagina): void {
    localStorage.removeItem(this.chave(pagina));
    this.iniciar(pagina);
  }

  // ============================================================
  // RESETAR TODOS (botão "ver tour novamente" geral)
  // ============================================================
  resetarTodos(): void {
    (['dashboard', 'produtos', 'relatorios', 'suporte', 'avaliacoes'] as Pagina[]).forEach(
      (p) => localStorage.removeItem(this.chave(p)),
    );
  }
}
