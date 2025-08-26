# 后端架构重构设计：数据库单例模式与路由解耦

## 概述

当前后端架构存在数据库实例通过参数传递给路由的紧耦合问题。本设计文档提出将数据库连接改为单例模式，并重构服务层和路由层的依赖关系，实现更好的代码组织和可维护性。

## 当前架构问题分析

### 问题现状

```mermaid
graph TD
    A[App.ts] --> B[getDatabase()]
    B --> C[Database Instance]
    A --> D[createRoutes(db)]
    D --> E[createUserRoutes(db)]
    D --> F[createApiKeyRoutes(db)]
    D --> G[createAuthRoutes(db)]
    E --> H[UserService(db)]
    F --> I[ApiKeyService(db)]
    G --> J[AuthorizationService(db)]
    E --> K[createAuthMiddleware(db)]
    F --> K
    G --> K
```

### 存在的问题

1. **紧耦合**: 数据库实例需要在路由创建时传递，导致依赖链冗长
2. **重复实例化**: 每个服务和中间件都需要接收数据库实例参数
3. **测试困难**: 难以进行单元测试和依赖mock
4. **代码冗余**: 大量重复的数据库实例传递代码
5. **扩展性差**: 添加新服务时需要修改多处代码

## 目标架构设计

### 架构原则

1. **单一职责**: 数据库连接管理与业务逻辑分离
2. **依赖倒置**: 服务层不直接依赖具体数据库实例
3. **代码复用**: 统一的数据库访问方式
4. **可测试性**: 便于单元测试和集成测试

### 重构后架构

```mermaid
graph TD
    A[App.ts] --> B[DatabaseManager.getInstance()]
    B --> C[Singleton Database Instance]
    A --> D[createRoutes()]
    D --> E[createUserRoutes()]
    D --> F[createApiKeyRoutes()]
    D --> G[createAuthRoutes()]
    E --> H[UserService.getInstance()]
    F --> I[ApiKeyService.getInstance()]
    G --> J[AuthorizationService.getInstance()]
    H --> K[DatabaseManager.getDatabase()]
    I --> K
    J --> K
    E --> L[AuthMiddleware.create()]
    L --> K
```

## 核心组件设计

### 1. 数据库管理器（DatabaseManager）

#### 接口定义

```typescript
interface IDatabaseManager {
  getInstance(): Promise<DatabaseManager>;
  getDatabase(): Promise<Database<sqlite3.Database, sqlite3.Statement>>;
  initialize(config?: DatabaseConfig): Promise<void>;
  close(): Promise<void>;
  isConnected(): boolean;
}
```

#### 实现特性

- **单例模式**: 确保全应用只有一个数据库连接实例
- **懒加载**: 只在需要时创建连接
- **连接池管理**: 自动管理连接生命周期
- **错误处理**: 统一的连接错误处理机制
- **健康检查**: 提供连接状态检查功能

### 2. 服务层重构

#### 服务基类设计

```typescript
abstract class BaseService {
  protected static instances: Map<string, BaseService> = new Map();
  
  protected async getDatabase(): Promise<Database> {
    return DatabaseManager.getInstance().getDatabase();
  }
  
  static getInstance<T extends BaseService>(this: new() => T): T {
    const className = this.name;
    if (!BaseService.instances.has(className)) {
      BaseService.instances.set(className, new this());
    }
    return BaseService.instances.get(className) as T;
  }
}
```

#### 服务实现示例

```typescript
class UserService extends BaseService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const db = await this.getDatabase();
    // 业务逻辑实现
  }
  
  async createUser(userData: CreateUserRequest): Promise<User> {
    const db = await this.getDatabase();
    // 业务逻辑实现
  }
}
```

### 3. 中间件重构

#### 认证中间件优化

```typescript
class AuthMiddleware {
  private static instance: AuthMiddleware;
  
  static getInstance(): AuthMiddleware {
    if (!AuthMiddleware.instance) {
      AuthMiddleware.instance = new AuthMiddleware();
    }
    return AuthMiddleware.instance;
  }
  
  authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const db = await DatabaseManager.getInstance().getDatabase();
    // 认证逻辑实现
  };
}
```

### 4. 路由层重构

#### 路由创建器优化

```typescript
export function createUserRoutes(): Router {
  const router = Router();
  const userService = UserService.getInstance();
  const authMiddleware = AuthMiddleware.getInstance();
  
  router.post('/auth/login', async (req, res) => {
    const result = await userService.login(req.body);
    res.json(result);
  });
  
  router.get('/me', authMiddleware.authenticate, async (req, res) => {
    const user = await userService.getCurrentUser(req.user!.id);
    res.json(user);
  });
  
  return router;
}
```

## 实现计划

### 阶段一：数据库管理器实现

1. **创建 DatabaseManager 类**
   - 实现单例模式
   - 提供数据库连接管理
   - 添加连接健康检查

