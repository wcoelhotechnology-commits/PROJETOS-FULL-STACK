// =============================================================================
//  ASSETFLOW — FRONTEND
//  Autor: Wellington Coelho
//  Arquivo: utilidades.js
//
//  Propósito:
//      Reunir pequenas funções auxiliares que não pertencem
//      a nenhuma página específica e são usadas em vários lugares.
// =============================================================================


// =============================================================================
//  TRADUZIR NÍVEL DE PERMISSÃO
// =============================================================================

function traduzirNivel(nivel) {

    return NIVEIS_PERMISSAO[nivel] ||
        'Não definido';
}


// =============================================================================
//  DEBOUNCE
// =============================================================================
//
// Evita disparar uma função a cada tecla digitada.
//
// Só executa a função depois que o usuário para de digitar
// pelo tempo definido em "atraso" (em milissegundos).
// =============================================================================

function debounce(
    funcao,
    atraso
) {

    let temporizador;

    return (...args) => {

        clearTimeout(
            temporizador
        );

        temporizador =
            setTimeout(
                () => {

                    funcao(...args);
                },
                atraso
            );
    };
}


// =============================================================================
//  EXIBIR MENSAGENS NA TELA DE LOGIN
// =============================================================================

function mostrarMensagem(
    texto,
    tipo
) {

    if (!elementos.caixaMensagem) {
        return;
    }

    elementos.caixaMensagem.textContent =
        texto;

    elementos.caixaMensagem.className =
        `caixa-mensagem ${tipo}`;
}


// =============================================================================
//  REMOVER EMOJI DE UM VALOR DE <select>
// =============================================================================
//
// Os <option> de status usam emojis apenas para facilitar a leitura
// (🟢 Disponível, 🟡 Em Uso...). Antes de enviar o valor para a API,
// removemos o emoji e ficamos só com o texto puro.
// =============================================================================

function limparEmojiDeStatus(valor) {

    return String(valor || '')
        .replace(
            /^[🟢🟡🟠🔴]\s*/,
            ''
        )
        .trim();
}
