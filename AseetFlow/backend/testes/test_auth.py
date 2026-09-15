# =============================================================================
#  ASSETFLOW — TESTES AUTOMATIZADOS
#  Autor: Wellington Coelho
#  Arquivo: test_auth.py
#
#  Propósito:
#      Testar login, logout, sessão e proteção de rotas por nível
#      de permissão (rotas_auth.py).
# =============================================================================


import os


# =============================================================================
#  LOGIN COM CREDENCIAIS CORRETAS
# =============================================================================

def test_login_com_credenciais_corretas(cliente):

    resposta = cliente.post(
        '/api/auth/login',
        json={
            'email': os.environ['ADMIN_EMAIL'],
            'senha': os.environ['ADMIN_PASSWORD']
        }
    )

    corpo = resposta.get_json()

    assert resposta.status_code == 200
    assert corpo['usuario']['nivel_permissao'] == 3


# =============================================================================
#  LOGIN COM SENHA INCORRETA
# =============================================================================

def test_login_com_senha_incorreta(cliente):

    resposta = cliente.post(
        '/api/auth/login',
        json={
            'email': os.environ['ADMIN_EMAIL'],
            'senha': 'senha-errada-de-proposito'
        }
    )

    assert resposta.status_code == 401


# =============================================================================
#  LOGIN SEM E-MAIL OU SENHA
# =============================================================================

def test_login_sem_campos_obrigatorios(cliente):

    resposta = cliente.post(
        '/api/auth/login',
        json={}
    )

    assert resposta.status_code == 400


# =============================================================================
#  ROTA PROTEGIDA SEM SESSÃO
# =============================================================================

def test_perfil_sem_sessao_retorna_401(cliente):

    resposta = cliente.get(
        '/api/auth/perfil'
    )

    assert resposta.status_code == 401


# =============================================================================
#  ROTA PROTEGIDA COM SESSÃO VÁLIDA
# =============================================================================

def test_perfil_com_sessao_retorna_dados_do_usuario(cliente_admin):

    resposta = cliente_admin.get(
        '/api/auth/perfil'
    )

    corpo = resposta.get_json()

    assert resposta.status_code == 200
    assert corpo['email'] == os.environ['ADMIN_EMAIL']


# =============================================================================
#  LOGOUT ENCERRA A SESSÃO
# =============================================================================

def test_logout_encerra_sessao(cliente_admin):

    cliente_admin.post(
        '/api/auth/logout'
    )

    resposta = cliente_admin.get(
        '/api/auth/perfil'
    )

    assert resposta.status_code == 401


# =============================================================================
#  APENAS ADMINISTRADOR PODE CADASTRAR USUÁRIO
# =============================================================================

def test_colaborador_nao_pode_cadastrar_usuario(cliente):

    # Cria um colaborador comum diretamente no banco através
    # da rota de cadastro, usando o admin autenticado.
    cliente.post(
        '/api/auth/login',
        json={
            'email': os.environ['ADMIN_EMAIL'],
            'senha': os.environ['ADMIN_PASSWORD']
        }
    )

    resposta_cadastro = cliente.post(
        '/api/auth/cadastro',
        json={
            'nome': 'Colaborador Teste',
            'email': 'colaborador@teste.com',
            'senha': 'SenhaValida123',
            'nivel_permissao': 1
        }
    )

    assert resposta_cadastro.status_code == 201

    # Sai da conta de administrador e entra como colaborador.
    cliente.post('/api/auth/logout')

    cliente.post(
        '/api/auth/login',
        json={
            'email': 'colaborador@teste.com',
            'senha': 'SenhaValida123'
        }
    )

    # O colaborador tenta cadastrar outro usuário — deve ser bloqueado.
    resposta = cliente.post(
        '/api/auth/cadastro',
        json={
            'nome': 'Outro Usuário',
            'email': 'outro@teste.com',
            'senha': 'SenhaValida123',
            'nivel_permissao': 1
        }
    )

    assert resposta.status_code == 403


# =============================================================================
#  LISTAGEM DE USUÁRIOS É RESTRITA AO ADMINISTRADOR
# =============================================================================

def test_listar_usuarios_requer_nivel_administrador(cliente_admin):

    resposta = cliente_admin.get(
        '/api/auth/usuarios'
    )

    corpo = resposta.get_json()

    assert resposta.status_code == 200
    assert corpo['quantidade'] >= 1
