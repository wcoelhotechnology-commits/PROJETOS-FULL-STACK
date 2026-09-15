# =============================================================================
#  ASSETFLOW — SISTEMA DE GESTÃO DE ATIVOS
#  Autor: Wellington Coelho
#  Arquivo: modelos.py
#
#  Propósito:
#      Definir os modelos do banco de dados utilizados pelo sistema.
#
#      Este arquivo representa:
#          - Usuários
#          - Níveis de permissão
#          - Ativos (recursos) controlados pela organização
#          - Relacionamento entre ativo e responsável
#          - Criptografia e verificação de senhas
#
#  IMPORTANTE:
#      A instância "db" é criada SOMENTE neste arquivo.
#
#      O app.py importa este mesmo objeto:
#
#          from modelos import db
#
#      Dessa forma, todo o projeto utiliza uma única instância
#      do SQLAlchemy, evitando conflitos de inicialização.
# =============================================================================


from datetime import datetime, timezone

from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash


# =============================================================================
#  INSTÂNCIA ÚNICA DO SQLALCHEMY
# =============================================================================

# O SQLAlchemy é criado aqui sem receber o Flask diretamente.
#
# A ligação com o aplicativo acontece depois, dentro de app.py:
#
#     db.init_app(app)
#
# Isso evita a criação de duas conexões SQLAlchemy diferentes
# para o mesmo projeto.
db = SQLAlchemy()


# =============================================================================
#  FUNÇÃO AUXILIAR — DATA E HORA ATUAL
# =============================================================================

def agora_utc():
    """
    Retorna a data e hora atual no fuso UTC.

    Centralizar essa função evita que cada modelo calcule
    o horário de um jeito diferente.
    """

    return datetime.now(timezone.utc)


# =============================================================================
#  MODELO: USUÁRIO
# =============================================================================

class Usuario(db.Model):

    # Nome real da tabela no banco de dados.
    __tablename__ = 'usuarios'


    # -------------------------------------------------------------------------
    # IDENTIFICAÇÃO
    # -------------------------------------------------------------------------

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    nome = db.Column(
        db.String(100),
        nullable=False,
        index=True
    )

    email = db.Column(
        db.String(120),
        unique=True,
        nullable=False,
        index=True
    )


    # -------------------------------------------------------------------------
    # SENHA
    # -------------------------------------------------------------------------

    # Nunca armazenamos a senha original.
    #
    # No banco fica apenas algo semelhante a:
    #
    # pbkdf2:sha256:600000$...
    senha_hash = db.Column(
        db.String(200),
        nullable=False
    )


    # -------------------------------------------------------------------------
    # NÍVEL DE PERMISSÃO
    # -------------------------------------------------------------------------

    # Níveis utilizados pelo projeto:
    #
    # 1 = Colaborador
    # 2 = Gerente
    # 3 = Administrador
    nivel_permissao = db.Column(
        db.Integer,
        nullable=False,
        default=1
    )


    # -------------------------------------------------------------------------
    # AUDITORIA
    # -------------------------------------------------------------------------

    # Guarda o momento em que o usuário foi criado.
    #
    # Não é alterado depois do cadastro.
    criado_em = db.Column(
        db.DateTime,
        nullable=False,
        default=agora_utc
    )


    # =========================================================================
    # SENHA — PROPRIEDADE PROTEGIDA
    # =========================================================================

    @property
    def senha(self):
        """
        Impede que a senha seja lida diretamente.

        Exemplo proibido:

            print(usuario.senha)

        O sistema nunca precisa recuperar a senha original,
        apenas verificar se uma tentativa de senha confere com o hash.
        """

        raise AttributeError(
            'A senha não pode ser lida diretamente.'
        )


    @senha.setter
    def senha(self, senha_texto):
        """
        Recebe uma senha em texto comum e salva apenas o hash.

        Exemplo:

            usuario.senha = "MinhaSenha123"

        O banco receberá apenas o resultado criptográfico,
        nunca o texto original.
        """

        if not isinstance(senha_texto, str):
            raise ValueError(
                'A senha deve ser informada como texto.'
            )

        senha_texto = senha_texto.strip()

        if not senha_texto:
            raise ValueError(
                'A senha não pode estar vazia.'
            )

        self.senha_hash = generate_password_hash(
            senha_texto,
            method='pbkdf2:sha256'
        )


    def verificar_senha(self, senha_tentativa):
        """
        Compara a senha digitada no login com o hash armazenado.

        Retorna:

            True  -> senha correta
            False -> senha incorreta
        """

        if not senha_tentativa:
            return False

        if not self.senha_hash:
            return False

        return check_password_hash(
            self.senha_hash,
            senha_tentativa
        )


    # =========================================================================
    # PERMISSÕES
    # =========================================================================

    def tem_permissao(self, nivel_necessario):
        """
        Verifica se o usuário possui nível suficiente
        para executar determinada ação.

        Exemplo:

            usuario.tem_permissao(2)

        Um administrador de nível 3 também possui
        permissão para uma ação de nível 2, pois a comparação
        é sempre "maior ou igual".
        """

        try:
            nivel_necessario = int(nivel_necessario)
        except (TypeError, ValueError):
            return False

        return self.nivel_permissao >= nivel_necessario


    # =========================================================================
    # REPRESENTAÇÃO EM DICIONÁRIO
    # =========================================================================

    def para_dict(self):
        """
        Converte o usuário para um dicionário seguro,
        pronto para ser transformado em JSON.

        A senha e o hash NÃO são retornados em nenhuma hipótese.
        """

        return {
            'id': self.id,
            'nome': self.nome,
            'email': self.email,
            'nivel_permissao': self.nivel_permissao,
            'criado_em': (
                self.criado_em.isoformat()
                if self.criado_em
                else None
            )
        }


    # =========================================================================
    # REPRESENTAÇÃO INTERNA
    # =========================================================================

    def __repr__(self):

        return (
            f'<Usuario '
            f'id={self.id} '
            f'nome="{self.nome}" '
            f'nivel={self.nivel_permissao}>'
        )


