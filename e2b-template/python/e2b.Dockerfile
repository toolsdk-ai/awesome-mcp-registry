# e2b template build -c "/root/.jupyter/start-up.sh"
FROM e2bdev/code-interpreter:latest

WORKDIR /home/

RUN npm init -y
RUN npm install @modelcontextprotocol/sdk

# Install Python development headers and build dependencies
RUN apt-get update && apt-get install -y \
    python3-dev \
    build-essential \
    gcc \
    && rm -rf /var/lib/apt/lists/*

RUN pip install uv

# COPY pyproject.toml uv.lock ./
COPY pyproject.toml ./

ENV UV_HTTP_TIMEOUT=300

RUN uv sync
