# =============================================================================
#  ASSETFLOW — SISTEMA DE GESTÃO DE ATIVOS
#  Autor: Wellington Coelho
#  Arquivo: rotas_recursos.py
#
#  Propósito:
#      Controlar cadastro, consulta, edição e exclusão dos ativos
#      da organização.
#
#  Permissões:
#      1 — Colaborador     → visualiza
#      2 — Gerente         → visualiza, cadastra e edita
#      3 — Administrador   → acesso completo, incluindo exclusão
#
#  Arquitetura:
#      - utiliza a instância única "db" de modelos.py
#      - utiliza os decorators de autenticação de rotas_auth.py
#      - retorna respostas JSON padronizadas
# =============================================================================


from flask import Blueprint, request, jsonify
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import joinedload

from modelos import db, Recurso, Usuario
from rotas_auth import login_obrigatorio, permissao_requerida


# =============================================================================
#  BLUEPRINT
# =============================================================================

recursos_bp = Blueprint(
    'recursos',
    __name__
)


# =============================================================================
#  VALORES ACEITOS
# =============================================================================

STATUS_VALIDOS = (
    'disponível',
    'em uso',
    'em manutenção',
    'inativo'
)


# =============================================================================
#  FUNÇÕES AUXILIARES
# =============================================================================

def normalizar_texto(valor):
    """
    Garante que o valor recebido seja texto limpo.

    Exemplos:

        " Notebook " -> "Notebook"
        None         -> ""
        123          -> ""
    """

    if valor is None:
        return ''

    if not isinstance(valor, str):
        return ''

    return valor.strip()


def normalizar_responsavel_id(valor):
    """
    Converte responsavel_id para inteiro.

    Retorna:
        None -> quando nenhum responsável foi informado
        int  -> quando o ID é válido

    Gera ValueError quando o valor recebido não representa
    um ID válido.
    """

    if valor in (
        None,
        '',
        0,
        '0'
    ):
        return None

    try:
        valor = int(valor)

    except (TypeError, ValueError):

        raise ValueError(
            'responsavel_id deve ser um número inteiro válido'
        )

    if valor <= 0:

        raise ValueError(
            'responsavel_id deve ser um número inteiro positivo'
        )

    return valor


# =============================================================================
#  LISTAR ATIVOS
# =============================================================================

@recursos_bp.route(
    '/',
    methods=['GET']
)
@login_obrigatorio
def listar_recursos(usuario_atual):

    """
    Lista todos os ativos.

    Também permite filtros opcionais:

        ?status=disponível

        ?tipo=Veículo

        ?responsavel=1
    """

    status_filtro = normalizar_texto(
        request.args.get('status')
    )

    tipo_filtro = normalizar_texto(
        request.args.get('tipo')
    )

    responsavel_filtro = request.args.get(
        'responsavel'
    )


    # -------------------------------------------------------------------------
    # CONSULTA
    # -------------------------------------------------------------------------

    consulta = Recurso.query.options(
        joinedload(Recurso.responsavel)
    )


    # -------------------------------------------------------------------------
    # FILTRO DE STATUS
    # -------------------------------------------------------------------------

    if status_filtro:

        if status_filtro not in STATUS_VALIDOS:

            return jsonify({
                'erro': (
                    'Status inválido. '
                    f'Valores permitidos: {", ".join(STATUS_VALIDOS)}'
                )
            }), 400

        consulta = consulta.filter_by(
            status=status_filtro
        )


    # -------------------------------------------------------------------------
    # FILTRO DE TIPO
    # -------------------------------------------------------------------------

    if tipo_filtro:

        consulta = consulta.filter_by(
            tipo=tipo_filtro
        )


    # -------------------------------------------------------------------------
    # FILTRO DE RESPONSÁVEL
    # -------------------------------------------------------------------------

    if responsavel_filtro not in (
        None,
        ''
    ):

        try:

            responsavel_id = normalizar_responsavel_id(
                responsavel_filtro
            )

        except ValueError as erro:

            return jsonify({
                'erro': str(erro)
            }), 400

        consulta = consulta.filter_by(
            responsavel_id=responsavel_id
        )


    # -------------------------------------------------------------------------
    # RESULTADO
    # -------------------------------------------------------------------------

    recursos = (
        consulta
        .order_by(Recurso.id.asc())
        .all()
    )


    return jsonify({

        'quantidade': len(recursos),

        'recursos': [
            recurso.para_dict()
            for recurso in recursos
        ]

    }), 200


# =============================================================================
#  BUSCAR ATIVO POR ID
# =============================================================================

@recursos_bp.route(
    '/<int:recurso_id>',
    methods=['GET']
)
@login_obrigatorio
def buscar_recurso(
    usuario_atual,
    recurso_id
):

    recurso = (
        Recurso.query
        .options(
            joinedload(Recurso.responsavel)
        )
        .filter_by(
            id=recurso_id
        )
        .first()
    )


    if recurso is None:

        return jsonify({
            'erro': 'Ativo não encontrado no sistema'
        }), 404


    return jsonify(
        recurso.para_dict()
    ), 200


