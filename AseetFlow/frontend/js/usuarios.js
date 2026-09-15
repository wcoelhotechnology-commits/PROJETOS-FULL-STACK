// =============================================================================
//  ASSETFLOW — FRONTEND
//  Autor: Wellington Coelho
//  Arquivo: usuarios.js
//
//  Propósito:
//      Tudo relacionado a usuários no frontend:
//
//          - preencher os seletores de "responsável" usados no
//            cadastro e na edição de ativos;
//          - carregar a lista de usuários na página de administração;
//          - cadastrar um novo usuário (somente administrador).
// =============================================================================


// =============================================================================
//  CARREGAR USUÁRIOS PARA OS SELETORES DE "RESPONSÁVEL"
// =============================================================================

async function carregarUsuariosParaSelects() {

    try {

        const resposta =
            await requisicaoApi('/auth/usuarios');

        if (!resposta.ok) {
            return;
        }

        const resultado =
            await lerJson(resposta);

        const usuarios =
            Array.isArray(resultado.usuarios)
                ? resultado.usuarios
                : [];

        preencherSelectDeResponsavel(
            elementos.selectResponsavelCadastro,
            usuarios
        );

        preencherSelectDeResponsavel(
            elementos.selectResponsavelEdicao,
            usuarios
        );

    } catch (erro) {

        console.error(
            'Erro ao carregar usuários para os seletores:',
            erro
        );
    }
}


function preencherSelectDeResponsavel(
    selectElemento,
    usuarios
) {

    if (!selectElemento) {
        return;
    }

    // Mantém sempre a primeira opção ("Nenhum responsável definido")
    // e substitui apenas as opções seguintes.
    selectElemento.innerHTML =
        '<option value="">Nenhum responsável definido</option>';

    usuarios.forEach(
        usuario => {

            const opcao =
                document.createElement('option');

            opcao.value =
                usuario.id;

            opcao.textContent =
                `${usuario.nome} (${traduzirNivel(usuario.nivel_permissao)})`;

            selectElemento.appendChild(
                opcao
            );
        }
    );
}


// =============================================================================
//  CARREGAR LISTA DE USUÁRIOS (PÁGINA DE ADMINISTRAÇÃO)
// =============================================================================

async function carregarListaUsuarios() {

    if (!elementos.listaUsuarios) {
        return;
    }

    elementos.listaUsuarios.innerHTML =
        '<p class="mensagem-vazia">Carregando usuários...</p>';

    try {

        const resposta =
            await requisicaoApi('/auth/usuarios');

        if (resposta.status === 401) {

            tratarSessaoExpirada();

            return;
        }

        const resultado =
            await lerJson(resposta);

        if (!resposta.ok) {

            elementos.listaUsuarios.innerHTML =
                `<p class="mensagem-vazia">${
                    resultado.erro ||
                    'Erro ao carregar usuários.'
                }</p>`;

            return;
        }

        const usuarios =
            Array.isArray(resultado.usuarios)
                ? resultado.usuarios
                : [];

        if (usuarios.length === 0) {

            elementos.listaUsuarios.innerHTML =
                '<p class="mensagem-vazia">Nenhum usuário cadastrado.</p>';

            return;
        }

        elementos.listaUsuarios.innerHTML = '';

        usuarios.forEach(
            usuario => {

                renderizarUsuario(
                    usuario
                );
            }
        );

    } catch (erro) {

        console.error(
            'Erro ao carregar lista de usuários:',
            erro
        );

        elementos.listaUsuarios.innerHTML =
            '<p class="mensagem-vazia">❌ Erro ao carregar dados.</p>';
    }
}


function renderizarUsuario(usuario) {

    const item =
        document.createElement('div');

    item.className =
        'item-recurso';

    const nome =
        document.createElement('strong');

    nome.textContent =
        usuario.nome || 'Sem nome';

    item.appendChild(nome);

    item.appendChild(
        document.createTextNode(` — ${usuario.email} `)
    );

    const nivel =
        document.createElement('span');

    nivel.className =
        `etiqueta-nivel etiqueta-nivel-${usuario.nivel_permissao}`;

    nivel.textContent =
        traduzirNivel(usuario.nivel_permissao);

    item.appendChild(nivel);

    elementos.listaUsuarios.appendChild(item);
}


// =============================================================================
//  CONFIGURAR CADASTRO DE USUÁRIO
// =============================================================================

function configurarCadastroUsuario() {

    if (!elementos.formUsuario) {
        return;
    }

    elementos.formUsuario.addEventListener(
        'submit',
        async (evento) => {

            evento.preventDefault();

            await cadastrarUsuario();
        }
    );
}


// =============================================================================
//  CADASTRAR USUÁRIO
// =============================================================================

async function cadastrarUsuario() {

    const campoNome =
        document.getElementById('usr-nome');

    const campoEmail =
        document.getElementById('usr-email');

    const campoSenha =
        document.getElementById('usr-senha');

    const campoNivel =
        document.getElementById('usr-nivel');

    if (
        !campoNome ||
        !campoEmail ||
        !campoSenha ||
        !campoNivel
    ) {

        alert('❌ O formulário de usuário está incompleto.');

        return;
    }

    const dados = {

        nome: campoNome.value.trim(),

        email: campoEmail.value.trim(),

        senha: campoSenha.value,

        nivel_permissao: Number(campoNivel.value)
    };

    try {

        const resposta =
            await requisicaoApi(
                '/auth/cadastro',
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

        if (!resposta.ok) {

            alert(
                `❌ ${
                    resultado.erro ||
                    'Erro ao cadastrar usuário'
                }`
            );

            return;
        }

        alert('✅ Usuário cadastrado com sucesso!');

        elementos.formUsuario.reset();

        await carregarListaUsuarios();

        // O novo usuário também precisa aparecer nos seletores
        // de "responsável" das telas de ativos.
        await carregarUsuariosParaSelects();

    } catch (erro) {

        console.error(
            'Erro ao cadastrar usuário:',
            erro
        );

        alert('⚠️ Erro de conexão com o servidor.');
    }
}
