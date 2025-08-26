# 🚀 AI语义化数据库管理系统 - 项目开发规范

## 📋 项目概述

本项目是一个由大模型驱动的智能化数据库管理系统，采用前后端分离架构，支持PostgreSQL和MongoDB多连接管理，通过AI语义理解实现自然语言到数据库操作的智能转换。

## 🏗️ 技术架构

### 前端架构
- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **样式**: TailwindCSS v4
- **状态管理**: Pinia
- **路由**: Vue Router
- **HTTP客户端**: Axios
- **组件库**: Element Plus
- **图表**: ECharts + Vue-ECharts
- **类型检查**: TypeScript

### 后端架构
- **运行时**: Node.js 22+
- **框架**: Express.js 5 (beta)
- **语言**: TypeScript（全项目类型安全）
- **数据库驱动**: pg (PostgreSQL), mongodb (MongoDB), sqlite3
- **认证**: JWT + bcryptjs
- **日志**: Winston + winston-daily-rotate-file
- **API文档**: Swagger (swagger-jsdoc + swagger-ui-express)
- **安全**: Helmet + CORS
- **压缩**: compression

### 容器化部署
- **容器**: Docker + Docker Compose
- **缓存**: Redis 7 (可选)
- **反向代理**: Nginx
- **健康检查**: 内置健康检查端点

## 📁 项目结构规范

```
ai-database/
├── 📁 backend/                 # 后端服务
│   ├── 📁 src/                 # 源代码
│   │   ├── 📁 adapters/        # 数据库适配器
│   │   ├── 📁 config/          # 配置文件
│   │   ├── 📁 middleware/      # 中间件
│   │   ├── 📁 routes/          # 路由定义
│   │   ├── 📁 services/        # 业务逻辑服务
│   │   ├── 📁 types/           # TypeScript类型定义
│   │   ├── 📁 utils/           # 工具函数
│   │   └── 📄 index.ts         # 应用入口
│   ├── 📁 database/            # 数据库相关
│   └── 📄 package.json         # 依赖配置
├── 📁 frontend/                # 前端应用
│   ├── 📁 src/                 # 源代码
│   │   ├── 📁 components/      # 可复用组件
│   │   ├── 📁 views/           # 页面组件
│   │   ├── 📁 stores/          # Pinia状态管理
│   │   ├── 📁 router/          # 路由配置
│   │   ├── 📁 styles/          # 样式文件
│   │   ├── 📁 types/           # TypeScript类型
│   │   ├── 📁 utils/           # 工具函数
│   │   └── 📄 main.ts          # 应用入口
│   └── 📄 package.json         # 依赖配置
├── 📁 docker/                  # Docker配置
├── 📁 docs/                    # 项目文档
├── 📁 scripts/                 # 开发脚本
└── 📄 docker-compose.yml       # 容器编排
```

## 💻 开发规范

### 🎯 代码风格

#### 通用规范
- ✅ **语言**: 全项目使用TypeScript，确保类型安全
- ✅ **注释**: 所有注释和日志信息使用中文
- ✅ **Emoji**: 在注释、日志和文档中适当使用emoji增强可读性
- ✅ **命名**: 使用有意义的变量和函数名，采用驼峰命名法
- ✅ **格式化**: 使用ESLint + Prettier统一代码格式

#### 前端规范
```typescript
// ✅ 好的示例
/**
 * 🔍 用户搜索组件
 * 支持模糊搜索和高级筛选功能
 */
const UserSearchComponent = defineComponent({
  name: 'UserSearch',
  setup() {
    const searchKeyword = ref('') // 🔤 搜索关键词
    const isLoading = ref(false)   // ⏳ 加载状态
    
    // 🔍 执行搜索操作
    const handleSearch = async () => {
      try {
        isLoading.value = true
        // 搜索逻辑...
        console.log('🔍 开始搜索用户:', searchKeyword.value)
      } catch (error) {
        console.error('❌ 搜索失败:', error)
      } finally {
        isLoading.value = false
      }
    }
    
    return { searchKeyword, isLoading, handleSearch }
  }
})
```

