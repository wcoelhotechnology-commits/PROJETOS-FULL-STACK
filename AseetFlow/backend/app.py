# =============================================================================
# ASSETFLOW — SISTEMA DE GESTÃO DE ATIVOS
# Arquivo: app.py
#
# Responsabilidade:
# - Inicializar a aplicação Flask
# - Carregar as configurações do ambiente
# - Configurar sessões e banco de dados
# - Registrar as rotas da API
# - Servir os arquivos do frontend
# - Criar e verificar as tabelas do sistema
# - Preparar o administrador inicial
#
# Versão: 1.0.0
# =============================================================================


# =============================================================================
# 1. IMPORTAÇÕES
# =============================================================================

from flask import Flask, jsonify, send_from_directory
from dotenv import load_dotenv
import os


# =============================================================================
# 2. CAMINHOS PRINCIPAIS DO PROJETO
# =============================================================================
#
# BASE_DIR:
#   aponta para a pasta backend.
#
# PASTA_PROJETO:
#   aponta para a raiz do projeto ("assetflow").
#
# Dessa forma, os caminhos não dependem da pasta onde o terminal foi aberto.
# =============================================================================

BASE_DIR = os.path.abspath(
    os.path.dirname(__file__)
)

PASTA_PROJETO = os.path.abspath(
    os.path.join(BASE_DIR, '..')
)


# =============================================================================
# 3. CARREGAMENTO DAS VARIÁVEIS DE AMBIENTE
# =============================================================================
#
# O arquivo .env fica na raiz do projeto:
#
# assetflow/
# ├── .env
# ├── .env.example
# ├── backend/
# └── frontend/
#
# O .env contém informações locais e sensíveis e NÃO deve ser enviado
# ao GitHub (por isso está listado no .gitignore).
#
# O .env.example permanece no repositório apenas como modelo,
# sem nenhuma credencial real.
# =============================================================================

CAMINHO_ENV = os.path.join(
    PASTA_PROJETO,
    '.env'
)

load_dotenv(
    CAMINHO_ENV
)


# =============================================================================
# 4. INICIALIZAÇÃO DA APLICAÇÃO FLASK
# =============================================================================

app = Flask(__name__)


# =============================================================================
# 5. CONFIGURAÇÃO DA CHAVE DE SESSÃO
# =============================================================================
#
# SECRET_KEY é utilizada pelo Flask para proteger os dados da sessão.
#
# A aplicação não utiliza chave secreta fixa no código-fonte.
# Ela deve ser definida no arquivo .env, e nunca reaproveitada
# entre ambientes diferentes (local, homologação, produção).
# =============================================================================

SECRET_KEY = os.environ.get(
    'SECRET_KEY',
    ''
).strip()


if not SECRET_KEY:

    raise RuntimeError(
        'SECRET_KEY não definida. '
        'Crie um arquivo .env na raiz do projeto '
        'com base no arquivo .env.example.'
    )


if SECRET_KEY == 'troque-por-uma-chave-secreta-forte':

    raise RuntimeError(
        'SECRET_KEY ainda está utilizando o valor de exemplo. '
        'Defina uma chave secreta própria no arquivo .env.'
    )


app.config['SECRET_KEY'] = SECRET_KEY


# =============================================================================
# 6. CONFIGURAÇÃO DOS COOKIES DE SESSÃO
# =============================================================================
#
# HTTPOnly:
# impede que JavaScript acesse diretamente o cookie de sessão.
#
# SameSite=Lax:
# reduz determinados riscos de envio indevido do cookie entre sites.
#
# SESSION_COOKIE_SECURE:
# ativado automaticamente quando a aplicação roda com HTTPS
# (ver variável APP_HTTPS mais abaixo). Em ambiente local com
# HTTP puro, ele fica desativado — senão o navegador descartaria
# o cookie de sessão.
# =============================================================================

app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

APP_HTTPS = os.environ.get(
    'APP_HTTPS',
    'false'
).strip().lower() in (
    '1',
    'true',
    'yes',
    'on'
)

app.config['SESSION_COOKIE_SECURE'] = APP_HTTPS


# =============================================================================
# 7. CAMINHO DO FRONTEND
# =============================================================================
#
# O frontend está localizado fora da pasta backend:
#
# assetflow/
# ├── backend/
# └── frontend/
# =============================================================================

PASTA_FRONTEND = os.path.join(
    PASTA_PROJETO,
    'frontend'
)


