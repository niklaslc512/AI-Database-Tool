# 开发指南

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 18.0.0
- **PostgreSQL**: >= 13.0
- **pnpm**: >= 8.0.0 (推荐)

### 项目设置

1. **克隆项目**
```bash
git clone <repository-url>
cd ai-database
```

2. **安装依赖**
```bash
# 安装后端依赖
cd backend
pnpm install

# 安装前端依赖
cd ../frontend
pnpm install
```

3. **环境配置**
```bash
# 复制环境配置文件
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 编辑配置文件
vim backend/.env
vim frontend/.env
```

4. **数据库初始化**
```bash
cd backend
pnpm run db:init
```

5. **启动开发服务器**
```bash
# 启动后端服务 (终端1)
cd backend
pnpm run dev

# 启动前端服务 (终端2)
cd frontend
pnpm run dev
```

## 🏗️ 项目结构

```
ai-database/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── controllers/     # 控制器层
│   │   ├── services/        # 业务逻辑层
│   │   ├── models/          # 数据模型
│   │   ├── routes/          # 路由定义
│   │   ├── middleware/      # 中间件
│   │   ├── utils/           # 工具函数
│   │   └── types/           # TypeScript类型定义
│   ├── migrations/          # 数据库迁移文件
│   ├── tests/               # 测试文件
│   └── package.json
├── frontend/                # 前端应用
│   ├── src/
│   │   ├── components/      # Vue组件
│   │   ├── views/           # 页面组件
│   │   ├── stores/          # Pinia状态管理
│   │   ├── router/          # 路由配置
│   │   ├── utils/           # 工具函数
│   │   ├── types/           # TypeScript类型定义
│   │   └── assets/          # 静态资源
│   └── package.json
├── docs/                    # 项目文档
└── README.md
```

## 🔧 开发工作流

### 代码规范

**TypeScript配置**:
- 严格模式启用
- 统一的代码格式化 (Prettier)
- ESLint规则检查

**提交规范**:
```bash
# 功能开发
git commit -m "feat: 添加AI查询历史功能"

# 问题修复
git commit -m "fix: 修复数据库连接超时问题"

# 文档更新
git commit -m "docs: 更新API使用文档"

# 重构代码
git commit -m "refactor: 优化查询性能"
```

### 分支管理

```bash
# 主分支
main                    # 生产环境代码
develop                 # 开发分支

# 功能分支
feature/ai-query        # AI查询功能
feature/user-auth       # 用户认证

# 修复分支
hotfix/security-patch   # 安全补丁
hotfix/critical-bug     # 紧急修复
```

### 测试策略

**后端测试**:
```bash
# 运行所有测试
pnpm test

# 运行特定测试
pnpm test -- --grep "AI查询"

# 测试覆盖率
pnpm test:coverage
```

**前端测试**:
```bash
# 单元测试
pnpm test:unit

# 端到端测试
pnpm test:e2e

# 组件测试
pnpm test:component
```

## 🎯 核心功能开发

### AI语义化查询

**核心流程**:
1. 用户输入自然语言查询
2. AI模型解析并生成SQL
3. 执行SQL并返回结果
4. 记录查询历史和性能指标

**关键文件**:
- `backend/src/controllers/AISQLController.ts` - AI查询控制器
- `backend/src/services/OpenAIService.ts` - OpenAI集成服务
- `frontend/src/views/Developer/Query.vue` - 查询界面

**开发示例**:
```typescript
// 添加新的AI查询功能
export class AISQLController {
  async executeQuery(req: Request, res: Response) {
    try {
      const { query, connectionId } = req.body;
      
      // 1. 验证输入
      if (!query || !connectionId) {
        return res.status(400).json({
          message: '查询内容和数据库连接ID不能为空'
        });
      }
      
      // 2. 调用AI服务
      const aiResult = await this.openAIService.generateSQL(query);
      
      // 3. 执行SQL
      const queryResult = await this.databaseService.executeQuery(
        connectionId, 
        aiResult.sql
      );
      
      // 4. 记录日志
      await this.logService.recordExecution({
        userId: req.user.id,
        query,
        sql: aiResult.sql,
        result: queryResult
      });
      
      // 5. 返回结果
      res.json({
        sql: aiResult.sql,
        explanation: aiResult.explanation,
        results: queryResult,
        tokenUsage: aiResult.tokenUsage
      });
      
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }
}
```

