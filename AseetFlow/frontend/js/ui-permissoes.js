// =============================================================================
//  ASSETFLOW — FRONTEND
//  Autor: Wellington Coelho
//  Arquivo: ui-permissoes.js
//
//  Propósito:
//      Ajustar o que aparece na interface de acordo com o nível
//      de permissão do usuário logado.
//
//  IMPORTANTE:
//      Isto é apenas conveniência visual. A permissão de verdade
//      é sempre verificada no backend (ver rotas_auth.py e
//      rotas_recursos.py) — mesmo que alguém edite este arquivo
//      no navegador, o servidor continua bloqueando o que não é
//      permitido.
// =============================================================================


function aplicarPermissoesInterface(usuario) {

    const nivel =
        Number(
            usuario?.nivel_permissao || 0
        );


    // -------------------------------------------------------------------------
    // BOTÃO "NOVO ATIVO"
    // Colaborador (nível 1) não pode cadastrar.
    // -------------------------------------------------------------------------

    alternarVisibilidade(
        '.botao-nav[data-pagina="cadastro"]',
        nivel >= 2
    );

    alternarVisibilidadeElemento(
        document.getElementById('pagina-cadastro'),
        nivel >= 2
    );


    // -------------------------------------------------------------------------
    // BOTÃO "USUÁRIOS"
    // Somente administrador (nível 3).
    // -------------------------------------------------------------------------

    alternarVisibilidade(
        '.botao-nav[data-pagina="usuarios"]',
        nivel >= 3
    );

    alternarVisibilidadeElemento(
        document.getElementById('pagina-usuarios'),
        nivel >= 3
    );
}


// =============================================================================
//  FUNÇÕES AUXILIARES DE VISIBILIDADE
// =============================================================================

function alternarVisibilidade(
    seletor,
    deveMostrar
) {

    const elemento =
        document.querySelector(seletor);

    alternarVisibilidadeElemento(
        elemento,
        deveMostrar
    );
}


function alternarVisibilidadeElemento(
    elemento,
    deveMostrar
) {

    if (!elemento) {
        return;
    }

    if (deveMostrar) {

        elemento.classList.remove('oculto');

    } else {

        elemento.classList.add('oculto');
    }
}
