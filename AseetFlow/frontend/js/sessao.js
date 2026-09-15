// =============================================================================
//  ASSETFLOW — FRONTEND
//  Autor: Wellington Coelho
//  Arquivo: sessao.js
//
//  Propósito:
//      Controlar login, logout e a verificação da sessão Flask
//      ao abrir a aplicação.
//
//  Arquitetura:
//      - Flask controla a autenticação através de sessão (cookie).
//      - O navegador NÃO decide sozinho se o usuário está autenticado.
//      - Ao abrir a aplicação, /api/auth/perfil valida a sessão atual.
//      - Todas as operações protegidas utilizam a mesma sessão.
// =============================================================================


// =============================================================================
//  ESTADO DA APLICAÇÃO
// =============================================================================

// Guarda somente os dados do usuário enquanto a página estiver aberta.
//
// A autenticação verdadeira continua sendo controlada
// exclusivamente pela sessão Flask — este objeto é só uma cópia
// para uso visual (nome, nível) durante a navegação.
let usuarioAtual = null;


// =============================================================================
//  VERIFICAR SESSÃO AO ABRIR O SISTEMA
// =============================================================================

async function verificarSessao() {

    mostrarTelaLogin();

    try {

        const resposta = await requisicaoApi(
            '/auth/perfil'
        );

        // Não existe sessão válida.
        if (!resposta.ok) {

            usuarioAtual = null;

            mostrarTelaLogin();

            return;
        }

        const usuario =
            await lerJson(resposta);

        usuarioAtual = usuario;

        await entrarNoSistema(
            usuarioAtual
        );

    } catch (erro) {

        console.error(
            'Erro ao verificar sessão:',
            erro
        );

        mostrarTelaLogin();

        mostrarMensagem(
            '⚠️ Não foi possível conectar ao servidor.',
            'erro'
        );
    }
}


// =============================================================================
//  CONFIGURAR LOGIN
// =============================================================================

function configurarLogin() {

    if (!elementos.formLogin) {
        return;
    }

    elementos.formLogin.addEventListener(
        'submit',
        async (evento) => {

            evento.preventDefault();

            await realizarLogin();
        }
    );
}


// =============================================================================
//  LOGIN
// =============================================================================

async function realizarLogin() {

    const campoEmail =
        document.getElementById('email');

    const campoSenha =
        document.getElementById('senha');

    if (!campoEmail || !campoSenha) {

        mostrarMensagem(
            '❌ Formulário de login incompleto.',
            'erro'
        );

        return;
    }

    const email =
        campoEmail.value.trim();

    const senha =
        campoSenha.value;

    if (!email || !senha) {

        mostrarMensagem(
            'Informe e-mail e senha.',
            'erro'
        );

        return;
    }

    mostrarMensagem(
        'Autenticando...',
        'sucesso'
    );

    try {

        const resposta = await requisicaoApi(
            '/auth/login',
            {
                method: 'POST',

                body: JSON.stringify({
                    email,
                    senha
                })
            }
        );

        const resultado =
            await lerJson(resposta);

        if (!resposta.ok) {

            usuarioAtual = null;

            mostrarMensagem(
                `❌ ${
                    resultado.erro ||
                    'Falha na autenticação'
                }`,
                'erro'
            );

            return;
        }

        // O backend criou a sessão Flask.
        //
        // Guardamos os dados apenas em memória para
        // utilização visual durante esta página.
        usuarioAtual =
            resultado.usuario;

        mostrarMensagem(
            `✅ ${resultado.mensagem}`,
            'sucesso'
        );

        await entrarNoSistema(
            usuarioAtual
        );

    } catch (erro) {

        console.error(
            'Erro no login:',
            erro
        );

        mostrarMensagem(
            '⚠️ Servidor indisponível. Verifique se o backend está rodando.',
            'erro'
        );
    }
}


// =============================================================================
//  ENTRAR NO SISTEMA
// =============================================================================

async function entrarNoSistema(usuario) {

    if (!usuario) {
        return;
    }

    usuarioAtual = usuario;

    if (elementos.areaLogin) {

        elementos.areaLogin.classList.add(
            'oculto'
        );
    }

    if (elementos.areaSistema) {

        elementos.areaSistema.classList.remove(
            'oculto'
        );
    }

    if (elementos.nomeUsuario) {

        elementos.nomeUsuario.textContent =
            usuario.nome || '';
    }

    if (elementos.nivelUsuario) {

        elementos.nivelUsuario.textContent =
            traduzirNivel(
                usuario.nivel_permissao
            );
    }

    aplicarPermissoesInterface(
        usuario
    );

    // Gerente e administrador precisam da lista de usuários
    // para escolher o responsável ao cadastrar/editar um ativo.
    if (Number(usuario.nivel_permissao) >= 2) {

        await carregarUsuariosParaSelects();
    }

    // Abre o inventário como página inicial.
    const botaoInventario =
        document.querySelector(
            '.botao-nav[data-pagina="inventario"]'
        );

    if (botaoInventario) {

        botaoInventario.click();

    } else {

        await carregarInventario();
    }
}


// =============================================================================
//  CONFIGURAR LOGOUT
// =============================================================================

function configurarLogout() {

    if (!elementos.botaoSair) {
        return;
    }

    elementos.botaoSair.addEventListener(
        'click',
        async () => {

            await realizarLogout();
        }
    );
}


// =============================================================================
//  LOGOUT
// =============================================================================

async function realizarLogout() {

    try {

        // O logout também encerra a sessão no backend,
        // não apenas na tela.
        await requisicaoApi(
            '/auth/logout',
            {
                method: 'POST'
            }
        );

    } catch (erro) {

        console.error(
            'Erro ao encerrar sessão:',
            erro
        );

    } finally {

        usuarioAtual = null;

        mostrarTelaLogin();

        if (elementos.formLogin) {

            elementos.formLogin.reset();
        }

        if (elementos.caixaMensagem) {

            elementos.caixaMensagem.textContent =
                '';
        }

        elementos.botoesNav.forEach(
            botao => {

                botao.classList.remove(
                    'ativo'
                );
            }
        );
    }
}


// =============================================================================
//  MOSTRAR TELA DE LOGIN
// =============================================================================

function mostrarTelaLogin() {

    if (elementos.areaSistema) {

        elementos.areaSistema.classList.add(
            'oculto'
        );
    }

    if (elementos.areaLogin) {

        elementos.areaLogin.classList.remove(
            'oculto'
        );
    }
}


// =============================================================================
//  TRATAR SESSÃO EXPIRADA
// =============================================================================
//
// Chamada por qualquer página que receba um 401 da API
// depois que o usuário já estava logado (ex.: sessão expirou
// no servidor enquanto a aba ficou aberta).
// =============================================================================

function tratarSessaoExpirada() {

    usuarioAtual = null;

    mostrarTelaLogin();

    mostrarMensagem(
        'Sua sessão expirou. Faça login novamente.',
        'erro'
    );
}
