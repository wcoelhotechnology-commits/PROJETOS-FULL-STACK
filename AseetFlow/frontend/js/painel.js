// =============================================================================
//  ASSETFLOW — FRONTEND
//  Autor: Wellington Coelho
//  Arquivo: painel.js
//
//  Propósito:
//      Calcular e exibir os indicadores da página "Painel Geral"
//      a partir da lista de ativos retornada pela API.
// =============================================================================


async function atualizarPainel() {

    try {

        const resposta =
            await requisicaoApi('/recursos/');

        const resultado =
            await lerJson(resposta);

        if (resposta.status === 401) {

            tratarSessaoExpirada();

            return;
        }

        if (
            !resposta.ok ||
            !Array.isArray(resultado.recursos)
        ) {

            return;
        }

        const todos =
            resultado.recursos;

        atualizarCartao(
            elementos.totalGeral,
            todos.length
        );

        atualizarCartao(
            elementos.totalDisponiveis,
            contarPorStatus(todos, 'disponível')
        );

        atualizarCartao(
            elementos.totalEmUso,
            contarPorStatus(todos, 'em uso')
        );

        atualizarCartao(
            elementos.totalManutencao,
            contarPorStatus(todos, 'em manutenção')
        );

        atualizarCartao(
            elementos.totalInativos,
            contarPorStatus(todos, 'inativo')
        );

    } catch (erro) {

        console.error(
            'Erro ao carregar painel:',
            erro
        );
    }
}


function contarPorStatus(
    ativos,
    status
) {

    return ativos.filter(
        ativo => ativo.status === status
    ).length;
}


function atualizarCartao(
    elemento,
    valor
) {

    if (!elemento) {
        return;
    }

    elemento.textContent =
        valor;
}