2. **重构数据库配置模块**
   - 将 `getDatabase()` 函数迁移到 DatabaseManager
   - 保持向后兼容的导出方式

### 阶段二：服务层重构

1. **创建 BaseService 抽象类**
   - 提供统一的数据库访问方式
   - 实现服务单例模式

2. **重构现有服务类**
   - UserService
   - ApiKeyService
   - AuthorizationService
   - DatabaseService

### 阶段三：中间件重构

1. **重构认证中间件**
   - 移除数据库参数依赖
   - 实现中间件单例模式

2. **重构其他中间件**
   - 错误处理中间件
   - 限流中间件

### 阶段四：路由层重构

1. **重构路由创建函数**
   - 移除数据库参数
   - 使用服务单例实例

2. **重构应用入口**
   - 简化路由注册流程
   - 优化应用启动逻辑

### 阶段五：测试和验证

1. **单元测试更新**
   - 服务层测试用例
   - 中间件测试用例

2. **集成测试验证**
   - API端到端测试
   - 数据库连接测试

## 详细实现

### DatabaseManager 实现

```typescript
export class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Database<sqlite3.Database, sqlite3.Statement> | null = null;
  private isInitialized = false;
  
  private constructor() {}
  
  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }
  
  async initialize(config?: DatabaseConfig): Promise<void> {
    if (this.isInitialized) return;
    
    const dbPath = config?.path || process.env.DATABASE_URL || './data/ai-database.db';
    const dbDir = path.dirname(dbPath);
    
    await fs.mkdir(dbDir, { recursive: true });
    
    this.db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    await this.db.exec('PRAGMA foreign_keys = ON');
    await this.db.exec('PRAGMA journal_mode = WAL');
    
    await this.initializeTables();
    this.isInitialized = true;
    
    logger.info(`数据库初始化成功: ${dbPath}`);
  }
  
  async getDatabase(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
    if (!this.db) {
      await this.initialize();
    }
    return this.db!;
  }
  
  isConnected(): boolean {
    return this.db !== null && this.isInitialized;
  }
  
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isInitialized = false;
      logger.info('数据库连接已关闭');
    }
  }
}
```

### BaseService 实现

```typescript
export abstract class BaseService {
  private static instances: Map<string, BaseService> = new Map();
  
  protected async getDatabase(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
    return DatabaseManager.getInstance().getDatabase();
  }
  
  static getInstance<T extends BaseService>(this: new() => T): T {
    const className = this.name;
    if (!BaseService.instances.has(className)) {
      BaseService.instances.set(className, new this());
    }
    return BaseService.instances.get(className) as T;
  }
  
  protected async executeQuery<T = any>(
    sql: string, 
    params?: any[]
  ): Promise<T> {
    const db = await this.getDatabase();
    return db.get(sql, params) as Promise<T>;
  }
  
  protected async executeAll<T = any>(
    sql: string, 
    params?: any[]
  ): Promise<T[]> {
    const db = await this.getDatabase();
    return db.all(sql, params) as Promise<T[]>;
  }
  
  protected async executeRun(
    sql: string, 
    params?: any[]
  ): Promise<sqlite3.RunResult> {
    const db = await this.getDatabase();
    return db.run(sql, params);
  }
}
```

### 重构后的 UserService

```typescript
export class UserService extends BaseService {
  static getInstance(): UserService {
    return super.getInstance.call(this);
  }
  
  async login(
    credentials: LoginRequest,
    clientInfo?: { ip?: string; userAgent?: string }
  ): Promise<LoginResponse> {
    const { username, password, rememberMe } = credentials;
    
    const user = await this.executeQuery<any>(
      'SELECT * FROM users WHERE username = ? AND status = "active"',
      [username]
    );
    
    if (!user) {
      await this.logLoginAttempt(username, false, '用户不存在或已禁用', clientInfo);
      throw new AppError('用户名或密码错误', 401);
    }
    
    // 验证密码逻辑...
    const isValidPassword = await this.verifyPassword(password, user.password_hash, user.salt);
    
    if (!isValidPassword) {
      await this.logLoginAttempt(username, false, '密码错误', clientInfo);
      throw new AppError('用户名或密码错误', 401);
    }
    
    // 生成JWT令牌
    const tokenService = TokenService.getInstance();
    const token = tokenService.generateToken({
      userId: user.id,
      username: user.username,
      role: user.role
    });
    
    // 更新登录信息
    await this.executeRun(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP, login_count = login_count + 1 WHERE id = ?',
      [user.id]
    );
    
    await this.logLoginAttempt(username, true, null, clientInfo);
    
    return {
      user: this.sanitizeUser(user),
      token,
      expiresAt: new Date(Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000))
    };
  }
}
```

### 重构后的路由

