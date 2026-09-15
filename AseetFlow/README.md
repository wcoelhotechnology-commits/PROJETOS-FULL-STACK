🛰️ AssetFlow — Sistema de Gestão de Ativos

![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python)
![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=for-the-badge&logo=flask)
![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge&logo=sqlite)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)
![Status](https://img.shields.io/badge/Status-Demonstra%C3%A7%C3%A3o%20funcional-00C853?style=for-the-badge)

Sistema web full stack para controle de ativos corporativos (equipamentos, veículos, ferramentas, mobiliário) com autenticação, três níveis de permissão e trilha de auditoria por registro.

Este projeto nasceu como um trabalho acadêmico ("Sistema de Gestão — Wayne Industries") e foi reestruturado como uma solução prática de demonstração comercial, mantendo a identidade visual dark/verde-neon e evoluindo a arquitetura, as funcionalidades e a cobertura de testes.

## 📌 Visão geral

Eu desenvolvi o AssetFlow como uma solução realista para o controle de ativos em ambiente corporativo, com foco em organização, segurança e simplicidade de uso. A ideia foi criar algo que parecesse funcional de verdade: com regras de negócio no backend, autenticação por sessão, permissões por perfil e uma interface direta para operação diária.

## 🧠 Decisões de projeto

- Mantive a stack simples e objetiva para que o sistema fosse fácil de entender e executar.
- As regras de permissão ficaram no servidor, porque isso é o que realmente protege o sistema.
- O frontend foi estruturado em módulos para manter a manutenção e a leitura do código mais claras.
- A interface foi pensada para parecer um painel de gestão real, sem exageros visuais ou dependências pesadas.
- A parte de auditoria e dos testes foi incluída para reforçar que o projeto foi pensado como algo funcional, e não só como mockup.

## ⭐ Destaques do projeto

- Gestão completa de ativos com fluxo de cadastro, busca e edição.
- Controle de acesso por níveis de usuário.
- Painel analítico para acompanhamento geral do inventário.
- Estrutura pronta para execução local ou com Docker.
- Base testada com pytest para autenticação e permissões.

## 🛠️ Tecnologias e habilidades

### Tecnologias
- Python
- Flask
- SQLAlchemy
- SQLite
- HTML
- CSS
- JavaScript
- Docker / Docker Compose
- Pytest

### Habilidades demonstradas
- Desenvolvimento full stack com separação clara entre frontend e backend.
- Implementação de autenticação e controle de sessão.
- Modelagem de regras de negócio com foco em segurança.
- Estruturação de interfaces web funcionais e organizadas.
- Criação de soluções com foco em usabilidade, manutenção e escalabilidade.
- Testes automatizados para validar regras de autenticação e permissão.

## ✨ Funcionalidades

- Autenticação por sessão, com senha protegida por hash (pbkdf2:sha256) — nunca armazenada em texto puro.
- Três níveis de permissão, aplicados no servidor (não apenas na interface):
  - Colaborador — consulta o inventário.
  - Gerente — consulta, cadastra e edita ativos.
  - Administrador — acesso completo, incluindo exclusão de ativos e gestão de usuários.
- CRUD completo de ativos: cadastrar, listar (com filtros por status, tipo e responsável), buscar, editar e excluir — todas as ações disponíveis diretamente na interface.
- Gestão de usuários (administrador): lista de usuários e cadastro de novas contas com nível de acesso definido.
- Painel geral com indicadores de disponíveis, em uso, em manutenção e inativos.
- Trilha de auditoria leve: cada ativo guarda a data de criação e a data da última atualização.
- Testes automatizados (pytest) cobrindo autenticação, permissões e o CRUD de ativos.
- Execução com um comando via Docker Compose.

## 🖼️ Capturas de tela

<p align="center">
  <img src="screenshots/Tela%20de%20login%20do%20AssetFlow.png" alt="Tela de login do AssetFlow" width="80%">
  <br>
  <em>Tela de login do AssetFlow</em>
</p>

<p align="center">
  <img src="screenshots/P%C3%A1gina%20de%20invent%C3%A1rio.png" alt="Página de inventário" width="48%" style="margin: 0 8px;">
  <img src="screenshots/Painel%20geral.png" alt="Painel geral" width="48%" style="margin: 0 8px;">
  <br>
  <em>Página de inventário e painel geral</em>
</p>

<p align="center">
  <img src="screenshots/Cadastro%20de%20novo%20ativo.png" alt="Cadastro de novo ativo" width="48%" style="margin: 0 8px;">
  <img src="screenshots/Gest%C3%A3o%20de%20usu%C3%A1rios.png" alt="Gestão de usuários" width="48%" style="margin: 0 8px;">
  <br>
  <em>Cadastro de ativo e gestão de usuários</em>
</p>

## 🧱 Arquitetura

```text
assetflow/
├── backend/
│   ├── app.py                # Inicialização do Flask, configuração e rotas de sistema
│   ├── modelos.py            # Modelos SQLAlchemy (Usuario, Recurso)
│   ├── rotas_auth.py         # Login, sessão, cadastro e listagem de usuários
│   ├── rotas_recursos.py     # CRUD de ativos
│   ├── requirements.txt
│   └── testes/
│       ├── conftest.py       # Configuração compartilhada dos testes
│       ├── test_auth.py
│       └── test_recursos.py
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── estilo.css
│   └── js/                   # Um arquivo por responsabilidade
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
└── README.md
```

- Backend: Python, Flask, Flask-SQLAlchemy e SQLite.
- Frontend: HTML, CSS e JavaScript puro (sem framework, sem build step).

O frontend é dividido em módulos, cada um com uma única responsabilidade:

| Arquivo | Responsabilidade |
| --- | --- |
| config.js | Constantes globais |
| elementos.js | Referências centralizadas do DOM |
| api.js | Comunicação HTTP com o backend |
| utilidades.js | Funções auxiliares (debounce, formatação) |
| sessao.js | Login, logout, verificação de sessão |
| ui-permissoes.js | Mostra/oculta elementos por nível de acesso |
| navegacao.js | Troca entre as páginas internas |
| usuarios.js | Listagem e cadastro de usuários |
| inventario.js | Listagem, filtros e busca de ativos |
| edicao-recurso.js | Modal de edição e exclusão de ativos |
| cadastro-recurso.js | Cadastro de novos ativos |
| painel.js | Indicadores do painel geral |
| principal.js | Ponto de entrada — inicializa tudo |

## 🚀 Como rodar localmente

### Pré-requisitos
- Python 3.10+

### Passos

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>
cd assetflow

# 2. Configure as variáveis de ambiente
cp .env.example .env
# edite o .env e defina SECRET_KEY, ADMIN_EMAIL e ADMIN_PASSWORD próprios

# 3. Instale as dependências
cd backend
pip install -r requirements.txt

# 4. Rode a aplicação
python app.py
```

Acesse http://127.0.0.1:5000 e entre com o e-mail e a senha definidos em ADMIN_EMAIL / ADMIN_PASSWORD no .env.

### Rodando com Docker

```bash
cp .env.example .env
# edite o .env

docker compose up --build
```

Acesse http://localhost:5000.

### Rodando os testes

```bash
cd backend
pytest testes/ -v
```

## 🔐 Segurança

- Nenhuma credencial fica no código-fonte — tudo vem do .env, que não é versionado (ver .gitignore).
- Senhas de usuário nunca são armazenadas nem retornadas em texto puro.
- Toda regra de permissão é validada no backend, independentemente do que a interface mostra ou esconde.
- SECRET_KEY e ADMIN_PASSWORD de exemplo neste repositório são apenas placeholders — a aplicação recusa iniciar caso eles não sejam substituídos.

## 🗺️ Próximos passos possíveis

Itens deixados como evolução natural do projeto, fora do escopo desta versão de demonstração:

- Paginação e ordenação da lista de ativos para bases maiores.
- Exportação do inventário (CSV/PDF).
- Histórico detalhado de alterações por ativo (auditoria completa).
- Migração de esquema de banco com Alembic.
- Deploy de demonstração ao vivo.

## 📊 Status do projeto

Projeto em estado de demonstração funcional, pronto para uso local e com base para evolução em produção.

## � Perfil do projeto

Este projeto representa uma solução prática para gestão de ativos corporativos, com foco em organização operacional, segurança, e desenvolvimento de uma interface funcional para uso real. Ele mostra capacidade de trabalhar com backend, frontend, autenticação, controle de permissões, estrutura de arquivos e organização de código em um contexto de aplicação web completa.

## �👤 Autor

Desenvolvido por Wellington Coelho, com foco em criar uma solução prática, funcional e visualmente coerente para gestão de ativos corporativos.

Este projeto reflete decisões de arquitetura, interface e fluxo de negócio pensadas para funcionar de forma realista, e não apenas como uma apresentação superficial de código.