# =============================================================================
# 8. PASTA INSTANCE E BANCO DE DADOS
# =============================================================================
#
# O banco SQLite utilizado pelo sistema fica em:
#
# backend/instance/assetflow.db
#
# A pasta instance é criada automaticamente caso ainda não exista.
# =============================================================================

PASTA_INSTANCE = os.path.join(
    BASE_DIR,
    'instance'
)

os.makedirs(
    PASTA_INSTANCE,
    exist_ok=True
)

CAMINHO_BANCO = os.path.join(
    PASTA_INSTANCE,
    'assetflow.db'
)


# =============================================================================
# 9. CONFIGURAÇÃO DO SQLALCHEMY
# =============================================================================
#
# O caminho é normalizado antes de ser utilizado na URI do SQLite.
# =============================================================================

CAMINHO_BANCO_URI = CAMINHO_BANCO.replace(
    os.sep,
    '/'
)

app.config['SQLALCHEMY_DATABASE_URI'] = (
    f'sqlite:///{CAMINHO_BANCO_URI}'
)

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


# =============================================================================
# 10. IMPORTAÇÃO DOS MODELOS E INICIALIZAÇÃO DO BANCO
# =============================================================================
#
# Existe apenas uma instância SQLAlchemy no projeto.
#
# Ela é criada em modelos.py e inicializada neste arquivo.
# =============================================================================

from modelos import db, Usuario, Recurso

db.init_app(
    app
)


# =============================================================================
# 11. IMPORTAÇÃO DOS BLUEPRINTS E FUNÇÕES DE INICIALIZAÇÃO
# =============================================================================
#
# auth_bp:
#   autenticação, sessão e usuários.
#
# criar_usuario_administrador:
#   prepara o administrador inicial utilizando os dados do ambiente.
#
# recursos_bp:
#   consulta e gerenciamento dos ativos.
# =============================================================================

from rotas_auth import (
    auth_bp,
    criar_usuario_administrador
)

from rotas_recursos import recursos_bp


# =============================================================================
# 12. REGISTRO DAS ROTAS DA API
# =============================================================================

app.register_blueprint(
    auth_bp,
    url_prefix='/api/auth'
)

app.register_blueprint(
    recursos_bp,
    url_prefix='/api/recursos'
)


# =============================================================================
# 13. ROTA DE STATUS DA APLICAÇÃO
# =============================================================================
#
# Permite verificar rapidamente se o backend está respondendo.
#
# Endereço padrão:
#
# http://127.0.0.1:5000/api/status
# =============================================================================

@app.route(
    '/api/status',
    methods=['GET']
)
def status_sistema():

    return jsonify({
        'mensagem': 'AssetFlow operacional',
        'status': 'online',
        'versao': '1.0.0'
    })


# =============================================================================
# 14. PÁGINA PRINCIPAL
# =============================================================================
#
# A aplicação utiliza a interface principal:
#
# frontend/index.html
# =============================================================================

@app.route('/')
def pagina_principal():

    return send_from_directory(
        PASTA_FRONTEND,
        'index.html'
    )


# =============================================================================
# 15. SERVIÇO DOS ARQUIVOS DO FRONTEND
# =============================================================================
#
# Permite que o Flask entregue arquivos como:
#
# - css/*.css
# - js/*.js
# - imagens
# - demais arquivos estáticos
#
# Se o caminho solicitado não corresponder a um arquivo existente,
# a aplicação retorna para index.html.
# =============================================================================

@app.route(
    '/<path:caminho_arquivo>'
)
def servir_frontend(
    caminho_arquivo
):

    # -------------------------------------------------------------------------
    # Evita que uma rota inexistente da API seja interpretada
    # como uma página do frontend.
    # -------------------------------------------------------------------------

    if caminho_arquivo.startswith(
        'api/'
    ):

        return jsonify({
            'erro': 'Rota da API não encontrada'
        }), 404


    caminho_completo = os.path.join(
        PASTA_FRONTEND,
        caminho_arquivo
    )


    # -------------------------------------------------------------------------
    # Se o arquivo existir, ele é enviado normalmente.
    # -------------------------------------------------------------------------

    if os.path.isfile(
        caminho_completo
    ):

        return send_from_directory(
            PASTA_FRONTEND,
            caminho_arquivo
        )


    # -------------------------------------------------------------------------
    # Caso contrário, retorna para a interface principal.
    # -------------------------------------------------------------------------

    return send_from_directory(
        PASTA_FRONTEND,
        'index.html'
    )


