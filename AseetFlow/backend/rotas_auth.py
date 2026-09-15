# =============================================================================
#  ASSETFLOW — SISTEMA DE GESTÃO DE ATIVOS
#  Autor: Wellington Coelho
#  Arquivo: rotas_auth.py
#
#  Propósito:
#      Controlar autenticação, sessão, cadastro e listagem de usuários,
#      além das permissões de acesso do sistema.
#
#  Arquitetura:
#      - modelos.py possui a instância única "db"
#      - app.py inicializa essa instância
#      - este arquivo utiliza os modelos já vinculados ao aplicativo
#
#  Níveis:
#      1 — Colaborador
#      2 — Gerente
#      3 — Administrador
# =============================================================================


from flask import Blueprint, request, jsonify, session
from functools import wraps
from sqlalchemy.exc import IntegrityError
import os
import re

from modelos import db, Usuario


# =============================================================================
#  BLUEPRINT
# =============================================================================

auth_bp = Blueprint(
    'auth',
    __name__
)


# =============================================================================
#  VALIDAÇÃO DE E-MAIL
# =============================================================================

EMAIL_REGEX = re.compile(
    r'^[^@\s]+@[^@\s]+\.[^@\s]+$'
)


# =============================================================================
#  FUNÇÕES AUXILIARES
# =============================================================================

def normalizar_email(email):
    """
    Remove espaços e converte o e-mail para letras minúsculas.

    Exemplo:

        " Admin@Empresa.com "
             ↓
        "admin@empresa.com"
    """

    if not isinstance(email, str):
        return ''

    return email.strip().lower()


def obter_usuario_sessao():
    """
    Recupera o usuário atualmente autenticado.

    Retorna:
        Usuario -> quando existe sessão válida
        None    -> quando não existe sessão válida
    """

    usuario_id = session.get('usuario_id')

    if not usuario_id:
        return None

    usuario = db.session.get(
        Usuario,
        usuario_id
    )

    if usuario is None:

        # A sessão aponta para um usuário que não existe mais no banco.
        session.clear()

        return None

    return usuario


# =============================================================================
#  PROTEÇÃO — LOGIN OBRIGATÓRIO
# =============================================================================

def login_obrigatorio(funcao):
    """
    Impede acesso a uma rota quando não existe
    usuário autenticado.

    A função protegida recebe automaticamente
    o usuário atualmente logado como primeiro argumento.
    """

    @wraps(funcao)
    def funcao_protegida(*args, **kwargs):

        usuario = obter_usuario_sessao()

        if usuario is None:

            return jsonify({
                'erro': 'Faça login para acessar este recurso'
            }), 401

        return funcao(
            usuario,
            *args,
            **kwargs
        )

    return funcao_protegida


# =============================================================================
#  PROTEÇÃO — NÍVEL DE PERMISSÃO
# =============================================================================

def permissao_requerida(nivel_minimo):
    """
    Protege uma rota verificando o nível mínimo necessário.

    Exemplo:

        @permissao_requerida(2)

    permite acesso a:

        Gerente       → nível 2
        Administrador → nível 3
    """

    def decorador(funcao):

        @wraps(funcao)
        def funcao_protegida(*args, **kwargs):

            usuario = obter_usuario_sessao()

            if usuario is None:

                return jsonify({
                    'erro': 'Faça login para continuar'
                }), 401

            if not usuario.tem_permissao(
                nivel_minimo
            ):

                return jsonify({
                    'erro': 'Você não tem permissão para esta ação'
                }), 403

            return funcao(
                usuario,
                *args,
                **kwargs
            )

        return funcao_protegida

    return decorador


# =============================================================================
#  LOGIN
# =============================================================================

