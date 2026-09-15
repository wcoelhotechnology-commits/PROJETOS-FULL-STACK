// =============================================================================
//  ASSETFLOW — FRONTEND
//  Autor: Wellington Coelho
//  Arquivo: navegacao.js
//
//  Propósito:
//      Controlar a troca entre as páginas internas do sistema
//      (Inventário, Novo Ativo, Usuários, Painel Geral).
// =============================================================================


function configurarNavegacao() {

    elementos.botoesNav.forEach(
        botao => {

            botao.addEventListener(
                'click',
                async () => {

                    const pagina =
                        botao.dataset.pagina;

                    if (!pagina) {
                        return;
                    }


                    // Segurança visual adicional — o backend
                    // é quem realmente bloqueia a ação.
                    if (
                        pagina === 'cadastro' &&
                        Number(
                            usuarioAtual?.nivel_permissao
                        ) < 2
                    ) {

                        mostrarMensagem(
                            'Você não possui permissão para cadastrar ativos.',
                            'erro'
                        );

                        return;
                    }

                    if (
                        pagina === 'usuarios' &&
                        Number(
                            usuarioAtual?.nivel_permissao
                        ) < 3
                    ) {

                        mostrarMensagem(
                            'Apenas administradores acessam esta página.',
                            'erro'
                        );

                        return;
                    }


                    ativarBotaoDeNavegacao(
                        botao
                    );

                    exibirPagina(
                        pagina
                    );


                    if (pagina === 'inventario') {

                        await carregarInventario();
                    }

                    if (pagina === 'usuarios') {

                        await carregarListaUsuarios();
                    }

                    if (pagina === 'painel') {

                        await atualizarPainel();
                    }
                }
            );
        }
    );
}


// =============================================================================
//  MARCAR O BOTÃO CLICADO COMO ATIVO
// =============================================================================

function ativarBotaoDeNavegacao(botaoClicado) {

    elementos.botoesNav.forEach(
        item => {

            item.classList.remove(
                'ativo'
            );
        }
    );

    botaoClicado.classList.add(
        'ativo'
    );
}


// =============================================================================
//  MOSTRAR A SEÇÃO CORRESPONDENTE À PÁGINA ESCOLHIDA
// =============================================================================

function exibirPagina(nomePagina) {

    document
        .querySelectorAll(
            '.pagina-conteudo'
        )
        .forEach(
            paginaElemento => {

                paginaElemento.classList.add(
                    'oculto'
                );
            }
        );

    const paginaDestino =
        document.getElementById(
            `pagina-${nomePagina}`
        );

    if (paginaDestino) {

        paginaDestino.classList.remove(
            'oculto'
        );
    }
}
