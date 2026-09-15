// =============================================================================
//  ASSETFLOW — FRONTEND
//  Autor: Wellington Coelho
//  Arquivo: principal.js
//
//  Propósito:
//      Ponto de entrada da aplicação. É o único arquivo que decide
//      "quando" cada coisa deve começar a funcionar.
//
//      Este é o ÚLTIMO script carregado pelo index.html — todos os
//      outros arquivos (config, elementos, api, utilidades, sessão,
//      permissões, navegação, usuários, inventário, edição, cadastro
//      e painel) já existem quando este código roda.
// =============================================================================


document.addEventListener(
    'DOMContentLoaded',
    async () => {

        console.log(
            '🚀 AssetFlow iniciando...'
        );


        // -------------------------------------------------------------------
        // CONFIGURA OS EVENTOS DE CADA PÁGINA
        // -------------------------------------------------------------------

        configurarLogin();

        configurarLogout();

        configurarNavegacao();

        configurarFiltros();

        configurarCadastroRecurso();

        configurarModalEdicao();

        configurarCadastroUsuario();


        // -------------------------------------------------------------------
        // VERIFICA SE JÁ EXISTE UMA SESSÃO ATIVA
        // -------------------------------------------------------------------
        //
        // Isso acontece, por exemplo, quando o usuário atualiza a
        // página (F5) já estando autenticado — o cookie de sessão
        // continua válido no servidor.
        // -------------------------------------------------------------------

        await verificarSessao();


        console.log(
            '✅ AssetFlow pronto para uso.'
        );
    }
);
