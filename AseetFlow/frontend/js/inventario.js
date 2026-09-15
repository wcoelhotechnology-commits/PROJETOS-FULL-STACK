// =============================================================================
//  ASSETFLOW — FRONTEND
//  Autor: Wellington Coelho
//  Arquivo: inventario.js
//
//  Propósito:
//      Controlar a página de Inventário: listar ativos, aplicar
//      filtros e busca, e desenhar os botões de editar/excluir
//      de acordo com o nível do usuário logado.
// =============================================================================


// =============================================================================
//  CONFIGURAÇÃO DOS FILTROS
// =============================================================================

function configurarFiltros() {

    if (elementos.filtroStatus) {

        elementos.filtroStatus.addEventListener(
            'change',
            carregarInventario
        );
    }

    if (elementos.campoBusca) {

        elementos.campoBusca.addEventListener(
            'input',
            debounce(
                carregarInventario,
                300
            )
        );
    }
}


// =============================================================================
//  CARREGAR INVENTÁRIO
// =============================================================================

async function carregarInventario() {

    if (!elementos.listaRecursos) {
        return;
    }

    elementos.listaRecursos.innerHTML =
        '<p class="mensagem-vazia">Carregando inventário...</p>';

    try {

        let caminho =
            '/recursos/';

        const filtro =
            elementos.filtroStatus?.value;

        const busca =
            elementos.campoBusca
                ?.value
                ?.toLowerCase()
                .trim();

        if (filtro) {

            caminho +=
                `?status=${
                    encodeURIComponent(filtro)
                }`;
        }

        const resposta =
            await requisicaoApi(
                caminho
            );

        const resultado =
            await lerJson(resposta);

        if (resposta.status === 401) {

            tratarSessaoExpirada();

            return;
        }

        if (!resposta.ok) {

            elementos.listaRecursos.innerHTML =
                `<p class="mensagem-vazia">${
                    resultado.erro ||
                    'Erro ao carregar ativos.'
                }</p>`;

            return;
        }

        let ativos =
            Array.isArray(
                resultado.recursos
            )
                ? resultado.recursos
                : [];


        // ---------------------------------------------------------------------
        // BUSCA LOCAL
        // ---------------------------------------------------------------------

        if (busca) {

            ativos = ativos.filter(
                ativo => {

                    const nome =
                        String(ativo.nome || '').toLowerCase();

                    const tipo =
                        String(ativo.tipo || '').toLowerCase();

                    const localizacao =
                        String(ativo.localizacao || '').toLowerCase();

                    return (
                        nome.includes(busca) ||
                        tipo.includes(busca) ||
                        localizacao.includes(busca)
                    );
                }
            );
        }


        if (ativos.length === 0) {

            elementos.listaRecursos.innerHTML =
                '<p class="mensagem-vazia">Nenhum ativo encontrado.</p>';

            return;
        }


        // ---------------------------------------------------------------------
        // RENDERIZAÇÃO
        // ---------------------------------------------------------------------

        elementos.listaRecursos.innerHTML = '';

        ativos.forEach(
            ativo => {

                renderizarAtivo(
                    ativo
                );
            }
        );

    } catch (erro) {

        console.error(
            'Erro ao carregar inventário:',
            erro
        );

        elementos.listaRecursos.innerHTML =
            '<p class="mensagem-vazia">❌ Erro ao carregar dados.</p>';
    }
}


// =============================================================================
//  RENDERIZAR UM ATIVO
// =============================================================================

function renderizarAtivo(ativo) {

    if (!elementos.listaRecursos) {
        return;
    }

    const nivel =
        Number(usuarioAtual?.nivel_permissao || 0);

    const item =
        document.createElement('div');

    item.className =
        'item-recurso';


    // -------------------------------------------------------------------------
    // NOME + TIPO
    // -------------------------------------------------------------------------

    const nome =
        document.createElement('strong');

    nome.textContent =
        ativo.nome || 'Sem nome';

    item.appendChild(nome);

    item.appendChild(
        document.createTextNode(' — ')
    );

    const tipo =
        document.createElement('em');

    tipo.textContent =
        ativo.tipo || 'Não informado';

    item.appendChild(tipo);

    item.appendChild(
        document.createElement('br')
    );


    // -------------------------------------------------------------------------
    // LOCALIZAÇÃO + STATUS
    // -------------------------------------------------------------------------

    item.appendChild(
        document.createTextNode(
            `📍 ${ativo.localizacao || 'Não informada'} · `
        )
    );

    const status =
        document.createElement('span');

    const statusTexto =
        ativo.status || 'não definido';

    const classeStatus =
        statusTexto
            .replace(/\s+/g, '-')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

    status.className =
        `status-${classeStatus}`;

    status.textContent =
        statusTexto;

    item.appendChild(status);


    // -------------------------------------------------------------------------
    // RESPONSÁVEL
    // -------------------------------------------------------------------------

    if (ativo.responsavel) {

        item.appendChild(document.createElement('br'));

        item.appendChild(
            document.createTextNode(
                `👤 Responsável: ${ativo.responsavel.nome}`
            )
        );
    }


    // -------------------------------------------------------------------------
    // AÇÕES — Editar (nível 2+) e Excluir (nível 3)
    // -------------------------------------------------------------------------

    if (nivel >= 2) {

        const linhaAcoes =
            document.createElement('div');

        linhaAcoes.className =
            'linha-acoes-item';


        const botaoEditar =
            document.createElement('button');

        botaoEditar.type =
            'button';

        botaoEditar.className =
            'botao-acao botao-mini';

        botaoEditar.textContent =
            '✏️ Editar';

        botaoEditar.addEventListener(
            'click',
            () => abrirModalEdicao(ativo)
        );

        linhaAcoes.appendChild(botaoEditar);


        if (nivel >= 3) {

            const botaoExcluir =
                document.createElement('button');

            botaoExcluir.type =
                'button';

            botaoExcluir.className =
                'botao-acao botao-mini botao-mini-perigo';

            botaoExcluir.textContent =
                '🗑️ Excluir';

            botaoExcluir.addEventListener(
                'click',
                () => confirmarExclusaoAtivo(ativo)
            );

            linhaAcoes.appendChild(botaoExcluir);
        }


        item.appendChild(linhaAcoes);
    }


    elementos.listaRecursos.appendChild(item);
}
