# 使用官方Node.js运行时作为基础镜像
FROM node:22-alpine AS base

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 多阶段构建 - 构建阶段
FROM node:22-alpine AS builder

WORKDIR /app

# 复制package文件
COPY package*.json ./
COPY tsconfig.json ./

# 安装所有依赖（包括开发依赖）
RUN npm ci

# 复制源代码
COPY src/ ./src/

# 构建应用
RUN npm run build

# 多阶段构建 - 生产阶段
FROM node:22-alpine AS production

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 设置工作目录
WORKDIR /app

# 从base阶段复制node_modules
COPY --from=base /app/node_modules ./node_modules

# 从builder阶段复制构建结果
COPY --from=builder /app/dist ./dist

# 复制package.json
COPY package*.json ./

# 创建必要的目录
RUN mkdir -p data logs uploads

# 更改所有权
RUN chown -R nodejs:nodejs /app

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "http.get('http://localhost:3001/health', (res) => { res.statusCode === 200 ? process.exit(0) : process.exit(1) })" || exit 1

# 启动命令
CMD ["npm", "start"]