### 数据库连接管理

**支持的数据库**:
- PostgreSQL
- MySQL
- SQLite
- SQL Server (计划中)

**连接池管理**:
```typescript
// 数据库连接服务
export class DatabaseConnectionService {
  private connections = new Map<string, Pool>();
  
  async createConnection(config: DatabaseConfig): Promise<string> {
    const pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      max: 10, // 最大连接数
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    // 测试连接
    await pool.query('SELECT 1');
    
    const connectionId = generateUUID();
    this.connections.set(connectionId, pool);
    
    return connectionId;
  }
}
```

### 用户认证系统

**JWT Token管理**:
```typescript
// 认证中间件
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      message: '访问令牌缺失'
    });
  }
  
  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) {
      return res.status(403).json({
        message: 'Token已过期或无效'
      });
    }
    
    req.user = user;
    next();
  });
};
```

## 🔍 调试技巧

### 后端调试

**日志配置**:
```typescript
// 使用winston进行日志管理
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

**数据库查询调试**:
```typescript
// 启用查询日志
const pool = new Pool({
  // ... 其他配置
  log: (sql, params) => {
    console.log('SQL:', sql);
    console.log('Params:', params);
  }
});
```

### 前端调试

**Vue DevTools**:
- 安装浏览器扩展
- 查看组件状态和事件
- 监控Pinia状态变化

**网络请求调试**:
```typescript
// API请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log('Request:', config);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('Response:', response);
    return response;
  },
  (error) => {
    console.error('Response Error:', error);
    return Promise.reject(error);
  }
);
```

## 🚀 部署指南

### 生产环境构建

```bash
# 构建后端
cd backend
pnpm run build

# 构建前端
cd frontend
pnpm run build
```

### Docker部署

```dockerfile
# Dockerfile.backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

```dockerfile
# Dockerfile.frontend
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

### 环境变量配置

**生产环境**:
```bash
# backend/.env.production
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/ai_database
JWT_SECRET=your-super-secret-key
OPENAI_API_KEY=your-openai-api-key
REDIS_URL=redis://localhost:6379
```

## 📊 性能优化

### 数据库优化

- **索引策略**: 为常用查询字段添加索引
- **连接池**: 合理配置连接池大小
- **查询优化**: 使用EXPLAIN分析查询计划

### 前端优化

- **代码分割**: 使用动态导入分割代码
- **缓存策略**: 合理使用浏览器缓存
- **懒加载**: 图片和组件懒加载

### AI服务优化

- **提示词优化**: 精简提示词减少token消耗
- **缓存机制**: 缓存常用查询结果
- **批量处理**: 合并相似查询请求

## 🔒 安全最佳实践

### 数据安全

- **SQL注入防护**: 使用参数化查询
- **敏感数据加密**: 密码和API密钥加密存储
- **访问控制**: 基于角色的权限管理

### API安全

- **HTTPS**: 生产环境强制使用HTTPS
- **CORS配置**: 严格配置跨域访问
- **速率限制**: 防止API滥用

## 🤝 贡献指南

1. **Fork项目**
2. **创建功能分支** (`git checkout -b feature/amazing-feature`)
3. **提交更改** (`git commit -m 'Add some amazing feature'`)
4. **推送分支** (`git push origin feature/amazing-feature`)
5. **创建Pull Request**

### 代码审查清单

- [ ] 代码符合项目规范
- [ ] 添加了必要的测试
- [ ] 文档已更新
- [ ] 没有引入安全漏洞
- [ ] 性能影响可接受

## 📞 获取帮助

- **文档**: 查看 `docs/` 目录下的详细文档
- **Issues**: 在GitHub上提交问题
- **讨论**: 参与项目讨论区

---

> 💡 **提示**: 开发过程中遇到问题，首先查看日志文件，然后参考相关文档，最后再寻求帮助。