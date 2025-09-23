FROM e2bdev/code-interpreter:latest

WORKDIR /home/

RUN npm init -y \
  && npm install cowsay \
  && npm install @modelcontextprotocol/sdk

RUN pip install cowsay

RUN node -e "console.log(require('cowsay').say({ text: 'Hello from cowsay 🐄' }))"