```typescript
export function createUserRoutes(): Router {
  const router = Router();
  const userService = UserService.getInstance();
  const authMiddleware = AuthMiddleware.getInstance();
  
  router.post('/auth/login', async (req, res) => {
    try {
      const { username, password, rememberMe } = req.body;
      
      if (!username || !password) {
        throw new AppError('用户名和密码不能为空', 400, true, req.url);
      }
      
      const clientInfo = {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      };
      
      const result = await userService.login(
        { username, password, rememberMe },
        clientInfo
      );
      
      res.json(result);
    } catch (error: any) {
      throw new AppError(error.message || '登录失败', 401, true, req.url);
    }
  });
  
  router.get('/me', authMiddleware.authenticate, async (req, res) => {
    try {
      const user = await userService.getCurrentUser(req.user!.id);
      res.json(user);
    } catch (error: any) {
      throw new AppError(error.message || '获取用户信息失败', 500, true, req.url);
    }
  });
  
  return router;
}
```

### 应用入口重构

```typescript
class App {
  public app: express.Application;
  public port: number;
  
  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000', 10);
    this.initializeMiddleware();
  }
  
  private async initializeRoutes(): Promise<void> {
    // 健康检查
    this.app.get('/health', (req, res) => {
      const dbManager = DatabaseManager.getInstance();
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        database: dbManager.isConnected() ? 'connected' : 'disconnected'
      });
    });
    
    console.log('🔄 初始化API路由...');
    const routes = createRoutes();
    const apiPrefix = process.env.API_PREFIX || '/api/v1';
    this.app.use(apiPrefix, routes);
    console.log(`✅ API路由注册成功: ${apiPrefix}`);
  }
  
  public async start(): Promise<void> {
    try {
      // 初始化数据库管理器
      await DatabaseManager.getInstance().initialize();
      
      // 初始化路由
      await this.initializeRoutes();
      
      // 初始化错误处理
      this.initializeErrorHandling();
      
      // 启动服务器
      const server = createServer(this.app);
      server.listen(this.port, () => {
        console.log(`🚀 AI数据库管理系统后端启动成功！`);
        console.log(`📡 服务器地址: http://localhost:${this.port}`);
        console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
      });
      
      this.setupGracefulShutdown(server);
    } catch (error) {
      console.error('❌ 服务器启动失败:', error);
      process.exit(1);
    }
  }
  
  private setupGracefulShutdown(server: any): void {
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n收到 ${signal} 信号，正在优雅关闭服务器...`);
      
      server.close(async () => {
        await DatabaseManager.getInstance().close();
        console.log('HTTP服务器已关闭');
        process.exit(0);
      });
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }
}
```

## 测试策略

### 单元测试

```typescript
describe('UserService', () => {
  beforeEach(async () => {
    // 使用内存数据库进行测试
    await DatabaseManager.getInstance().initialize({
      path: ':memory:'
    });
  });
  
  afterEach(async () => {
    await DatabaseManager.getInstance().close();
  });
  
  it('should login successfully with valid credentials', async () => {
    const userService = UserService.getInstance();
    
    // 创建测试用户
    await userService.createUser({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    
    // 测试登录
    const result = await userService.login({
      username: 'testuser',
      password: 'password123'
    });
    
    expect(result.user.username).toBe('testuser');
    expect(result.token).toBeDefined();
  });
});
```

### 集成测试

```typescript
describe('API Integration Tests', () => {
  let app: Express;
  
  beforeAll(async () => {
    app = new App().app;
    await DatabaseManager.getInstance().initialize({
      path: './test/test.db'
    });
  });
  
  afterAll(async () => {
    await DatabaseManager.getInstance().close();
  });
  
  it('should handle user login flow', async () => {
    const response = await request(app)
      .post('/api/v1/users/auth/login')
      .send({
        username: 'testuser',
        password: 'password123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });
});
```

## 迁移方案

### 向后兼容性

为确保平滑迁移，保留原有的导出方式：

```typescript
// database.ts
export async function getDatabase(): Promise<Database> {
  return DatabaseManager.getInstance().getDatabase();
}

export async function connectDatabase(): Promise<Database> {
  await DatabaseManager.getInstance().initialize();
  return DatabaseManager.getInstance().getDatabase();
}
```

### 渐进式迁移

1. **第一阶段**: 引入新的单例模式，保持原有接口
2. **第二阶段**: 逐步迁移服务类使用新模式
3. **第三阶段**: 迁移路由和中间件
4. **第四阶段**: 移除旧的依赖注入方式

## 预期收益

### 性能提升

- **减少内存占用**: 单例模式避免重复实例化
- **连接池优化**: 统一的数据库连接管理
- **启动时间减少**: 简化应用启动流程

### 代码质量

- **可维护性提升**: 清晰的依赖关系
- **可测试性增强**: 便于mock和单元测试
- **扩展性改善**: 易于添加新服务和功能

### 开发效率

- **开发体验优化**: 减少样板代码
- **调试便利**: 统一的错误处理机制
- **文档完善**: 清晰的架构文档和接口定义