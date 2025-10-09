# e2b template build -c "/root/.jupyter/start-up.sh"
FROM e2bdev/code-interpreter:latest

WORKDIR /home/

RUN npm init -y
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

# RUN pip install cowsay

# RUN node -e "console.log(require('cowsay').say({ text: 'Hello from cowsay 🐄' }))"