# =============================================================================
#  CADASTRAR ATIVO
# =============================================================================

@recursos_bp.route(
    '/',
    methods=['POST']
)
@permissao_requerida(2)
def cadastrar_recurso(
    usuario_atual
):

    """
    Gerentes e administradores podem cadastrar ativos.
    """

    dados = request.get_json(
        silent=True
    ) or {}


    # -------------------------------------------------------------------------
    # NORMALIZAÇÃO
    # -------------------------------------------------------------------------

    nome = normalizar_texto(
        dados.get('nome')
    )

    tipo = normalizar_texto(
        dados.get('tipo')
    )

    localizacao = normalizar_texto(
        dados.get('localizacao')
    )

    descricao = normalizar_texto(
        dados.get('descricao')
    )

    status = normalizar_texto(
        dados.get('status')
    ) or 'disponível'


    # -------------------------------------------------------------------------
    # VALIDAÇÃO DO NOME
    # -------------------------------------------------------------------------

    if len(nome) < 2:

        return jsonify({
            'erro': (
                'O nome do ativo precisa ter '
                'pelo menos 2 caracteres'
            )
        }), 400


    if len(nome) > 150:

        return jsonify({
            'erro': (
                'O nome do ativo deve possuir '
                'no máximo 150 caracteres'
            )
        }), 400


    # -------------------------------------------------------------------------
    # VALIDAÇÃO DO TIPO
    # -------------------------------------------------------------------------

    if len(tipo) < 2:

        return jsonify({
            'erro': 'O tipo precisa ter pelo menos 2 caracteres'
        }), 400


    if len(tipo) > 50:

        return jsonify({
            'erro': (
                'O tipo deve possuir '
                'no máximo 50 caracteres'
            )
        }), 400


    # -------------------------------------------------------------------------
    # VALIDAÇÃO DA LOCALIZAÇÃO
    # -------------------------------------------------------------------------

    if len(localizacao) < 2:

        return jsonify({
            'erro': 'Informe uma localização válida'
        }), 400


    if len(localizacao) > 100:

        return jsonify({
            'erro': (
                'A localização deve possuir '
                'no máximo 100 caracteres'
            )
        }), 400


    # -------------------------------------------------------------------------
    # VALIDAÇÃO DO STATUS
    # -------------------------------------------------------------------------

    if status not in STATUS_VALIDOS:

        return jsonify({
            'erro': (
                'Status inválido. '
                f'Valores permitidos: {", ".join(STATUS_VALIDOS)}'
            )
        }), 400


    # -------------------------------------------------------------------------
    # RESPONSÁVEL
    # -------------------------------------------------------------------------

    try:

        responsavel_id = normalizar_responsavel_id(
            dados.get('responsavel_id')
        )

    except ValueError as erro:

        return jsonify({
            'erro': str(erro)
        }), 400


    if responsavel_id is not None:

        responsavel = db.session.get(
            Usuario,
            responsavel_id
        )

        if responsavel is None:

            return jsonify({
                'erro': (
                    'Usuário responsável '
                    'não encontrado no sistema'
                )
            }), 404


    # -------------------------------------------------------------------------
    # IMPEDE CADASTRO DUPLICADO
    # -------------------------------------------------------------------------

    # Considera duplicado quando já existe um ativo com o mesmo
    # nome E a mesma localização — dois notebooks podem ter o mesmo
    # nome em salas diferentes, mas não na mesma sala.
    duplicado = (
        Recurso.query
        .filter_by(
            nome=nome,
            localizacao=localizacao
        )
        .first()
    )

    if duplicado:

        return jsonify({
            'erro': (
                'Já existe um ativo com este nome '
                'nesta localização'
            )
        }), 409


    # -------------------------------------------------------------------------
    # CRIAÇÃO DO ATIVO
    # -------------------------------------------------------------------------

    novo_recurso = Recurso(

        nome=nome,

        tipo=tipo,

        descricao=descricao,

        status=status,

        localizacao=localizacao,

        responsavel_id=responsavel_id

    )


    # -------------------------------------------------------------------------
    # SALVAMENTO
    # -------------------------------------------------------------------------

    try:

        db.session.add(
            novo_recurso
        )

        db.session.commit()


    except SQLAlchemyError:

        db.session.rollback()

        return jsonify({
            'erro': (
                'Não foi possível cadastrar o ativo'
            )
        }), 500


    return jsonify({

        'mensagem': (
            'Ativo cadastrado com sucesso!'
        ),

        'recurso': novo_recurso.para_dict()

    }), 201


# =============================================================================
#  EDITAR ATIVO
# =============================================================================