# =============================================================================
# 16. TRATAMENTO DO ERRO 404
# =============================================================================

@app.errorhandler(404)
def pagina_nao_encontrada(
    erro
):

    return jsonify({
        'erro': 'Endereço não encontrado'
    }), 404


# =============================================================================
# 17. TRATAMENTO DO ERRO 500
# =============================================================================

@app.errorhandler(500)
def erro_interno(
    erro
):

    return jsonify({
        'erro': 'Erro interno do servidor'
    }), 500


# =============================================================================
# 18. CONFIGURAÇÃO DO ADMINISTRADOR INICIAL
# =============================================================================
#
# ADMIN_EMAIL e ADMIN_PASSWORD são carregados do arquivo .env.
#
# Esses dados são utilizados somente para garantir que exista
# um administrador inicial no sistema.
#
# A senha nunca é exibida no terminal.
# =============================================================================

ADMIN_EMAIL = os.environ.get(
    'ADMIN_EMAIL',
    ''
).strip()

ADMIN_PASSWORD = os.environ.get(
    'ADMIN_PASSWORD',
    ''
)


if not ADMIN_EMAIL:

    raise RuntimeError(
        'ADMIN_EMAIL não definido no arquivo .env.'
    )


if not ADMIN_PASSWORD:

    raise RuntimeError(
        'ADMIN_PASSWORD não definido no arquivo .env.'
    )


if ADMIN_PASSWORD == 'troque-esta-senha':

    raise RuntimeError(
        'ADMIN_PASSWORD ainda está utilizando o valor de exemplo. '
        'Defina uma senha própria no arquivo .env.'
    )


# =============================================================================
# 19. CRIAÇÃO E VERIFICAÇÃO DO BANCO
# =============================================================================
#
# db.create_all():
#
# Cria somente as tabelas que ainda não existirem.
# Não substitui um sistema de migração de banco (ex.: Alembic),
# que seria o próximo passo natural em um projeto maior.
#
# criar_usuario_administrador():
#
# Verifica se o administrador inicial já existe.
#
# Se existir:
#   mantém o registro atual.
#
# Se não existir:
#   cria o administrador utilizando os dados do .env.
# =============================================================================

with app.app_context():

    db.create_all()

    criar_usuario_administrador(
        senha_admin=ADMIN_PASSWORD,
        email_admin=ADMIN_EMAIL
    )

    print(
        '✅ Banco conectado e tabelas verificadas!'
    )

    print(
        f'🗄️  Banco em: {CAMINHO_BANCO}'
    )

    print(
        f'🖥️  Frontend em: {PASTA_FRONTEND}'
    )


# =============================================================================
# 20. CONFIGURAÇÃO DA EXECUÇÃO LOCAL
# =============================================================================
#
# Valores padrão:
#
# FLASK_DEBUG = false
# APP_HOST    = 127.0.0.1
# APP_PORT    = 5000
#
# Essas configurações podem ser sobrescritas pelo arquivo .env.
# =============================================================================

APP_DEBUG = os.environ.get(
    'FLASK_DEBUG',
    'false'
).strip().lower() in (
    '1',
    'true',
    'yes',
    'on'
)


APP_HOST = os.environ.get(
    'APP_HOST',
    '127.0.0.1'
).strip()

if not APP_HOST:

    APP_HOST = '127.0.0.1'


try:

    APP_PORT = int(
        os.environ.get(
            'APP_PORT',
            '5000'
        )
    )

except ValueError:

    raise RuntimeError(
        'APP_PORT deve ser um número inteiro válido.'
    )


if APP_PORT < 1 or APP_PORT > 65535:

    raise RuntimeError(
        'APP_PORT deve estar entre 1 e 65535.'
    )


# =============================================================================
# 21. EXECUÇÃO DO SERVIDOR
# =============================================================================
#
# Este bloco só é executado quando app.py é iniciado diretamente:
#
# python app.py
# =============================================================================

if __name__ == '__main__':

    print(
        '🌐 Servidor iniciando...'
    )

    print(
        f'📍 Página principal: '
        f'http://{APP_HOST}:{APP_PORT}'
    )

    print(
        f'📡 Status da API: '
        f'http://{APP_HOST}:{APP_PORT}/api/status'
    )

    app.run(
        debug=APP_DEBUG,
        host=APP_HOST,
        port=APP_PORT
    )
