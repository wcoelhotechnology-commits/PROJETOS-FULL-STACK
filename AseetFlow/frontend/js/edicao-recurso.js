// =============================================================================
//  ASSETFLOW — FRONTEND
//  Autor: Wellington Coelho
//  Arquivo: edicao-recurso.js
//
//  Propósito:
//      Controlar o modal de edição de um ativo (PUT /api/recursos/<id>)
//      e a ação de exclusão (DELETE /api/recursos/<id>), disparadas
//      pelos botões desenhados em inventario.js.
// =============================================================================


// =============================================================================
//  CONFIGURAR O MODAL DE EDIÇÃO
// =============================================================================

function configurarModalEdicao() {

    if (elementos.botaoCancelarEdicao) {

        elementos.botaoCancelarEdicao.addEventListener(
            'click',
            fecharModalEdicao
        );
    }

    if (elementos.formEdicao) {

        elementos.formEdicao.addEventListener(
            'submit',
            async (evento) => {

                evento.preventDefault();

                await salvarEdicaoAtivo();
            }
        );
    }

    // Clicar fora da caixa do modal também fecha, mas clicar
    // dentro da caixa não deve fechar (por isso o "stopPropagation"
    // é feito de forma indireta: só a sobreposição escuta o clique).
    if (elementos.modalEdicao) {

        elementos.modalEdicao.addEventListener(
            'click',
            (evento) => {

                if (evento.target === elementos.modalEdicao) {

                    fecharModalEdicao();
                }
            }
        );
    }
}


// =============================================================================
//  ABRIR O MODAL, JÁ PREENCHIDO COM OS DADOS DO ATIVO
// =============================================================================

function abrirModalEdicao(ativo) {

    if (!elementos.modalEdicao) {
        return;
    }

    document.getElementById('edicao-id').value =
        ativo.id;

    document.getElementById('edicao-nome').value =
        ativo.nome || '';

    document.getElementById('edicao-tipo').value =
        ativo.tipo || '';

    document.getElementById('edicao-descricao').value =
        ativo.descricao || '';

    document.getElementById('edicao-localizacao').value =
        ativo.localizacao || '';

    document.getElementById('edicao-status').value =
        ativo.status || 'disponível';

    if (elementos.selectResponsavelEdicao) {

        elementos.selectResponsavelEdicao.value =
            ativo.responsavel
                ? ativo.responsavel.id
                : '';
    }

    elementos.modalEdicao.classList.remove('oculto');
}


// =============================================================================
//  FECHAR O MODAL
// =============================================================================

function fecharModalEdicao() {

    if (!elementos.modalEdicao) {
        return;
    }

    elementos.modalEdicao.classList.add('oculto');

    if (elementos.formEdicao) {

        elementos.formEdicao.reset();
    }
}


// =============================================================================
//  SALVAR AS ALTERAÇÕES DO ATIVO
// =============================================================================

async function salvarEdicaoAtivo() {

    const ativoId =
        document.getElementById('edicao-id').value;

    if (!ativoId) {

        alert('❌ Não foi possível identificar o ativo a ser editado.');

        return;
    }

    const statusLimpo =
        limparEmojiDeStatus(
            document.getElementById('edicao-status').value
        );

    let responsavelId =
        elementos.selectResponsavelEdicao?.value || null;

    if (responsavelId) {

        responsavelId = Number(responsavelId);
    }

    const dados = {

        nome:
            document.getElementById('edicao-nome').value.trim(),

        tipo:
            document.getElementById('edicao-tipo').value.trim(),

        descricao:
            document.getElementById('edicao-descricao').value.trim(),

        localizacao:
            document.getElementById('edicao-localizacao').value.trim(),

        status:
            statusLimpo,

        responsavel_id:
            responsavelId
    };

    try {

        const resposta =
            await requisicaoApi(
                `/recursos/${ativoId}`,
                {
                    method: 'PUT',

                    body: JSON.stringify(dados)
                }
            );

        const resultado =
            await lerJson(resposta);

        if (resposta.status === 401) {

            tratarSessaoExpirada();

            return;
        }

        if (!resposta.ok) {

            alert(
                `❌ ${
                    resultado.erro ||
                    'Erro ao salvar as alterações'
                }`
            );

            return;
        }

        fecharModalEdicao();

        await carregarInventario();

    } catch (erro) {

        console.error(
            'Erro ao editar ativo:',
            erro
        );

        alert('⚠️ Erro de conexão com o servidor.');
    }
}


// =============================================================================
//  EXCLUIR ATIVO (com confirmação)
// =============================================================================

async function confirmarExclusaoAtivo(ativo) {

    const confirmou = window.confirm(
        `Tem certeza que deseja excluir "${ativo.nome}"? ` +
        'Esta ação não pode ser desfeita.'
    );

    if (!confirmou) {
        return;
    }

    try {

        const resposta =
            await requisicaoApi(
                `/recursos/${ativo.id}`,
                {
                    method: 'DELETE'
                }
            );

        const resultado =
            await lerJson(resposta);

        if (resposta.status === 401) {

            tratarSessaoExpirada();

            return;
        }

        if (!resposta.ok) {

            alert(
                `❌ ${
                    resultado.erro ||
                    'Erro ao excluir o ativo'
                }`
            );

            return;
        }

        await carregarInventario();

    } catch (erro) {

        console.error(
            'Erro ao excluir ativo:',
            erro
        );

        alert('⚠️ Erro de conexão com o servidor.');
    }
}