#### 后端规范
```typescript
// ✅ 好的示例
/**
 * 🔐 用户认证服务
 * 处理用户登录、注册和权限验证
 */
export class AuthService {
  private logger = winston.createLogger({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} [${level.toUpperCase()}] 🔐 ${message}`
      })
    )
  })

  /**
   * 🔑 用户登录验证
   * @param username 用户名
   * @param password 密码
   * @returns 登录结果和JWT令牌
   */
  async login(username: string, password: string): Promise<LoginResult> {
    try {
      this.logger.info(`🔍 用户尝试登录: ${username}`)
      
      // 验证逻辑...
      const user = await this.validateUser(username, password)
      
      if (user) {
        this.logger.info(`✅ 用户登录成功: ${username}`)
        return { success: true, token: this.generateToken(user) }
      } else {
        this.logger.warn(`❌ 用户登录失败: ${username}`)
        throw new Error('用户名或密码错误')
      }
    } catch (error) {
      this.logger.error(`💥 登录过程发生错误: ${error.message}`)
      throw error
    }
  }
}
```

### 🗂️ 文件命名规范

#### 前端文件命名
- **组件**: PascalCase (如: `UserProfile.vue`, `DataTable.vue`)
- **页面**: PascalCase (如: `Dashboard.vue`, `UserManagement.vue`)
- **工具函数**: camelCase (如: `apiClient.ts`, `dateUtils.ts`)
- **类型定义**: camelCase (如: `userTypes.ts`, `apiTypes.ts`)
- **Store**: camelCase (如: `userStore.ts`, `authStore.ts`)

#### 后端文件命名
- **路由**: camelCase (如: `userRoutes.ts`, `authRoutes.ts`)
- **服务**: PascalCase (如: `UserService.ts`, `DatabaseService.ts`)
- **中间件**: camelCase (如: `authMiddleware.ts`, `errorHandler.ts`)
- **类型定义**: camelCase (如: `userTypes.ts`, `databaseTypes.ts`)
- **适配器**: PascalCase (如: `PostgreSQLAdapter.ts`, `MongoDBAdapter.ts`)

### 📝 注释规范

#### 函数注释
```typescript
/**
 * 🔍 根据条件搜索用户
 * @param criteria 搜索条件对象
 * @param options 搜索选项（分页、排序等）
 * @returns Promise<SearchResult<User>> 搜索结果
 * @throws {ValidationError} 当搜索条件无效时抛出
 * @example
 * ```typescript
 * const result = await searchUsers(
 *   { name: '张三', role: 'admin' },
 *   { page: 1, limit: 10, sortBy: 'createdAt' }
 * )
 * ```
 */
async function searchUsers(
  criteria: UserSearchCriteria,
  options: SearchOptions
): Promise<SearchResult<User>> {
  // 实现逻辑...
}
```

#### 类注释
```typescript
/**
 * 🗄️ PostgreSQL数据库适配器
 * 
 * 提供PostgreSQL数据库的连接管理、查询执行和事务处理功能
 * 支持连接池管理和查询优化
 * 
 * @example
 * ```typescript
 * const adapter = new PostgreSQLAdapter({
 *   host: 'localhost',
 *   port: 5432,
 *   database: 'mydb'
 * })
 * 
 * await adapter.connect()
 * const result = await adapter.query('SELECT * FROM users')
 * ```
 */
export class PostgreSQLAdapter implements DatabaseAdapter {
  // 类实现...
}
```

### 🚨 错误处理规范

#### 前端错误处理
```typescript
// ✅ 统一错误处理
try {
  const response = await apiClient.post('/api/users', userData)
  ElMessage.success('✅ 用户创建成功')
  return response.data
} catch (error) {
  console.error('❌ 创建用户失败:', error)
  
  if (error.response?.status === 400) {
    ElMessage.error('⚠️ 请检查输入数据格式')
  } else if (error.response?.status === 409) {
    ElMessage.error('⚠️ 用户已存在')
  } else {
    ElMessage.error('💥 系统错误，请稍后重试')
  }
  
  throw error
}
```

#### 后端错误处理
```typescript
// ✅ 标准化错误响应
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString()
  const path = req.path
  
  logger.error(`💥 请求错误 [${req.method}] ${path}:`, {
    error: error.message,
    stack: error.stack,
    timestamp,
    userAgent: req.get('User-Agent')
  })
  
  // 🔄 标准化错误响应格式
  const errorResponse = {
    message: error.message || '服务器内部错误',
    timestamp,
    path
  }
  
  const statusCode = error instanceof ValidationError ? 400 : 500
  res.status(statusCode).json(errorResponse)
}
```

### 📊 日志规范

#### 日志级别使用
- **ERROR** 💥: 系统错误、异常情况
- **WARN** ⚠️: 警告信息、潜在问题
- **INFO** ℹ️: 重要操作、状态变更
- **DEBUG** 🔍: 调试信息、详细流程

#### 日志格式示例
```typescript
// ✅ 结构化日志
logger.info('🔐 用户登录', {
  userId: user.id,
  username: user.username,
  ip: req.ip,
  userAgent: req.get('User-Agent'),
  timestamp: new Date().toISOString()
})

