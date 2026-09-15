// =============================================================================
//  ASSETFLOW — FRONTEND
//  Autor: Wellington Coelho
//  Arquivo: api.js
//
//  Propósito:
//      Concentrar toda a comunicação HTTP com o backend Flask.
//
//      Nenhum outro arquivo deve chamar "fetch" diretamente —
//      todos passam por "requisicaoApi", garantindo que a sessão
//      seja sempre enviada corretamente.
// =============================================================================


// =============================================================================
//  REQUISIÇÃO PADRÃO PARA A API
// =============================================================================

async function requisicaoApi(
    caminho,
    opcoes = {}
) {

    const configuracao = {
        ...opcoes,

        // A sessão Flask utiliza cookie.
        //
        // Como frontend e backend estão na mesma origem,
        // "same-origin" é a configuração adequada.
        credentials: 'same-origin',

        headers: {
            ...(opcoes.headers || {})
        }
    };


    // Só adiciona Content-Type JSON quando existe corpo na requisição.
    if (
        configuracao.body &&
        !configuracao.headers['Content-Type']
    ) {

        configuracao.headers['Content-Type'] =
            'application/json';
    }


    return fetch(
        `${API_URL}${caminho}`,
        configuracao
    );
}


// =============================================================================
//  LER JSON COM SEGURANÇA
// =============================================================================

async function lerJson(resposta) {

    try {

        return await resposta.json();

    } catch (erro) {

        // Uma resposta sem corpo JSON (ex.: erro de rede bruto)
        // não deve quebrar quem chamou esta função.
        return {};
    }
}
