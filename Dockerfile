FROM node:22-bookworm

WORKDIR /app

# install pyenv & Python 3.13
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        make build-essential libssl-dev zlib1g-dev \
        libbz2-dev libreadline-dev libsqlite3-dev wget curl llvm \
        libncursesw5-dev xz-utils tk-dev libxml2-dev libxmlsec1-dev libffi-dev liblzma-dev git && \
    curl https://pyenv.run | bash && \
    export PATH="/root/.pyenv/bin:$PATH" && \
    pyenv install 3.13.0 && \
    pyenv global 3.13.0 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

ENV PATH="/root/.pyenv/shims:/root/.pyenv/bin:$PATH"
ENV PYTHON_VERSION=3.13.0

RUN pip install uv

# install Node dependencies
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .

# install Python dependencies
WORKDIR /app/python-mcp
RUN uv sync

WORKDIR /app

RUN pnpm run build

EXPOSE 3003

CMD ["pnpm", "start"]