@recursos_bp.route(
    '/<int:recurso_id>',
    methods=['PUT']
)
@permissao_requerida(2)
def editar_recurso(
    usuario_atual,
    recurso_id
):

    """
    Gerentes e administradores podem editar ativos.
    """

    recurso = db.session.get(
        Recurso,
        recurso_id
    )


    if recurso is None:

        return jsonify({
            'erro': 'Ativo não encontrado'
        }), 404


    dados = request.get_json(
        silent=True
    ) or {}


    if not dados:

        return jsonify({
            'erro': (
                'Nenhum dado foi enviado '
                'para atualização'
            )
        }), 400


    # -------------------------------------------------------------------------
    # NOME
    # -------------------------------------------------------------------------

    if 'nome' in dados:

        nome = normalizar_texto(
            dados.get('nome')
        )

        if len(nome) < 2:

            return jsonify({
                'erro': (
                    'O nome precisa ter '
                    'pelo menos 2 caracteres'
                )
            }), 400


        if len(nome) > 150:

            return jsonify({
                'erro': (
                    'O nome deve possuir '
                    'no máximo 150 caracteres'
                )
            }), 400


        recurso.nome = nome


    # -------------------------------------------------------------------------
    # TIPO
    # -------------------------------------------------------------------------

    if 'tipo' in dados:

        tipo = normalizar_texto(
            dados.get('tipo')
        )

        if len(tipo) < 2:

            return jsonify({
                'erro': (
                    'O tipo precisa ter '
                    'pelo menos 2 caracteres'
                )
            }), 400


        if len(tipo) > 50:

            return jsonify({
                'erro': (
                    'O tipo deve possuir '
                    'no máximo 50 caracteres'
                )
            }), 400


        recurso.tipo = tipo


    # -------------------------------------------------------------------------
    # DESCRIÇÃO
    # -------------------------------------------------------------------------

    if 'descricao' in dados:

        recurso.descricao = normalizar_texto(
            dados.get('descricao')
        )


    # -------------------------------------------------------------------------
    # STATUS
    # -------------------------------------------------------------------------

    if 'status' in dados:

        status = normalizar_texto(
            dados.get('status')
        )

        if status not in STATUS_VALIDOS:

            return jsonify({
                'erro': (
                    'Status inválido. '
                    f'Valores permitidos: {", ".join(STATUS_VALIDOS)}'
                )
            }), 400


        recurso.status = status


    # -------------------------------------------------------------------------
    # LOCALIZAÇÃO
    # -------------------------------------------------------------------------

    if 'localizacao' in dados:

        localizacao = normalizar_texto(
            dados.get('localizacao')
        )

        if len(localizacao) < 2:

            return jsonify({
                'erro': (
                    'Informe uma localização válida'
                )
            }), 400


        if len(localizacao) > 100:

            return jsonify({
                'erro': (
                    'A localização deve possuir '
                    'no máximo 100 caracteres'
                )
            }), 400


        recurso.localizacao = localizacao


    # -------------------------------------------------------------------------
    # RESPONSÁVEL
    # -------------------------------------------------------------------------

    if 'responsavel_id' in dados:

        try:

            responsavel_id = normalizar_responsavel_id(
                dados.get('responsavel_id')
            )

        except ValueError as erro:

            return jsonify({
                'erro': str(erro)
            }), 400


        if responsavel_id is not None:

            responsavel = db.session.get(
                Usuario,
                responsavel_id
            )

            if responsavel is None:

                return jsonify({
                    'erro': (
                        'Usuário responsável '
                        'não encontrado'
                    )
                }), 404


        recurso.responsavel_id = (
            responsavel_id
        )


    # -------------------------------------------------------------------------
    # SALVAMENTO
    # -------------------------------------------------------------------------

    # A coluna "atualizado_em" é preenchida automaticamente pelo
    # SQLAlchemy (onupdate) no momento do commit, então não precisamos
    # atribuí-la manualmente aqui.

    try:

        db.session.commit()


    except SQLAlchemyError:

        db.session.rollback()

        return jsonify({
            'erro': (
                'Não foi possível atualizar '
                'o ativo'
            )
        }), 500


    return jsonify({

        'mensagem': (
            'Ativo atualizado com sucesso!'
        ),

        'recurso': recurso.para_dict()

    }), 200


# =============================================================================
#  EXCLUIR ATIVO
# =============================================================================

@recursos_bp.route(
    '/<int:recurso_id>',
    methods=['DELETE']
)
@permissao_requerida(3)
def excluir_recurso(
    usuario_atual,
    recurso_id
):

    """
    Apenas administradores podem excluir ativos.
    """

    recurso = db.session.get(
        Recurso,
        recurso_id
    )


    if recurso is None:

        return jsonify({
            'erro': 'Ativo não encontrado'
        }), 404


    try:

        db.session.delete(
            recurso
        )

        db.session.commit()


    except SQLAlchemyError:

        db.session.rollback()

        return jsonify({
            'erro': (
                'Não foi possível remover '
                'o ativo'
            )
        }), 500


    return jsonify({
        'mensagem': (
            'Ativo removido do sistema '
            'com sucesso!'
        )
    }), 200