@auth_bp.route(
    '/login',
    methods=['POST']
)
def login():

    # silent=True evita erro automático caso
    # o corpo da requisição não contenha JSON válido.
    dados = request.get_json(
        silent=True
    ) or {}

    email = normalizar_email(
        dados.get('email')
    )

    senha = dados.get(
        'senha',
        ''
    )

    # -------------------------------------------------------------------------
    # CAMPOS OBRIGATÓRIOS
    # -------------------------------------------------------------------------

    if not email or not senha:

        return jsonify({
            'erro': 'Informe e-mail e senha'
        }), 400

    # -------------------------------------------------------------------------
    # BUSCA DO USUÁRIO
    # -------------------------------------------------------------------------

    usuario = Usuario.query.filter_by(
        email=email
    ).first()

    # -------------------------------------------------------------------------
    # VERIFICAÇÃO
    # -------------------------------------------------------------------------

    if (
        usuario is None
        or not usuario.verificar_senha(senha)
    ):

        # Mensagem propositalmente genérica.
        # Não informamos se foi o e-mail ou a senha que falhou.
        return jsonify({
            'erro': 'E-mail ou senha incorretos'
        }), 401

    # -------------------------------------------------------------------------
    # CRIAÇÃO DA SESSÃO
    # -------------------------------------------------------------------------

    # Limpa qualquer sessão anterior antes de criar
    # uma nova autenticação.
    session.clear()

    session['usuario_id'] = usuario.id

    return jsonify({
        'mensagem': (
            f'Bem-vindo, {usuario.nome}! '
            'Login realizado com sucesso.'
        ),
        'usuario': usuario.para_dict()
    }), 200


# =============================================================================
#  PERFIL DO USUÁRIO LOGADO
# =============================================================================

@auth_bp.route(
    '/perfil',
    methods=['GET']
)
@login_obrigatorio
def perfil(usuario_atual):

    return jsonify(
        usuario_atual.para_dict()
    ), 200


# =============================================================================
#  LOGOUT
# =============================================================================

@auth_bp.route(
    '/logout',
    methods=['POST']
)
@login_obrigatorio
def logout(usuario_atual):

    # Limpa toda a sessão Flask.
    session.clear()

    return jsonify({
        'mensagem': (
            'Sessão encerrada. '
            'Você foi desconectado com sucesso!'
        )
    }), 200


# =============================================================================
#  LISTAR USUÁRIOS
# =============================================================================

@auth_bp.route(
    '/usuarios',
    methods=['GET']
)
@permissao_requerida(2)
def listar_usuarios(usuario_atual):

    """
    Gerentes e administradores podem consultar a lista de usuários.

    Essa rota alimenta duas telas do frontend:

        - o seletor de "responsável" no cadastro de ativos
          (disponível para gerente e administrador)

        - a tela de Gestão de Usuários, que o frontend só exibe
          para administradores (nível 3). A rota de CRIAÇÃO de
          usuário (/cadastro) continua exigindo nível 3, então um
          gerente consegue apenas VER a lista, nunca criar contas.
    """

    usuarios = (
        Usuario.query
        .order_by(Usuario.nome.asc())
        .all()
    )

    return jsonify({

        'quantidade': len(usuarios),

        'usuarios': [
            usuario.para_dict()
            for usuario in usuarios
        ]

    }), 200


# =============================================================================
#  CADASTRO DE USUÁRIO
# =============================================================================

