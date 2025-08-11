FROM node:22-alpine

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建项目
RUN pnpm run build

# 暴露端口
EXPOSE 3003

# 启动命令
CMD ["pnpm", "start"]

# 构建镜像
# docker build -t awesome-mcp-registry .
# 运行容器
# docker run -p 3003:3003 awesome-mcp-registry