# =============================================================================
#  MODELO: ATIVO (RECURSO)
# =============================================================================

class Recurso(db.Model):

    # Nome real da tabela no banco.
    #
    # Mantido como "recursos" para preservar compatibilidade
    # com o banco de dados já existente.
    __tablename__ = 'recursos'


    # -------------------------------------------------------------------------
    # IDENTIFICAÇÃO
    # -------------------------------------------------------------------------

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    nome = db.Column(
        db.String(150),
        nullable=False
    )

    tipo = db.Column(
        db.String(50),
        nullable=False
    )

    descricao = db.Column(
        db.Text,
        nullable=True
    )


    # -------------------------------------------------------------------------
    # SITUAÇÃO
    # -------------------------------------------------------------------------

    status = db.Column(
        db.String(30),
        nullable=False,
        default='disponível'
    )


    # -------------------------------------------------------------------------
    # LOCALIZAÇÃO
    # -------------------------------------------------------------------------

    localizacao = db.Column(
        db.String(100),
        nullable=False
    )


    # -------------------------------------------------------------------------
    # RESPONSÁVEL
    # -------------------------------------------------------------------------

    # Essa coluna guarda somente o ID do usuário responsável.
    #
    # Exemplo:
    #
    # responsavel_id = 1
    #
    # significa que o usuário de ID 1 é responsável pelo ativo.
    responsavel_id = db.Column(
        db.Integer,
        db.ForeignKey('usuarios.id'),
        nullable=True
    )


    # -------------------------------------------------------------------------
    # RELACIONAMENTO
    # -------------------------------------------------------------------------

    # Permite acessar diretamente:
    #
    # recurso.responsavel
    #
    # e receber um objeto Usuario, sem precisar de uma nova consulta manual.
    responsavel = db.relationship(
        'Usuario',
        backref=db.backref(
            'recursos_responsaveis',
            lazy=True
        )
    )


    # -------------------------------------------------------------------------
    # AUDITORIA
    # -------------------------------------------------------------------------

    # Data de cadastro do ativo. Nunca é alterada depois de criada.
    criado_em = db.Column(
        db.DateTime,
        nullable=False,
        default=agora_utc
    )

    # Data da última alteração. Atualizada manualmente
    # sempre que o ativo é editado (ver rotas_recursos.py).
    atualizado_em = db.Column(
        db.DateTime,
        nullable=False,
        default=agora_utc,
        onupdate=agora_utc
    )


    # =========================================================================
    # REPRESENTAÇÃO EM DICIONÁRIO
    # =========================================================================

    def para_dict(self):
        """
        Converte o ativo para uma estrutura adequada
        para respostas JSON.
        """

        return {
            'id': self.id,
            'nome': self.nome,
            'tipo': self.tipo,
            'descricao': self.descricao,
            'status': self.status,
            'localizacao': self.localizacao,
            'responsavel': (
                {
                    'id': self.responsavel.id,
                    'nome': self.responsavel.nome
                }
                if self.responsavel
                else None
            ),
            'criado_em': (
                self.criado_em.isoformat()
                if self.criado_em
                else None
            ),
            'atualizado_em': (
                self.atualizado_em.isoformat()
                if self.atualizado_em
                else None
            )
        }


    # =========================================================================
    # REPRESENTAÇÃO INTERNA
    # =========================================================================

    def __repr__(self):

        return (
            f'<Recurso '
            f'id={self.id} '
            f'nome="{self.nome}" '
            f'status="{self.status}">'
        )