@auth_bp.route(
    '/cadastro',
    methods=['POST']
)
@permissao_requerida(3)
def cadastrar(usuario_atual):

    """
    Somente administradores podem criar usuários.

    Isso impede que alguém envie:

        nivel_permissao = 3

    pela internet e crie a própria conta administrativa.
    """

    dados = request.get_json(
        silent=True
    ) or {}

    nome = dados.get(
        'nome',
        ''
    )

    email = normalizar_email(
        dados.get('email')
    )

    senha = dados.get(
        'senha',
        ''
    )

    nivel_permissao = dados.get(
        'nivel_permissao',
        1
    )


    # -------------------------------------------------------------------------
    # NOME
    # -------------------------------------------------------------------------

    if not isinstance(nome, str):

        return jsonify({
            'erro': 'Nome inválido'
        }), 400

    nome = nome.strip()

    if not nome:

        return jsonify({
            'erro': 'Informe o nome do usuário'
        }), 400

    if len(nome) > 100:

        return jsonify({
            'erro': 'O nome deve possuir no máximo 100 caracteres'
        }), 400


    # -------------------------------------------------------------------------
    # E-MAIL
    # -------------------------------------------------------------------------

    if not email:

        return jsonify({
            'erro': 'Informe o e-mail'
        }), 400

    if len(email) > 120:

        return jsonify({
            'erro': 'O e-mail é muito longo'
        }), 400

    if not EMAIL_REGEX.match(email):

        return jsonify({
            'erro': 'Informe um e-mail válido'
        }), 400


    # -------------------------------------------------------------------------
    # SENHA
    # -------------------------------------------------------------------------

    if not isinstance(senha, str):

        return jsonify({
            'erro': 'Senha inválida'
        }), 400

    if len(senha) < 8:

        return jsonify({
            'erro': 'A senha deve possuir pelo menos 8 caracteres'
        }), 400


    # -------------------------------------------------------------------------
    # NÍVEL DE PERMISSÃO
    # -------------------------------------------------------------------------

    try:

        nivel_permissao = int(
            nivel_permissao
        )

    except (TypeError, ValueError):

        return jsonify({
            'erro': 'Nível de permissão inválido'
        }), 400


    if nivel_permissao not in (
        1,
        2,
        3
    ):

        return jsonify({
            'erro': (
                'O nível de permissão deve ser '
                '1, 2 ou 3'
            )
        }), 400


    # -------------------------------------------------------------------------
    # VERIFICA SE O E-MAIL JÁ EXISTE
    # -------------------------------------------------------------------------

    usuario_existente = (
        Usuario.query
        .filter_by(email=email)
        .first()
    )

    if usuario_existente:

        return jsonify({
            'erro': 'Este e-mail já está em uso no sistema'
        }), 409


    # -------------------------------------------------------------------------
    # CRIA USUÁRIO
    # -------------------------------------------------------------------------

    novo_usuario = Usuario(
        nome=nome,
        email=email,
        senha=senha,
        nivel_permissao=nivel_permissao
    )


    try:

        db.session.add(
            novo_usuario
        )

        db.session.commit()

    except IntegrityError:

        db.session.rollback()

        return jsonify({
            'erro': (
                'Não foi possível cadastrar o usuário. '
                'Verifique se o e-mail já está registrado.'
            )
        }), 409


    return jsonify({
        'mensagem': 'Usuário cadastrado com sucesso!',
        'usuario': novo_usuario.para_dict()
    }), 201


# =============================================================================
#  CRIAÇÃO INICIAL DO ADMINISTRADOR
# =============================================================================

def criar_usuario_administrador(
    senha_admin,
    email_admin=None
):
    """
    Cria o administrador inicial do sistema.

    Esta função NÃO é uma rota pública.

    Ela é utilizada durante a inicialização da aplicação
    quando ainda não existe um administrador cadastrado.

    O e-mail pode ser recebido diretamente ou obtido
    através da variável ADMIN_EMAIL do arquivo .env.

    A senha deve ser recebida através da configuração
    ADMIN_PASSWORD definida no ambiente.

    A função verifica primeiro se o administrador já existe,
    evitando duplicação de registros a cada reinício do servidor.
    """

    # -------------------------------------------------------------------------
    # E-MAIL DO ADMINISTRADOR
    # -------------------------------------------------------------------------

    if email_admin is None:

        email_admin = os.environ.get(
            'ADMIN_EMAIL',
            ''
        )

    email_admin = normalizar_email(
        email_admin
    )

    if not email_admin:

        raise ValueError(
            'ADMIN_EMAIL não definido.'
        )

    if not EMAIL_REGEX.match(
        email_admin
    ):

        raise ValueError(
            'ADMIN_EMAIL possui formato inválido.'
        )


    # -------------------------------------------------------------------------
    # VERIFICA SE O ADMINISTRADOR JÁ EXISTE
    # -------------------------------------------------------------------------

    admin = Usuario.query.filter_by(
        email=email_admin
    ).first()

    if admin:

        print(
            'ℹ️  O administrador inicial já existe.'
        )

        return admin


    # -------------------------------------------------------------------------
    # VALIDA A SENHA
    # -------------------------------------------------------------------------

    if not isinstance(
        senha_admin,
        str
    ):

        raise ValueError(
            'A senha do administrador deve ser texto.'
        )

    senha_admin = senha_admin.strip()

    if len(senha_admin) < 8:

        raise ValueError(
            'A senha do administrador deve possuir '
            'pelo menos 8 caracteres.'
        )


    # -------------------------------------------------------------------------
    # CRIA O ADMINISTRADOR
    # -------------------------------------------------------------------------

    admin = Usuario(
        nome='Administrador AssetFlow',
        email=email_admin,
        senha=senha_admin,
        nivel_permissao=3
    )


    try:

        db.session.add(
            admin
        )

        db.session.commit()

    except IntegrityError:

        db.session.rollback()

        raise


    print(
        '✅ Administrador inicial criado com sucesso!'
    )

    return admin
