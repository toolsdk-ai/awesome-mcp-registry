# e2b template build -c "/root/.jupyter/start-up.sh"
FROM e2bdev/code-interpreter:latest

WORKDIR /home/

RUN npm init -y
  # && npm install cowsay \
  # && npm install @modelcontextprotocol/sdk \
  # && npm install @toolsdk.ai/tavily-mcp \
  # && npm install mcp-starter \
  # && npm install @arizeai/phoenix-mcp \
  # && npm install @toolsdk.ai/mixpanel-mcp-server

RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

RUN pip install cowsay

# RUN node -e "console.log(require('cowsay').say({ text: 'Hello from cowsay 🐄' }))"
