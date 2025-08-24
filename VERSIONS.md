# 项目技术栈版本配置

## 运行环境
- Node.js: 22.x
- npm: 10.x

## 后端技术栈
- Express.js: 5.0.0-beta.3
- TypeScript: 5.3.3
- SQLite: 5.1.6
- MySQL: 3.6.5 (mysql2)
- PostgreSQL: 8.11.3 (pg)
- MongoDB: 6.3.0

## 前端技术栈
- Vue: 3.4.15
- Vite: 5.0.11
- TailwindCSS: 4.0.0-alpha.4
- Element Plus: 2.4.4

## 开发工具
- ESLint: 8.55.0
- Prettier: 3.1.1

## 容器技术
- Docker: 最新版本
- Docker Compose: 最新版本

## 重要说明

### Express 5 升级注意事项
Express 5 目前处于 beta 阶段，主要变化包括：
1. 移除了一些 deprecated 的中间件
2. 改进了错误处理机制
3. 更好的 Promise 支持
4. 性能优化

### Node.js 22 新特性
1. 更好的 ESM 支持
2. 性能提升
3. 更严格的安全策略
4. 改进的调试工具

### 版本兼容性
- 所有依赖都已测试与 Node.js 22 兼容
- Express 5 beta 版本稳定，适合开发使用
- 生产环境建议等待 Express 5 正式版发布

### 升级路径
如需从旧版本升级：
1. 升级 Node.js 到 22.x
2. 更新 npm 到 10.x
3. 重新安装依赖: `npm ci`
4. 测试所有功能