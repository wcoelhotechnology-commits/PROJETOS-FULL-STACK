// =============================================================================
//  ASSETFLOW — FRONTEND
//  Autor: Wellington Coelho
//  Arquivo: cadastro-recurso.js
//
//  Propósito:
//      Controlar o formulário de cadastro de um novo ativo
//      (POST /api/recursos/).
// =============================================================================


// =============================================================================
//  CONFIGURAR CADASTRO DE ATIVO
// =============================================================================

function configurarCadastroRecurso() {

    if (!elementos.formCadastro) {
        return;
    }

    elementos.formCadastro.addEventListener(
        'submit',
        async (evento) => {

            evento.preventDefault();

            await cadastrarRecurso();
        }
    );
}


// =============================================================================
//  CADASTRAR ATIVO
// =============================================================================

async function cadastrarRecurso() {

    // O backend também verifica isso — esta checagem existe
    // apenas para melhorar a experiência de quem usa a interface.
    if (Number(usuarioAtual?.nivel_permissao) < 2) {

        alert('❌ Você não possui permissão para cadastrar ativos.');

        return;
    }

    const campoNome =
        document.getElementById('rec-nome');

    const campoTipo =
        document.getElementById('rec-tipo');

    const campoDescricao =
        document.getElementById('rec-descricao');

    const campoLocalizacao =
        document.getElementById('rec-localizacao');

    const campoStatus =
        document.getElementById('rec-status');

    if (
        !campoNome ||
        !campoTipo ||
        !campoLocalizacao ||
        !campoStatus
    ) {

        alert('❌ O formulário de cadastro está incompleto.');

        return;
    }

    const statusLimpo =
        limparEmojiDeStatus(
            campoStatus.value
        );

    let responsavelId =
        elementos.selectResponsavelCadastro?.value || null;

    if (responsavelId) {

        responsavelId = Number(responsavelId);
    }

    const dados = {

        nome:
            campoNome.value.trim(),

        tipo:
            campoTipo.value.trim(),

        descricao:
            campoDescricao?.value?.trim() || '',

        localizacao:
            campoLocalizacao.value.trim(),

        status:
            statusLimpo,

        responsavel_id:
            responsavelId
    };

    try {

        const resposta =
            await requisicaoApi(
                '/recursos/',
                {
                    method: 'POST',

                    body: JSON.stringify(dados)
                }
            );

        const resultado =
            await lerJson(resposta);

        if (resposta.status === 401) {

            tratarSessaoExpirada();

            return;
        }

        if (resposta.status === 403) {

            alert(
                `❌ ${
                    resultado.erro ||
                    'Você não possui permissão.'
                }`
            );

            return;
        }

        if (!resposta.ok) {

            alert(
                `❌ ${
                    resultado.erro ||
                    'Erro ao cadastrar ativo'
                }`
            );

            return;
        }

        alert('✅ Ativo cadastrado com sucesso!');

        elementos.formCadastro.reset();

        const botaoInventario =
            document.querySelector(
                '.botao-nav[data-pagina="inventario"]'
            );

        if (botaoInventario) {

            botaoInventario.click();

        } else {

            await carregarInventario();
        }

    } catch (erro) {

        console.error(
            'Erro ao cadastrar ativo:',
            erro
        );

        alert('⚠️ Erro de conexão com o servidor.');
    }
}
