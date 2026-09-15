// =============================================================================
//  ASSETFLOW — FRONTEND
//  Autor: Wellington Coelho
//  Arquivo: elementos.js
//
//  Propósito:
//      Buscar, uma única vez, todos os elementos do DOM usados
//      pela aplicação e guardá-los num único objeto global.
//
//      Isso evita que cada arquivo repita "document.getElementById"
//      para o mesmo elemento e evita erros de digitação no id.
// =============================================================================


const elementos = {

    // -------------------------------------------------------------------------
    // ÁREAS PRINCIPAIS
    // -------------------------------------------------------------------------

    areaLogin:
        document.getElementById('area-login'),

    areaSistema:
        document.getElementById('area-sistema'),


    // -------------------------------------------------------------------------
    // LOGIN
    // -------------------------------------------------------------------------

    formLogin:
        document.getElementById('form-login'),

    caixaMensagem:
        document.getElementById('caixa-mensagem'),


    // -------------------------------------------------------------------------
    // BARRA DO USUÁRIO
    // -------------------------------------------------------------------------

    nomeUsuario:
        document.getElementById('nome-usuario'),

    nivelUsuario:
        document.getElementById('nivel-usuario'),

    botaoSair:
        document.getElementById('botao-sair'),


    // -------------------------------------------------------------------------
    // NAVEGAÇÃO
    // -------------------------------------------------------------------------

    botoesNav:
        document.querySelectorAll('.botao-nav'),


    // -------------------------------------------------------------------------
    // INVENTÁRIO
    // -------------------------------------------------------------------------

    filtroStatus:
        document.getElementById('filtro-status'),

    campoBusca:
        document.getElementById('campo-busca'),

    listaRecursos:
        document.getElementById('lista-recursos'),


    // -------------------------------------------------------------------------
    // CADASTRO DE ATIVO
    // -------------------------------------------------------------------------

    formCadastro:
        document.getElementById('formulario-cadastro'),

    selectResponsavelCadastro:
        document.getElementById('rec-responsavel'),


    // -------------------------------------------------------------------------
    // MODAL DE EDIÇÃO DE ATIVO
    // -------------------------------------------------------------------------

    modalEdicao:
        document.getElementById('modal-edicao'),

    formEdicao:
        document.getElementById('formulario-edicao'),

    botaoCancelarEdicao:
        document.getElementById('botao-cancelar-edicao'),

    selectResponsavelEdicao:
        document.getElementById('edicao-responsavel'),


    // -------------------------------------------------------------------------
    // GESTÃO DE USUÁRIOS
    // -------------------------------------------------------------------------

    listaUsuarios:
        document.getElementById('lista-usuarios'),

    formUsuario:
        document.getElementById('formulario-usuario'),


    // -------------------------------------------------------------------------
    // PAINEL
    // -------------------------------------------------------------------------

    totalGeral:
        document.getElementById('total-geral'),

    totalDisponiveis:
        document.getElementById('total-disponiveis'),

    totalEmUso:
        document.getElementById('total-em-uso'),

    totalManutencao:
        document.getElementById('total-manutencao'),

    totalInativos:
        document.getElementById('total-inativos')
};
