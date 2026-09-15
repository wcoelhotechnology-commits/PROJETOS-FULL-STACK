# =============================================================================
#  ASSETFLOW — TESTES AUTOMATIZADOS
#  Autor: Wellington Coelho
#  Arquivo: conftest.py
#
#  Propósito:
#      Preparar um ambiente de testes isolado, com banco de dados
#      em memória, sem depender do .env real nem do banco SQLite
#      usado em desenvolvimento.
#
#      O pytest carrega este arquivo automaticamente antes de
#      executar qualquer teste na pasta "testes".
# =============================================================================


import os
import sys

import pytest


# =============================================================================
#  VARIÁVEIS DE AMBIENTE DE TESTE
# =============================================================================
#
# Precisam ser definidas ANTES de importar app.py, pois app.py lê
# essas variáveis assim que o módulo é carregado.
# =============================================================================

os.environ['SECRET_KEY'] = 'chave-secreta-usada-apenas-nos-testes'
os.environ['ADMIN_EMAIL'] = 'admin@teste.com'
os.environ['ADMIN_PASSWORD'] = 'SenhaDeTeste123'
os.environ['FLASK_DEBUG'] = 'false'


# Garante que a pasta "backend" (um nível acima de "testes")
# está no caminho de importação do Python.
sys.path.insert(
    0,
    os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            '..'
        )
    )
)


# =============================================================================
#  FIXTURE: APLICAÇÃO CONFIGURADA PARA TESTES
# =============================================================================

@pytest.fixture()
def app():
    """
    Cria uma instância da aplicação Flask usando um banco de dados
    SQLite em memória — cada execução de teste começa com o banco
    completamente vazio (exceto o administrador inicial).
    """

    import app as modulo_app

    modulo_app.app.config['TESTING'] = True

    modulo_app.app.config['SQLALCHEMY_DATABASE_URI'] = (
        'sqlite:///:memory:'
    )

    with modulo_app.app.app_context():

        modulo_app.db.drop_all()

        modulo_app.db.create_all()

        modulo_app.criar_usuario_administrador(
            senha_admin=os.environ['ADMIN_PASSWORD'],
            email_admin=os.environ['ADMIN_EMAIL']
        )

    yield modulo_app.app


# =============================================================================
#  FIXTURE: CLIENTE HTTP DE TESTE
# =============================================================================

@pytest.fixture()
def cliente(app):
    """
    Cliente de testes do Flask.

    Permite simular requisições HTTP (GET, POST, PUT, DELETE)
    sem precisar de um servidor rodando de verdade.
    """

    return app.test_client()


# =============================================================================
#  FIXTURE: CLIENTE JÁ AUTENTICADO COMO ADMINISTRADOR
# =============================================================================

@pytest.fixture()
def cliente_admin(cliente):
    """
    Retorna um cliente de testes que já realizou login
    como o administrador inicial.

    Útil para testar rotas protegidas sem repetir
    o login em cada teste.
    """

    cliente.post(
        '/api/auth/login',
        json={
            'email': os.environ['ADMIN_EMAIL'],
            'senha': os.environ['ADMIN_PASSWORD']
        }
    )

    return cliente
