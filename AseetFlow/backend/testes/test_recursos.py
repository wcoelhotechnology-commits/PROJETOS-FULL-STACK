# =============================================================================
#  ASSETFLOW — TESTES AUTOMATIZADOS
#  Autor: Wellington Coelho
#  Arquivo: test_recursos.py
#
#  Propósito:
#      Testar o CRUD de ativos e as regras de permissão
#      (rotas_recursos.py).
# =============================================================================


ATIVO_EXEMPLO = {
    'nome': 'Notebook Corporativo',
    'tipo': 'Equipamento de TI',
    'descricao': 'Notebook usado pela equipe de campo',
    'status': 'disponível',
    'localizacao': 'Sede · Sala 302'
}


# =============================================================================
#  LISTAR ATIVOS SEM AUTENTICAÇÃO É BLOQUEADO
# =============================================================================

def test_listar_ativos_sem_autenticacao(cliente):

    resposta = cliente.get(
        '/api/recursos/'
    )

    assert resposta.status_code == 401


# =============================================================================
#  CADASTRAR ATIVO COM SUCESSO
# =============================================================================

def test_cadastrar_ativo_com_sucesso(cliente_admin):

    resposta = cliente_admin.post(
        '/api/recursos/',
        json=ATIVO_EXEMPLO
    )

    corpo = resposta.get_json()

    assert resposta.status_code == 201
    assert corpo['recurso']['nome'] == ATIVO_EXEMPLO['nome']
    assert corpo['recurso']['status'] == 'disponível'


# =============================================================================
#  NÃO PERMITE CADASTRO DUPLICADO
# =============================================================================

def test_nao_permite_ativo_duplicado(cliente_admin):

    cliente_admin.post(
        '/api/recursos/',
        json=ATIVO_EXEMPLO
    )

    resposta_duplicada = cliente_admin.post(
        '/api/recursos/',
        json=ATIVO_EXEMPLO
    )

    assert resposta_duplicada.status_code == 409


# =============================================================================
#  EDITAR ATIVO ATUALIZA OS CAMPOS ENVIADOS
# =============================================================================

def test_editar_ativo(cliente_admin):

    resposta_cadastro = cliente_admin.post(
        '/api/recursos/',
        json=ATIVO_EXEMPLO
    )

    ativo_id = resposta_cadastro.get_json()['recurso']['id']

    resposta_edicao = cliente_admin.put(
        f'/api/recursos/{ativo_id}',
        json={'status': 'em manutenção'}
    )

    corpo = resposta_edicao.get_json()

    assert resposta_edicao.status_code == 200
    assert corpo['recurso']['status'] == 'em manutenção'


# =============================================================================
#  EXCLUIR ATIVO REQUER NÍVEL DE ADMINISTRADOR
# =============================================================================

def test_gerente_nao_pode_excluir_ativo(cliente_admin):

    # Cria um gerente (nível 2).
    cliente_admin.post(
        '/api/auth/cadastro',
        json={
            'nome': 'Gerente Teste',
            'email': 'gerente@teste.com',
            'senha': 'SenhaValida123',
            'nivel_permissao': 2
        }
    )

    resposta_cadastro = cliente_admin.post(
        '/api/recursos/',
        json=ATIVO_EXEMPLO
    )

    ativo_id = resposta_cadastro.get_json()['recurso']['id']

    # Sai do administrador e entra como gerente.
    cliente_admin.post('/api/auth/logout')

    cliente_admin.post(
        '/api/auth/login',
        json={
            'email': 'gerente@teste.com',
            'senha': 'SenhaValida123'
        }
    )

    resposta_exclusao = cliente_admin.delete(
        f'/api/recursos/{ativo_id}'
    )

    assert resposta_exclusao.status_code == 403


# =============================================================================
#  FILTRO POR STATUS FUNCIONA CORRETAMENTE
# =============================================================================

def test_filtro_por_status(cliente_admin):

    cliente_admin.post(
        '/api/recursos/',
        json=ATIVO_EXEMPLO
    )

    cliente_admin.post(
        '/api/recursos/',
        json={
            **ATIVO_EXEMPLO,
            'nome': 'Impressora Corporativa',
            'status': 'inativo'
        }
    )

    resposta = cliente_admin.get(
        '/api/recursos/?status=inativo'
    )

    corpo = resposta.get_json()

    assert resposta.status_code == 200
    assert corpo['quantidade'] == 1
    assert corpo['recursos'][0]['nome'] == 'Impressora Corporativa'