logger.error('💥 数据库连接失败', {
  database: 'postgresql',
  host: config.db.host,
  error: error.message,
  retryCount: 3
})
```

## 🔧 开发工具配置

### ESLint配置
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error",
    "no-console": "warn"
  }
}
```

### Prettier配置
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

## 🐳 Docker开发规范

### 环境变量管理
```bash
# ✅ 开发环境
NODE_ENV=development
PORT=3001
DATABASE_URL=sqlite:./data/ai-database.db
JWT_SECRET=your-development-secret
OPENAI_API_KEY=sk-your-openai-key

# ✅ 生产环境
NODE_ENV=production
PORT=3001
DATABASE_URL=/app/data/ai-database.db
JWT_SECRET=${JWT_SECRET}
OPENAI_API_KEY=${OPENAI_API_KEY}
REDIS_PASSWORD=${REDIS_PASSWORD}
```

### 容器健康检查
```yaml
# ✅ 后端健康检查
healthcheck:
  test: ["CMD", "node", "-e", "http.get('http://localhost:3001/health', (res) => { res.statusCode === 200 ? process.exit(0) : process.exit(1) })"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## 🧪 测试规范

### 单元测试
```typescript
// ✅ 测试示例
describe('🔐 AuthService', () => {
  let authService: AuthService
  
  beforeEach(() => {
    authService = new AuthService()
  })
  
  describe('login', () => {
    it('✅ 应该成功登录有效用户', async () => {
      // 测试逻辑...
      const result = await authService.login('admin', 'password123')
      expect(result.success).toBe(true)
      expect(result.token).toBeDefined()
    })
    
    it('❌ 应该拒绝无效凭据', async () => {
      // 测试逻辑...
      await expect(authService.login('admin', 'wrongpassword'))
        .rejects.toThrow('用户名或密码错误')
    })
  })
})
```

## 🚀 部署规范

### 生产环境检查清单
- [ ] ✅ 环境变量配置完整
- [ ] 🔒 JWT密钥安全设置
- [ ] 🗄️ 数据库连接测试通过
- [ ] 📊 日志系统正常工作
- [ ] 🔍 健康检查端点响应正常
- [ ] 🛡️ 安全头部配置正确
- [ ] 📈 监控系统部署完成
- [ ] 🔄 备份策略制定完成

### 性能优化
- **前端**: 代码分割、懒加载、CDN加速
- **后端**: 连接池优化、查询缓存、压缩响应
- **数据库**: 索引优化、查询优化、连接池管理
- **容器**: 多阶段构建、镜像优化、资源限制

## 📚 文档规范

### API文档
- 使用Swagger/OpenAPI规范
- 包含完整的请求/响应示例
- 错误码和错误信息说明
- 认证和权限要求说明

### 代码文档
- 每个模块包含README.md
- 复杂算法和业务逻辑详细注释
- 配置文件和环境变量说明
- 部署和运维文档

## 🔄 版本控制规范

### Git提交信息格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### 类型说明
- **feat** ✨: 新功能
- **fix** 🐛: 修复bug
- **docs** 📚: 文档更新
- **style** 💄: 代码格式调整
- **refactor** ♻️: 代码重构
- **test** 🧪: 测试相关
- **chore** 🔧: 构建工具、依赖更新

#### 提交示例
```
feat(auth): ✨ 添加JWT令牌刷新功能

- 实现令牌自动刷新机制
- 添加令牌过期检查中间件
- 更新前端令牌管理逻辑

Closes #123
```

## 🎯 代码审查规范

### 审查要点
- [ ] 🔍 代码逻辑正确性
- [ ] 🛡️ 安全性检查
- [ ] ⚡ 性能影响评估
- [ ] 📝 注释和文档完整性
- [ ] 🧪 测试覆盖率
- [ ] 🎨 代码风格一致性
- [ ] 🔧 错误处理完整性

---

> 📝 **注意**: 本规范会根据项目发展持续更新，请定期查看最新版本。
> 
> 🤝 **贡献**: 如有改进建议，请提交Issue或Pull Request。