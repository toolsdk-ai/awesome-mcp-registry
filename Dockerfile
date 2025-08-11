FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --prod --frozen-lockfile

COPY . .

RUN pnpm run build

EXPOSE 3003

CMD ["pnpm", "start"]

# docker build -t awesome-mcp-registry .
# docker run -d -p 3003:3003 --name mcp-registry awesome-mcp-registry