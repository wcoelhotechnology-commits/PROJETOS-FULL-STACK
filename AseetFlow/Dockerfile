# =============================================================================
# ASSETFLOW — DOCKERFILE
#
# Sobe o backend Flask (que também serve o frontend estático)
# dentro de um container isolado.
# =============================================================================

FROM python:3.12-slim

# Evita a criação de arquivos .pyc e mantém o log sem buffer,
# o que facilita acompanhar a saída do container em tempo real.
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copia primeiro apenas o arquivo de dependências para aproveitar
# o cache de camadas do Docker — a instalação só roda de novo
# quando requirements.txt muda.
COPY backend/requirements.txt ./backend/requirements.txt

RUN pip install --no-cache-dir -r backend/requirements.txt

# Agora copia o restante do projeto (backend + frontend).
COPY backend ./backend
COPY frontend ./frontend

WORKDIR /app/backend

EXPOSE 5000

CMD ["python", "app.py"]
