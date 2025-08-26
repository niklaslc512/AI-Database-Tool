# AI语义化数据库管理系统设计文档

## 1. 项目概览

### 1.1 系统目标
设计一个由大模型驱动的AI语义化数据库管理系统，专注于支持PostgreSQL和MongoDB，通过自然语言交互实现智能数据库操作。系统支持管理多个数据库连接，提供全文搜索、向量搜索、连表查询和数据统计等高级AI功能。

### 1.2 核心价值
- **AI语义化操作**: 通过自然语言描述需求，AI智能理解并生成相应的查询语句
- **多连接管理**: 统一界面管理多个PostgreSQL和MongoDB数据库连接
- **全文/向量搜索**: 支持传统全文搜索和基于向量的语义搜索
- **智能连表查询**: AI自动推断表关系，生成复杂的连表查询
- **数据统计分析**: 提供智能的数据统计和分析功能
- **连接池管理**: 高效的数据库连接池管理和复用

### 1.3 技术栈

#### 前端技术栈
- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **样式**: TailwindCSS v4
- **状态管理**: Pinia
- **路由**: Vue Router
- **HTTP客户端**: Axios
- **组件库**: Element Plus
- **可视化**: D3.js, ECharts（用于数据和向量可视化）

#### 后端技术栈
- **运行时**: Node.js 22+
- **框架**: Express.js 5 (beta)
- **语言**: TypeScript（全项目类型安全）
- **数据库驱动**: pg (PostgreSQL), mongodb (MongoDB)
- **连接管理**: 自定义连接池管理器，支持多实例负载均衡
- **AI集成**: OpenAI API, 本地LLM支持，多连接智能路由
- **向量处理**: pgvector, MongoDB Atlas Vector Search
- **缓存**: Redis（查询结果缓存，会话管理）
- **监控**: 自定义性能监控，连接状态追踪
- **日志**: Winston（结构化日志，按连接分类）

#### AI和搜索技术
- **向量数据库**: PostgreSQL + pgvector扩展
- **文档数据库**: MongoDB + 全文索引
- **向量嵌入**: OpenAI Embeddings, 本地嵌入模型
- **自然语言处理**: 大语言模型API
- **语义分析**: 自定义语义分析引擎

## 2. 系统架构

### 2.1 AI语义化多连接管理架构图

```mermaid
graph TB
    subgraph "前端界面层"
        A[连接管理界面]
        B[AI查询工作台]
        C[语义搜索面板]
        D[数据统计仪表板]
        E[向量可视化组件]
    end
    
    subgraph "AI语义处理层"
        F[自然语言理解NLU]
        G[意图识别引擎]
        H[语义查询生成器]
        I[向量嵌入服务]
        J[智能分析引擎]
    end
    
    subgraph "连接管理层"
        K[连接池管理器]
        L[适配器工厂]
        M[会话管理器]
        N[负载均衡器]
    end
    
    subgraph "数据库适配层"
        O[PostgreSQL适配器池]
        P[MongoDB适配器池]
        Q[查询优化器]
        R[结果缓存层]
    end
    
    subgraph "AI增强功能模块"
        S[全文搜索引擎]
        T[向量搜索引擎]
        U[智能连表分析]
        V[数据统计分析]
        W[查询性能优化]
    end
    
    subgraph "多数据库实例"
        X1[PostgreSQL实例1]
        X2[PostgreSQL实例2]
        Y1[MongoDB实例1]
        Y2[MongoDB实例2]
        Z[更多数据库...]
    end
    
    A --> K
    B --> F
    C --> H
    D --> J
    E --> I
    
    F --> G
    G --> H
    H --> L
    I --> T
    J --> V
    
    K --> L
    L --> O
    L --> P
    M --> N
    N --> Q
    
    O --> S
    O --> T
    O --> U
    O --> X1
    O --> X2
    
    P --> S
    P --> T
    P --> V
    P --> Y1
    P --> Y2
    
    Q --> W
    R --> O
    R --> P
```

### 2.2 模块架构

```mermaid
graph LR
    subgraph "前端模块"
        A1[连接管理]
        A2[查询执行器]
        A3[AI助手]
        A4[数据可视化]
        A5[用户管理]
    end
    
    subgraph "后端模块"
        B1[连接管理器]
        B2[查询处理器]
        B3[AI集成服务]
        B4[安全管理]
        B5[审计日志]
    end
    
    A1 <--> B1
    A2 <--> B2
    A3 <--> B3
    A4 <--> B2
    A5 <--> B4
```

## 3. 核心功能需求

### 3.1 多数据库连接管理

#### 3.1.1 连接生命周期管理
- **连接创建**: 支持创建和配置多个PostgreSQL/MongoDB连接
- **连接验证**: 实时检测连接状态和健康度
- **连接复用**: 智能连接池管理，提高连接利用效率
- **连接监控**: 实时监控连接性能和使用统计
- **连接清理**: 自动清理空闲和异常连接

#### 3.1.2 连接池管理
- **动态扩缩容**: 根据负载动态调整连接池大小
- **负载均衡**: 智能分配查询到不同的数据库实例
- **故障转移**: 连接失败时自动切换到备用连接
- **性能优化**: 连接预热和保活机制

#### 3.1.1 支持的数据库类型
- **关系型数据库**: PostgreSQL（支持向量搜索扩展pgvector）
- **NoSQL数据库**: MongoDB（支持Atlas Vector Search和全文搜索）

#### 3.1.2 AI语义化功能支持
- **PostgreSQL**: 全文搜索、向量搜索（pgvector）、智能连表、数据统计
- **MongoDB**: 全文搜索、向量搜索（Atlas Vector Search）、聚合查询、文档分析

#### 3.1.3 多连接管理配置
```typescript
interface DatabaseConnection {
  id: string;
  name: string;
  type: 'postgresql' | 'mongodb';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  connectionString?: string;
  // 连接元数据
  metadata: {
    description?: string;
    environment: 'development' | 'staging' | 'production' | 'testing';
    tags: string[];
    createdAt: Date;
    lastUsed?: Date;
  };
  // AI功能配置
  aiFeatures: {
    enableVectorSearch: boolean;
    enableFullTextSearch: boolean;
    enableSemanticAnalysis: boolean;
    vectorDimensions?: number;
    searchLanguage: string;
    autoIndexing: boolean;
  };
  // 连接池配置
  poolConfig?: {
    maxConnections: number;
    minConnections: number;
    acquireTimeout: number;
    idleTimeout: number;
  };
}
```

### 3.2 AI语义化查询功能

#### 3.2.1 智能语义查询
- **自然语言理解**: 深度理解用户的查询意图和语义
- **智能SQL生成**: 根据语义生成PostgreSQL或MongoDB查询语句
- **语义相似性搜索**: 基于向量嵌入的语义搜索功能
- **多语言支持**: 支持中文、英文等多语言查询

#### 3.2.2 全文搜索增强
- **PostgreSQL**: 使用内置全文搜索功能，支持中文分词
- **MongoDB**: 使用文本索引和正则表达式搜索
- **相关性排序**: 根据匹配度和相关性对结果排序
- **高亮显示**: 在搜索结果中高亮显示匹配的关键词

#### 3.2.3 向量搜索功能
- **PostgreSQL + pgvector**: 支持高维向量相似性搜索
- **MongoDB Atlas Vector Search**: 云端向量搜索服务
- **语义嵌入**: 将文本内容转换为向量表示
- **相似度计算**: 支持余弦相似度、欧几里得距离等

#### 3.2.4 智能连表查询
- **关系推断**: AI自动识别表之间的关联关系
- **智能JOIN**: 根据外键和命名约定自动生成连表查询
- **复杂聚合**: 支持跨表的复杂统计和分析查询
- **查询优化**: 自动优化查询性能和执行计划

#### 3.2.3 AI功能流程
```mermaid
flowchart TD
    A[用户输入自然语言] --> B[意图识别]
    B --> C[上下文分析]
    C --> D[SQL生成]
    D --> E[语法检查]
    E --> F[安全检查]
    F --> G[用户确认]
    G --> H[执行查询]
    H --> I[结果展示]
    
    G --> J[用户修改]
    J --> D
```

### 3.3 AI增强的数据库操作

#### 3.3.1 智能表管理
- **结构分析**: AI分析表结构和数据类型分布
- **索引建议**: 基于查询模式自动推荐索引创建
- **向量索引**: 自动创建和管理向量搜索索引
- **全文索引**: 智能配置全文搜索索引

#### 3.3.2 语义化数据统计
- **智能统计**: 自动分析数据分布、异常值、缺失值
- **列相关性**: 分析不同列之间的相关性和依赖关系
- **数据质量**: 评估数据完整性和一致性
- **趋势分析**: 识别数据中的时间趋势和模式

#### 3.3.3 智能数据可视化
- **自适应图表**: 根据数据类型自动选择合适的可视化方式
- **语义关系图**: 展示数据实体之间的语义关系
- **向量空间可视化**: 可视化高维向量数据的分布
- **交互式探索**: 支持数据的交互式探索和分析

#### 3.3.4 数据操作增强
- **批量处理**: 支持大规模数据的批量导入和处理
- **数据清洗**: AI辅助的数据清洗和标准化
- **格式转换**: 智能的数据格式转换和迁移
- **增量更新**: 支持数据的增量更新和同步

## 4. 前端架构设计

### 4.1 多连接管理界面组件

```mermaid
graph TD
    A[App根组件] --> B[主布局MainLayout]
    B --> C[连接管理面板ConnectionPanel]
    B --> D[AI工作台AIWorkspace]
    B --> E[状态监控StatusMonitor]
    
    C --> F[连接列表ConnectionList]
    C --> G[连接创建器ConnectionCreator]
    C --> H[连接监控ConnectionMonitor]
    
    D --> I[多标签查询器MultiTabQuery]
    D --> J[AI语义搜索SemanticSearch]
    D --> K[数据可视化DataVisualization]
    D --> L[结果展示ResultViewer]
    
    E --> M[连接状态面板ConnectionStatus]
    E --> N[性能指标面板PerformanceMetrics]
    E --> O[系统日志LogViewer]
    
    F --> P[连接卡片ConnectionCard]
    P --> Q[连接操作菜单ConnectionActions]
    
    I --> R[查询标签页QueryTab]
    R --> S[SQL编辑器SQLEditor]
    R --> T[AI助手AIAssistant]
```

### 4.2 多连接管理状态设计

```typescript
// 多连接管理的Pinia Store结构
interface AppState {
  user: UserState;
  connections: MultiConnectionState;
  queries: MultiQueryState;
  ai: EnhancedAIState;
  monitoring: MonitoringState;
}

// 多连接状态管理
interface MultiConnectionState {
  // 连接管理
  activeConnections: Map<string, DatabaseConnection>;
  connectionList: DatabaseConnection[];
  connectionStatus: Map<string, ConnectionStatus>;
  connectionMetrics: Map<string, ConnectionMetrics>;
  
  // 连接池状态
  poolStatistics: PoolStatistics;
  
  // 当前选中的连接
  currentConnectionId: string | null;
  
  // 连接操作状态
  isConnecting: Map<string, boolean>;
  connectionErrors: Map<string, string>;
}

// 多查询会话状态
interface MultiQueryState {
  // 多标签查询
  queryTabs: Map<string, QueryTab>;
  activeTabId: string | null;
  
  // 查询历史（按连接分组）
  queryHistoryByConnection: Map<string, QueryRecord[]>;
  
  // 跨连接查询结果
  crossConnectionResults: CrossConnectionResult[];
  
  // 批量操作状态
  batchOperations: BatchOperation[];
}

// 增强AI状态
interface EnhancedAIState {
  // AI会话（按连接分组）
  conversationsByConnection: Map<string, AIConversation>;
  
  // 全局AI建议
  globalSuggestions: AISuggestion[];
  
  // 跨连接智能分析
  crossConnectionInsights: AIInsight[];
  
  // AI处理状态
  processingStates: Map<string, AIProcessingState>;
}

// 监控状态
interface MonitoringState {
  // 实时性能指标
  performanceMetrics: Map<string, PerformanceMetric[]>;
  
  // 系统健康状态
  systemHealth: SystemHealthStatus;
  
  // 告警信息
  alerts: Alert[];
  
  // 日志记录
  recentLogs: LogEntry[];
}

// 辅助类型定义
interface ConnectionStatus {
  connected: boolean;
  lastChecked: Date;
  responseTime: number;
  error?: string;
}

interface ConnectionMetrics {
  createdAt: Date;
  lastUsed: Date;
  queryCount: number;
  errorCount: number;
  avgResponseTime: number;
}

interface QueryTab {
  id: string;
  title: string;
  connectionId: string;
  query: string;
  results?: QueryResult;
  isActive: boolean;
  isDirty: boolean;
}
```

### 4.3 路由设计

```typescript
const routes = [
  {
    path: '/',
    component: Layout,
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', component: Dashboard },
      { path: 'connections', component: ConnectionManager },
      { path: 'query/:connectionId?', component: QueryWorkspace },
      { path: 'ai-assistant', component: AIAssistant },
      { path: 'settings', component: Settings }
    ]
  },
  { path: '/login', component: Login },
  { path: '/register', component: Register }
];
```

### 4.4 AI助手组件设计

#### 4.4.1 智能查询组件

```typescript
// 智能查询组件
const IntelligentQueryPanel = defineComponent({
  setup() {
    const aiStore = useAIStore();
    const queryStore = useQueryStore();
    
    const naturalQuery = ref('');
    const isAnalyzing = ref(false);
    const queryResult = ref<IntelligentQueryResult | null>(null);
    
    const analyzeQuery = async () => {
      if (!naturalQuery.value.trim()) return;
      
      isAnalyzing.value = true;
      try {
        queryResult.value = await aiStore.processNaturalQuery(
          queryStore.activeConnectionId,
          naturalQuery.value
        );
      } finally {
        isAnalyzing.value = false;
      }
    };
    
    const executeQuery = async () => {
      if (!queryResult.value) return;
      
      await queryStore.executeQuery(
        queryResult.value.query.sql,
        queryResult.value.query.optimizedSQL
      );
    };
    
    return {
      naturalQuery,
      isAnalyzing,
      queryResult,
      analyzeQuery,
      executeQuery
    };
  }
});
```

#### 4.4.2 表管理组件

```typescript
// 智能表管理组件
const IntelligentTableManager = defineComponent({
  setup() {
    const tableStore = useTableStore();
    const aiStore = useAIStore();
    
    const tableOperation = ref('');
    const isProcessing = ref(false);
    const managementResult = ref<TableManagementResult | null>(null);
    
    const processTableOperation = async () => {
      if (!tableOperation.value.trim()) return;
      
      isProcessing.value = true;
      try {
        managementResult.value = await aiStore.processTableManagement(
          tableStore.activeConnectionId,
          tableOperation.value
        );
      } finally {
        isProcessing.value = false;
      }
    };
    
    const executeTableOperation = async () => {
      if (!managementResult.value) return;
      
      if (managementResult.value.type === 'create') {
        await tableStore.createTable(managementResult.value.sql);
      } else if (managementResult.value.type === 'alter') {
        await tableStore.alterTable(managementResult.value.modifications);
      }
    };
    
    return {
      tableOperation,
      isProcessing,
      managementResult,
      processTableOperation,
      executeTableOperation
    };
  }
});
```

#### 4.4.3 JSON Schema展示组件

```typescript
// JSON Schema展示组件
const JSONSchemaViewer = defineComponent({
  props: {
    schema: {
      type: Object as PropType<JSONSchema>,
      required: true
    },
    data: {
      type: Array as PropType<Record<string, any>[]>,
      default: () => []
    }
  },
  
  setup(props) {
    const formatSchema = (schema: JSONSchema) => {
      return JSON.stringify(schema, null, 2);
    };
    
    const validateData = (item: Record<string, any>) => {
      // 使用JSON Schema验证数据
      return validateAgainstSchema(item, props.schema);
    };
    
    const exportSchema = () => {
      const blob = new Blob([formatSchema(props.schema)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'schema.json';
      link.click();
    };
    
    return {
      formatSchema,
      validateData,
      exportSchema
    };
  }
});
```

## 5. 多连接管理核心功能

### 5.1 连接生命周期管理

#### 5.1.1 连接创建和配置
```typescript
// 连接创建服务
class ConnectionManager {
  private connections = new Map<string, DatabaseConnection>();
  private adapters = new Map<string, DatabaseAdapter>();
  
  async createConnection(config: DatabaseConnectionConfig): Promise<string> {
    // 验证连接配置
    const errors = this.validateConfig(config);
    if (errors.length > 0) {
      throw new ValidationError('连接配置无效', errors);
    }
    
    // 生成唯一连接ID
    const connectionId = this.generateConnectionId(config);
    
    // 测试连接
    const adapter = AdapterFactory.createAdapter(config.type);
    await adapter.connect(config);
    
    // 保存连接信息
    this.connections.set(connectionId, {
      ...config,
      id: connectionId,
      metadata: {
        ...config.metadata,
        createdAt: new Date(),
        status: 'connected'
      }
    });
    
    return connectionId;
  }
  
  async updateConnection(id: string, updates: Partial<DatabaseConnection>): Promise<void> {
    const connection = this.connections.get(id);
    if (!connection) {
      throw new NotFoundError('连接不存在');
    }
    
    // 更新连接配置
    const updatedConnection = { ...connection, ...updates };
    
    // 重新建立连接
    await this.reconnect(id, updatedConnection);
    
    this.connections.set(id, updatedConnection);
  }
}
```

#### 5.1.2 智能连接监控
```typescript
// 连接监控服务
class ConnectionMonitor {
  private healthCheckInterval = 30000; // 30秒
  private performanceWindow = 300000; // 5分钟性能窗口
  
  startMonitoring(): void {
    setInterval(() => {
      this.performHealthCheck();
    }, this.healthCheckInterval);
  }
  
  async performHealthCheck(): Promise<void> {
    const connections = AdapterFactory.getActiveConnections();
    
    for (const connectionKey of connections) {
      try {
        const startTime = Date.now();
        const adapter = await AdapterFactory.getAdapterByKey(connectionKey);
        const isHealthy = await adapter.testConnection();
        const responseTime = Date.now() - startTime;
        
        // 记录健康状态
        this.recordHealthMetric(connectionKey, {
          healthy: isHealthy,
          responseTime,
          timestamp: new Date()
        });
        
        // 触发告警
        if (!isHealthy || responseTime > 5000) {
          this.triggerAlert(connectionKey, {
            type: isHealthy ? 'slow_response' : 'connection_failed',
            responseTime,
            timestamp: new Date()
          });
        }
      } catch (error) {
        this.handleMonitoringError(connectionKey, error);
      }
    }
  }
}
```

### 5.2 跨连接AI语义分析

#### 5.2.1 多数据源智能查询
```typescript
// 跨连接查询服务
class CrossConnectionQueryService {
  async executeSemanticQuery(
    query: string, 
    connectionIds: string[]
  ): Promise<CrossConnectionResult> {
    // AI分析查询意图
    const intent = await this.aiService.analyzeQueryIntent(query);
    
    // 确定数据源分配
    const queryPlan = await this.planMultiSourceQuery(intent, connectionIds);
    
    // 并行执行查询
    const results = await Promise.all(
      queryPlan.subQueries.map(async (subQuery) => {
        const adapter = await AdapterFactory.getAdapter(subQuery.connection);
        return adapter.executeQuery(subQuery.sql, subQuery.params);
      })
    );
    
    // 合并和关联结果
    const mergedResult = await this.mergeQueryResults(results, queryPlan);
    
    return {
      originalQuery: query,
      queryPlan,
      results: mergedResult,
      executionTime: queryPlan.totalExecutionTime,
      sourceConnections: connectionIds
    };
  }
  
  private async planMultiSourceQuery(
    intent: QueryIntent, 
    connectionIds: string[]
  ): Promise<MultiSourceQueryPlan> {
    // 获取各连接的模式信息
    const schemas = await Promise.all(
      connectionIds.map(id => this.getConnectionSchema(id))
    );
    
    // AI智能分配查询到不同数据源
    const distribution = await this.aiService.distributeQuery(intent, schemas);
    
    return {
      subQueries: distribution.queries,
      joinStrategy: distribution.joinStrategy,
      aggregationPlan: distribution.aggregation
    };
  }
}
```

### 5.3 负载均衡和故障转移

#### 5.3.1 智能负载分配
```typescript
// 负载均衡器
class ConnectionLoadBalancer {
  private strategies = {
    'round_robin': this.roundRobinStrategy,
    'least_connections': this.leastConnectionsStrategy,
    'performance_based': this.performanceBasedStrategy
  };
  
  async selectOptimalConnection(
    connectionType: 'postgresql' | 'mongodb',
    queryComplexity: 'simple' | 'complex'
  ): Promise<string> {
    const availableConnections = AdapterFactory.getAdaptersByType(connectionType);
    
    if (availableConnections.length === 0) {
      throw new NoConnectionError(`没有可用的${connectionType}连接`);
    }
    
    // 根据查询复杂度选择策略
    const strategy = queryComplexity === 'complex' 
      ? 'performance_based' 
      : 'round_robin';
    
    return this.strategies[strategy](availableConnections);
  }
  
  private async performanceBasedStrategy(connections: string[]): Promise<string> {
    const metrics = await AdapterFactory.getDetailedConnectionStatus();
    
    // 选择性能最好的连接
    let bestConnection = connections[0];
    let bestScore = 0;
    
    for (const connection of connections) {
      const metric = metrics.find(m => m.key === connection);
      if (metric) {
        const score = this.calculatePerformanceScore(metric);
        if (score > bestScore) {
          bestScore = score;
          bestConnection = connection;
        }
      }
    }
    
    return bestConnection;
  }
  
  private calculatePerformanceScore(metric: any): number {
    // 综合考虑响应时间、错误率、负载等因素
    const responseScore = Math.max(0, 100 - (metric.avgResponseTime / 10));
    const errorScore = Math.max(0, 100 - (metric.errorCount / metric.queryCount * 100));
    const loadScore = Math.max(0, 100 - (metric.queryCount / 1000 * 100));
    
    return (responseScore + errorScore + loadScore) / 3;
  }
}
```

### 5.4 多连接会话管理

#### 5.4.1 会话状态同步
```typescript
// 会话管理器
class MultiConnectionSessionManager {
  private sessions = new Map<string, UserSession>();
  
  async createSession(userId: string): Promise<string> {
    const sessionId = this.generateSessionId();
    
    const session: UserSession = {
      id: sessionId,
      userId,
      connections: new Map(),
      activeQueries: new Map(),
      aiContext: new AIContext(),
      createdAt: new Date(),
      lastActivity: new Date()
    };
    
    this.sessions.set(sessionId, session);
    return sessionId;
  }
  
  async addConnectionToSession(
    sessionId: string, 
    connectionId: string
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundError('会话不存在');
    }
    
    // 获取连接适配器
    const connection = await ConnectionManager.getConnection(connectionId);
    const adapter = await AdapterFactory.getAdapter(connection);
    
    // 添加到会话
    session.connections.set(connectionId, {
      connection,
      adapter,
      joinedAt: new Date(),
      queryCount: 0
    });
    
    // 更新AI上下文
    await this.updateAIContext(session, connectionId);
  }
  
  private async updateAIContext(
    session: UserSession, 
    connectionId: string
  ): Promise<void> {
    const connection = session.connections.get(connectionId);
    if (connection) {
      // 获取数据库模式信息
      const schema = await connection.adapter.getTables();
      
      // 更新AI上下文
      session.aiContext.addConnectionSchema(connectionId, {
        type: connection.connection.type,
        tables: schema,
        capabilities: this.getConnectionCapabilities(connection.connection.type)
      });
    }
  }
}
```

## 6. 统一数据库接口设计

### 5.1 接口抽象层

#### 5.1.1 核心接口定义

```typescript
// 统一数据库操作接口
interface DatabaseAdapter {
  // 连接管理
  connect(config: DatabaseConnection): Promise<void>;
  disconnect(): Promise<void>;
  testConnection(): Promise<boolean>;
  
  // 查询操作
  executeQuery(sql: string, params?: any[]): Promise<QueryResult>;
  executeTransaction(queries: TransactionQuery[]): Promise<QueryResult[]>;
  
  // 结构查询
  getDatabases(): Promise<DatabaseInfo[]>;
  getTables(database?: string): Promise<TableInfo[]>;
  getTableSchema(tableName: string): Promise<ColumnInfo[]>;
  getIndexes(tableName: string): Promise<IndexInfo[]>;
  
  // 数据操作
  insert(tableName: string, data: Record<string, any>): Promise<InsertResult>;
  update(tableName: string, data: Record<string, any>, where: WhereClause): Promise<UpdateResult>;
  delete(tableName: string, where: WhereClause): Promise<DeleteResult>;
  
  // 性能分析
  explainQuery(sql: string): Promise<ExplainResult>;
  getQueryStats(): Promise<QueryStats>;
}

// 通用数据类型
interface QueryResult {
  rows: Record<string, any>[];
  rowCount: number;
  fields: FieldInfo[];
  executionTime: number;
  affectedRows?: number;
}

interface TableInfo {
  name: string;
  type: 'table' | 'view' | 'collection';
  rowCount?: number;
  size?: string;
  engine?: string;
  collation?: string;
  comment?: string;
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  isPrimaryKey: boolean;
  isAutoIncrement: boolean;
  maxLength?: number;
  precision?: number;
  scale?: number;
  comment?: string;
}
```

#### 5.1.2 SQL方言抽象

```typescript
// SQL方言转换接口
interface SQLDialect {
  // 数据类型映射
  mapDataType(genericType: string): string;
  
  // 语法转换
  limitClause(limit: number, offset?: number): string;
  dateFormat(format: string): string;
  quoteIdentifier(identifier: string): string;
  
  // 特殊函数映射
  concat(...columns: string[]): string;
  substring(column: string, start: number, length?: number): string;
  currentTimestamp(): string;
}

// MySQL方言实现
class MySQLDialect implements SQLDialect {
  mapDataType(genericType: string): string {
    const typeMap = {
      'string': 'VARCHAR',
      'text': 'TEXT',
      'integer': 'INT',
      'bigint': 'BIGINT',
      'decimal': 'DECIMAL',
      'boolean': 'BOOLEAN',
      'date': 'DATE',
      'datetime': 'DATETIME',
      'timestamp': 'TIMESTAMP'
    };
    return typeMap[genericType] || genericType;
  }
  
  limitClause(limit: number, offset?: number): string {
    return offset ? `LIMIT ${offset}, ${limit}` : `LIMIT ${limit}`;
  }
  
  quoteIdentifier(identifier: string): string {
    return `\`${identifier}\``;
  }
  
  concat(...columns: string[]): string {
    return `CONCAT(${columns.join(', ')})`;
  }
  
  currentTimestamp(): string {
    return 'NOW()';
  }
}

// PostgreSQL方言实现
class PostgreSQLDialect implements SQLDialect {
  mapDataType(genericType: string): string {
    const typeMap = {
      'string': 'VARCHAR',
      'text': 'TEXT',
      'integer': 'INTEGER',
      'bigint': 'BIGINT',
      'decimal': 'NUMERIC',
      'boolean': 'BOOLEAN',
      'date': 'DATE',
      'datetime': 'TIMESTAMP',
      'timestamp': 'TIMESTAMP WITH TIME ZONE'
    };
    return typeMap[genericType] || genericType;
  }
  
  limitClause(limit: number, offset?: number): string {
    return offset ? `LIMIT ${limit} OFFSET ${offset}` : `LIMIT ${limit}`;
  }
  
  quoteIdentifier(identifier: string): string {
    return `"${identifier}"`;
  }
  
  concat(...columns: string[]): string {
    return `${columns.join(' || ')}`;
  }
  
  currentTimestamp(): string {
    return 'CURRENT_TIMESTAMP';
  }
}
```

### 5.2 适配器模式实现

#### 5.2.1 关系型数据库适配器

```typescript
// MySQL适配器
class MySQLAdapter implements DatabaseAdapter {
  private connection: mysql.Connection;
  private dialect: MySQLDialect;
  
  constructor(private config: DatabaseConnection) {
    this.dialect = new MySQLDialect();
  }
  
  async connect(): Promise<void> {
    this.connection = await mysql.createConnection({
      host: this.config.host,
      port: this.config.port,
      user: this.config.username,
      password: this.config.password,
      database: this.config.database,
      ssl: this.config.ssl
    });
  }
  
  async executeQuery(sql: string, params?: any[]): Promise<QueryResult> {
    const startTime = Date.now();
    const [rows, fields] = await this.connection.execute(sql, params);
    const executionTime = Date.now() - startTime;
    
    return {
      rows: rows as Record<string, any>[],
      rowCount: (rows as any[]).length,
      fields: this.mapFields(fields),
      executionTime
    };
  }
  
  async getTables(): Promise<TableInfo[]> {
    const sql = `
      SELECT 
        TABLE_NAME as name,
        TABLE_TYPE as type,
        TABLE_ROWS as rowCount,
        ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as size,
        ENGINE as engine,
        TABLE_COLLATION as collation,
        TABLE_COMMENT as comment
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
    `;
    
    const result = await this.executeQuery(sql, [this.config.database]);
    return result.rows.map(row => ({
      name: row.name,
      type: row.type === 'BASE TABLE' ? 'table' : 'view',
      rowCount: row.rowCount,
      size: `${row.size}MB`,
      engine: row.engine,
      collation: row.collation,
      comment: row.comment
    }));
  }
  
  async getTableSchema(tableName: string): Promise<ColumnInfo[]> {
    const sql = `
      SELECT 
        COLUMN_NAME as name,
        DATA_TYPE as type,
        IS_NULLABLE as nullable,
        COLUMN_DEFAULT as defaultValue,
        COLUMN_KEY as key,
        EXTRA as extra,
        CHARACTER_MAXIMUM_LENGTH as maxLength,
        NUMERIC_PRECISION as precision,
        NUMERIC_SCALE as scale,
        COLUMN_COMMENT as comment
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `;
    
    const result = await this.executeQuery(sql, [this.config.database, tableName]);
    return result.rows.map(row => ({
      name: row.name,
      type: row.type,
      nullable: row.nullable === 'YES',
      defaultValue: row.defaultValue,
      isPrimaryKey: row.key === 'PRI',
      isAutoIncrement: row.extra.includes('auto_increment'),
      maxLength: row.maxLength,
      precision: row.precision,
      scale: row.scale,
      comment: row.comment
    }));
  }
  
  private mapFields(fields: any[]): FieldInfo[] {
    return fields.map(field => ({
      name: field.name,
      type: field.type,
      length: field.length
    }));
  }
}

// PostgreSQL适配器
class PostgreSQLAdapter implements DatabaseAdapter {
  private client: pg.Client;
  private dialect: PostgreSQLDialect;
  
  constructor(private config: DatabaseConnection) {
    this.dialect = new PostgreSQLDialect();
  }
  
  async connect(): Promise<void> {
    this.client = new pg.Client({
      host: this.config.host,
      port: this.config.port,
      user: this.config.username,
      password: this.config.password,
      database: this.config.database,
      ssl: this.config.ssl
    });
    await this.client.connect();
  }
  
  async executeQuery(sql: string, params?: any[]): Promise<QueryResult> {
    const startTime = Date.now();
    const result = await this.client.query(sql, params);
    const executionTime = Date.now() - startTime;
    
    return {
      rows: result.rows,
      rowCount: result.rowCount,
      fields: result.fields.map(field => ({
        name: field.name,
        type: field.dataTypeID.toString(),
        length: field.dataTypeModifier
      })),
      executionTime
    };
  }
  
  async getTables(): Promise<TableInfo[]> {
    const sql = `
      SELECT 
        tablename as name,
        'table' as type,
        schemaname
      FROM pg_tables 
      WHERE schemaname = 'public'
      UNION ALL
      SELECT 
        viewname as name,
        'view' as type,
        schemaname
      FROM pg_views 
      WHERE schemaname = 'public'
    `;
    
    const result = await this.executeQuery(sql);
    return result.rows.map(row => ({
      name: row.name,
      type: row.type as 'table' | 'view'
    }));
  }
  
  async getTableSchema(tableName: string): Promise<ColumnInfo[]> {
    const sql = `
      SELECT 
        column_name as name,
        data_type as type,
        is_nullable as nullable,
        column_default as defaultValue,
        character_maximum_length as maxLength,
        numeric_precision as precision,
        numeric_scale as scale
      FROM information_schema.columns 
      WHERE table_name = $1
      ORDER BY ordinal_position
    `;
    
    const result = await this.executeQuery(sql, [tableName]);
    return result.rows.map(row => ({
      name: row.name,
      type: row.type,
      nullable: row.nullable === 'YES',
      defaultValue: row.defaultValue,
      isPrimaryKey: false, // 需要额外查询
      isAutoIncrement: row.defaultValue?.includes('nextval'),
      maxLength: row.maxLength,
      precision: row.precision,
      scale: row.scale
    }));
  }
}
```

#### 5.2.2 NoSQL数据库适配器

```typescript
// MongoDB适配器
class MongoDBAdapter implements DatabaseAdapter {
  private client: MongoClient;
  private db: Db;
  
  constructor(private config: DatabaseConnection) {}
  
  async connect(): Promise<void> {
    this.client = new MongoClient(this.config.connectionString!);
    await this.client.connect();
    this.db = this.client.db(this.config.database);
  }
  
  async executeQuery(query: string, params?: any[]): Promise<QueryResult> {
    // MongoDB查询转换逻辑
    const mongoQuery = this.parseMongoQuery(query);
    const startTime = Date.now();
    
    let result;
    switch (mongoQuery.operation) {
      case 'find':
        result = await this.db.collection(mongoQuery.collection)
          .find(mongoQuery.filter)
          .limit(mongoQuery.limit || 0)
          .skip(mongoQuery.skip || 0)
          .toArray();
        break;
      case 'aggregate':
        result = await this.db.collection(mongoQuery.collection)
          .aggregate(mongoQuery.pipeline)
          .toArray();
        break;
    }
    
    const executionTime = Date.now() - startTime;
    
    return {
      rows: result.map(doc => ({ ...doc, _id: doc._id.toString() })),
      rowCount: result.length,
      fields: this.extractFields(result),
      executionTime
    };
  }
  
  async getTables(): Promise<TableInfo[]> {
    const collections = await this.db.listCollections().toArray();
    return collections.map(col => ({
      name: col.name,
      type: 'collection' as const
    }));
  }
  
  async getTableSchema(collectionName: string): Promise<ColumnInfo[]> {
    // 分析集合中的文档结构
    const sample = await this.db.collection(collectionName)
      .aggregate([
        { $sample: { size: 100 } },
        { $project: { schema: { $objectToArray: '$$ROOT' } } },
        { $unwind: '$schema' },
        { $group: {
          _id: '$schema.k',
          types: { $addToSet: { $type: '$schema.v' } },
          count: { $sum: 1 }
        }}
      ])
      .toArray();
    
    return sample.map(field => ({
      name: field._id,
      type: field.types.join(' | '),
      nullable: field.count < 100, // 如果不是所有文档都有这个字段
      isPrimaryKey: field._id === '_id',
      isAutoIncrement: false
    }));
  }
  
  private parseMongoQuery(query: string): any {
    // 简化的MongoDB查询解析逻辑
    // 实际实现需要更复杂的解析器
    if (query.startsWith('db.')) {
      // 解析MongoDB shell语法
      return this.parseShellSyntax(query);
    } else {
      // 尝试解析SQL到MongoDB的转换
      return this.sqlToMongo(query);
    }
  }
  
  private extractFields(docs: any[]): FieldInfo[] {
    if (docs.length === 0) return [];
    
    const fields = new Set<string>();
    docs.forEach(doc => {
      Object.keys(doc).forEach(key => fields.add(key));
    });
    
    return Array.from(fields).map(name => ({
      name,
      type: 'mixed',
      length: 0
    }));
  }
}
```

### 5.3 适配器工厂

```typescript
// 适配器工厂
class DatabaseAdapterFactory {
  static create(config: DatabaseConnection): DatabaseAdapter {
    switch (config.type) {
      case 'mysql':
        return new MySQLAdapter(config);
      case 'postgresql':
        return new PostgreSQLAdapter(config);
      case 'sqlite':
        return new SQLiteAdapter(config);
      case 'mongodb':
        return new MongoDBAdapter(config);
      case 'redis':
        return new RedisAdapter(config);
      case 'mssql':
        return new MSSQLAdapter(config);
      case 'oracle':
        return new OracleAdapter(config);
      default:
        throw new Error(`Unsupported database type: ${config.type}`);
    }
  }
  
  static getSupportedTypes(): string[] {
    return [
      'mysql',
      'postgresql', 
      'sqlite',
      'mongodb',
      'redis',
      'mssql',
      'oracle'
    ];
  }
}

// 数据库管理器
class DatabaseManager {
  private adapters: Map<string, DatabaseAdapter> = new Map();
  
  async getAdapter(connectionId: string): Promise<DatabaseAdapter> {
    if (!this.adapters.has(connectionId)) {
      const config = await this.getConnectionConfig(connectionId);
      const adapter = DatabaseAdapterFactory.create(config);
      await adapter.connect();
      this.adapters.set(connectionId, adapter);
    }
    
    return this.adapters.get(connectionId)!;
  }
  
  async executeQuery(connectionId: string, query: string, params?: any[]): Promise<QueryResult> {
    const adapter = await this.getAdapter(connectionId);
    return adapter.executeQuery(query, params);
  }
  
  async getSchema(connectionId: string): Promise<DatabaseSchema> {
    const adapter = await this.getAdapter(connectionId);
    const tables = await adapter.getTables();
    
    const schema: DatabaseSchema = {
      tables: []
    };
    
    for (const table of tables) {
      const columns = await adapter.getTableSchema(table.name);
      schema.tables.push({
        name: table.name,
        type: table.type,
        columns,
        indexes: await adapter.getIndexes(table.name)
      });
    }
    
    return schema;
  }
  
  private async getConnectionConfig(connectionId: string): Promise<DatabaseConnection> {
    // 从数据库或配置中获取连接信息
    // 实现省略
    throw new Error('Not implemented');
  }
}
```

### 5.4 统一查询语言转换

```typescript
// 通用查询构建器
class UniversalQueryBuilder {
  private query: any = {};
  
  select(columns: string[]): this {
    this.query.select = columns;
    return this;
  }
  
  from(table: string): this {
    this.query.from = table;
    return this;
  }
  
  where(condition: WhereCondition): this {
    this.query.where = condition;
    return this;
  }
  
  limit(count: number): this {
    this.query.limit = count;
    return this;
  }
  
  offset(count: number): this {
    this.query.offset = count;
    return this;
  }
  
  // 转换为特定数据库的查询
  toSQL(dialect: SQLDialect): string {
    let sql = `SELECT ${this.query.select.join(', ')} FROM ${dialect.quoteIdentifier(this.query.from)}`;
    
    if (this.query.where) {
      sql += ` WHERE ${this.buildWhereClause(this.query.where, dialect)}`;
    }
    
    if (this.query.limit) {
      sql += ` ${dialect.limitClause(this.query.limit, this.query.offset)}`;
    }
    
    return sql;
  }
  
  toMongo(): any {
    const mongoQuery: any = {
      collection: this.query.from,
      operation: 'find',
      filter: this.buildMongoFilter(this.query.where)
    };
    
    if (this.query.limit) {
      mongoQuery.limit = this.query.limit;
    }
    
    if (this.query.offset) {
      mongoQuery.skip = this.query.offset;
    }
    
    return mongoQuery;
  }
  
  private buildWhereClause(condition: WhereCondition, dialect: SQLDialect): string {
    // 构建SQL WHERE子句
    // 实现省略
    return '';
  }
  
  private buildMongoFilter(condition: WhereCondition): any {
    // 构建MongoDB过滤器
    // 实现省略
    return {};
  }
}
```

## 6. 后端架构设计

### 6.1 API接口设计

#### 6.1.1 认证接口
```typescript
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
POST /api/auth/logout
```

#### 6.1.2 连接管理接口
```typescript
GET    /api/connections              // 获取连接列表
POST   /api/connections              // 创建新连接
PUT    /api/connections/:id          // 更新连接
DELETE /api/connections/:id          // 删除连接
POST   /api/connections/:id/test     // 测试连接
```

#### 6.1.3 查询执行接口
```typescript
POST   /api/query/execute            // 执行SQL查询
POST   /api/query/explain            // 查询执行计划
GET    /api/query/history            // 查询历史
POST   /api/query/ai-generate        // AI生成SQL
```

#### 6.1.4 数据库操作接口
```typescript
GET    /api/database/:id/schema      // 获取数据库结构
GET    /api/database/:id/tables      // 获取表列表
GET    /api/database/:id/table/:name // 获取表详情
POST   /api/database/:id/table       // 创建表
PUT    /api/database/:id/table/:name // 修改表
DELETE /api/database/:id/table/:name // 删除表
```

### 6.2 服务层架构

```typescript
// 服务层接口定义
interface ConnectionService {
  createConnection(config: DatabaseConnection): Promise<string>;
  testConnection(id: string): Promise<boolean>;
  getConnection(id: string): Promise<DatabaseConnection>;
  listConnections(userId: string): Promise<DatabaseConnection[]>;
}

interface QueryService {
  executeQuery(connectionId: string, sql: string): Promise<QueryResult>;
  getQueryHistory(userId: string): Promise<QueryRecord[]>;
  explainQuery(connectionId: string, sql: string): Promise<ExplainResult>;
}

interface AIService {
  generateSQL(prompt: string, schema: DatabaseSchema): Promise<string>;
  optimizeQuery(sql: string): Promise<OptimizationSuggestion[]>;
  explainQuery(sql: string): Promise<string>;
}
```

### 6.3 数据库连接池管理

```typescript
class ConnectionPoolManager {
  private pools: Map<string, Pool> = new Map();
  
  async getConnection(connectionId: string): Promise<Connection> {
    if (!this.pools.has(connectionId)) {
      const config = await this.getConnectionConfig(connectionId);
      this.pools.set(connectionId, this.createPool(config));
    }
    return this.pools.get(connectionId)!.getConnection();
  }
  
  private createPool(config: DatabaseConnection): Pool {
    // 根据数据库类型创建对应的连接池
  }
}
```

## 7. AI集成设计

### 7.1 智能数据库管理架构

```mermaid
graph TB
    subgraph "AI智能层"
        A1[自然语言理解]
        A2[意图识别]
        A3[数据库模式分析]
        A4[查询计划生成]
        A5[表结构推理]
    end
    
    subgraph "业务逻辑层"
        B1[智能查询服务]
        B2[表管理服务]
        B3[模式管理服务]
        B4[数据建模服务]
    end
    
    subgraph "数据访问层"
        C1[元数据仓库]
        C2[查询执行引擎]
        C3[DDL执行器]
    end
    
    A1 --> B1
    A2 --> B1
    A3 --> B2
    A4 --> B1
    A5 --> B2
    
    B1 --> C2
    B2 --> C3
    B3 --> C1
    B4 --> C1
```

### 7.2 智能查询分析服务

#### 7.2.1 自然语言查询理解

```typescript
// 查询意图分析接口
interface QueryIntentAnalyzer {
  analyzeIntent(naturalLanguage: string, schema: DatabaseSchema): Promise<QueryIntent>;
  generateQueryPlan(intent: QueryIntent): Promise<QueryPlan>;
  optimizeQuery(plan: QueryPlan): Promise<OptimizedQuery>;
}

// 查询意图结构
interface QueryIntent {
  type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE' | 'ALTER' | 'DROP';
  entities: string[]; // 涉及的实体/表
  attributes: string[]; // 需要的字段
  conditions: QueryCondition[]; // 查询条件
  relationships: TableRelationship[]; // 表关系
  aggregations?: AggregationFunction[]; // 聚合函数
  sorting?: SortingCriteria[]; // 排序条件
  pagination?: PaginationInfo; // 分页信息
}

// 查询条件
interface QueryCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'like' | 'in' | 'between';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

// 表关系
interface TableRelationship {
  fromTable: string;
  toTable: string;
  joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  onCondition: string;
}
```

#### 7.2.2 智能查询服务实现

```typescript
class IntelligentQueryService implements QueryIntentAnalyzer {
  constructor(
    private aiProvider: AIProvider,
    private schemaService: SchemaService,
    private databaseManager: DatabaseManager
  ) {}
  
  async analyzeIntent(naturalLanguage: string, schema: DatabaseSchema): Promise<QueryIntent> {
    const prompt = this.buildQueryAnalysisPrompt(naturalLanguage, schema);
    
    const aiResponse = await this.aiProvider.complete({
      prompt,
      model: 'gpt-4',
      temperature: 0.1,
      responseFormat: 'json'
    });
    
    const intent = JSON.parse(aiResponse.content) as QueryIntent;
    return this.validateIntent(intent, schema);
  }
  
  async generateQueryPlan(intent: QueryIntent): Promise<QueryPlan> {
    // 分析需要查询的表
    const requiredTables = await this.identifyRequiredTables(intent);
    
    // 构建表关系
    const relationships = await this.buildTableRelationships(requiredTables);
    
    // 生成查询计划
    return {
      tables: requiredTables,
      joins: relationships,
      selectFields: intent.attributes,
      whereConditions: intent.conditions,
      orderBy: intent.sorting,
      limit: intent.pagination?.limit
    };
  }
  
  async optimizeQuery(plan: QueryPlan): Promise<OptimizedQuery> {
    const baseSQL = this.generateSQL(plan);
    
    const optimizationPrompt = `
      请优化以下SQL查询，提供性能改进建议：
      
      原始查询：
      ${baseSQL}
      
      数据库结构：
      ${JSON.stringify(plan.tables, null, 2)}
      
      请返回：
      1. 优化后的SQL
      2. 建议的索引
      3. 性能改进说明
    `;
    
    const aiResponse = await this.aiProvider.complete({
      prompt: optimizationPrompt,
      model: 'gpt-4'
    });
    
    return {
      sql: baseSQL,
      optimizedSQL: this.extractOptimizedSQL(aiResponse.content),
      indexSuggestions: this.extractIndexSuggestions(aiResponse.content),
      explanation: aiResponse.content
    };
  }
  
  private buildQueryAnalysisPrompt(naturalLanguage: string, schema: DatabaseSchema): string {
    return `
      作为数据库查询专家，请分析以下自然语言查询需求，并生成结构化的查询意图。
      
      用户查询："${naturalLanguage}"
      
      可用的数据库结构：
      ${this.formatSchemaForPrompt(schema)}
      
      请返回JSON格式的查询意图，包含：
      {
        "type": "查询类型(SELECT/INSERT/UPDATE/DELETE/CREATE/ALTER/DROP)",
        "entities": ["涉及的表名"],
        "attributes": ["需要查询的字段"],
        "conditions": [
          {
            "field": "字段名",
            "operator": "操作符",
            "value": "值",
            "logicalOperator": "AND/OR"
          }
        ],
        "relationships": [
          {
            "fromTable": "主表",
            "toTable": "关联表",
            "joinType": "JOIN类型",
            "onCondition": "关联条件"
          }
        ]
      }
      
      注意：
      1. 仔细分析用户意图，确定需要查询哪些表
      2. 根据表结构推断字段映射关系
      3. 识别表之间的关联关系
      4. 提取查询条件和过滤条件
    `;
  }
  
  private async identifyRequiredTables(intent: QueryIntent): Promise<TableInfo[]> {
    const tables: TableInfo[] = [];
    
    for (const entityName of intent.entities) {
      // 智能匹配表名（支持模糊匹配、别名等）
      const matchedTable = await this.schemaService.findTableByName(entityName);
      if (matchedTable) {
        tables.push(matchedTable);
      }
    }
    
    return tables;
  }
}
```

### 7.3 智能表管理服务

#### 7.3.1 表结构智能设计

```typescript
// 表设计服务接口
interface IntelligentTableDesigner {
  designTable(description: string, context?: DatabaseContext): Promise<TableDesign>;
  analyzeTableRequirements(requirements: string): Promise<TableRequirements>;
  generateTableSchema(design: TableDesign): Promise<CreateTableSQL>;
  suggestTableModifications(tableName: string, modifications: string): Promise<AlterTableSQL[]>;
}

// 表设计结构
interface TableDesign {
  tableName: string;
  description: string;
  columns: ColumnDesign[];
  indexes: IndexDesign[];
  constraints: ConstraintDesign[];
  relationships: ForeignKeyDesign[];
}

interface ColumnDesign {
  name: string;
  type: string;
  length?: number;
  precision?: number;
  scale?: number;
  nullable: boolean;
  defaultValue?: any;
  comment: string;
  isPrimaryKey: boolean;
  isAutoIncrement: boolean;
}

interface IndexDesign {
  name: string;
  columns: string[];
  type: 'PRIMARY' | 'UNIQUE' | 'INDEX' | 'FULLTEXT';
  comment?: string;
}
```

#### 7.3.2 智能表管理实现

```typescript
class IntelligentTableService implements IntelligentTableDesigner {
  constructor(
    private aiProvider: AIProvider,
    private schemaService: SchemaService,
    private databaseManager: DatabaseManager
  ) {}
  
  async designTable(description: string, context?: DatabaseContext): Promise<TableDesign> {
    const prompt = this.buildTableDesignPrompt(description, context);
    
    const aiResponse = await this.aiProvider.complete({
      prompt,
      model: 'gpt-4',
      temperature: 0.1,
      responseFormat: 'json'
    });
    
    const design = JSON.parse(aiResponse.content) as TableDesign;
    return this.validateTableDesign(design);
  }
  
  async analyzeTableRequirements(requirements: string): Promise<TableRequirements> {
    const analysisPrompt = `
      请分析以下表设计需求，提取关键信息：
      
      需求描述："${requirements}"
      
      请返回JSON格式的需求分析：
      {
        "businessDomain": "业务领域",
        "entityName": "实体名称",
        "attributes": [
          {
            "name": "属性名",
            "description": "属性描述",
            "dataType": "数据类型",
            "required": true/false,
            "unique": true/false
          }
        ],
        "relationships": [
          {
            "targetEntity": "关联实体",
            "type": "one-to-one/one-to-many/many-to-many",
            "description": "关系描述"
          }
        ],
        "businessRules": ["业务规则列表"],
        "performanceRequirements": "性能要求"
      }
    `;
    
    const aiResponse = await this.aiProvider.complete({
      prompt: analysisPrompt,
      model: 'gpt-4'
    });
    
    return JSON.parse(aiResponse.content);
  }
  
  async generateTableSchema(design: TableDesign): Promise<CreateTableSQL> {
    const schemaPrompt = `
      根据以下表设计生成标准的CREATE TABLE SQL语句：
      
      表设计：
      ${JSON.stringify(design, null, 2)}
      
      要求：
      1. 生成完整的CREATE TABLE语句
      2. 包含所有约束和索引
      3. 添加适当的注释
      4. 考虑数据库最佳实践
      
      请返回JSON格式：
      {
        "createTableSQL": "CREATE TABLE语句",
        "createIndexSQL": ["CREATE INDEX语句数组"],
        "alterTableSQL": ["ALTER TABLE语句数组"],
        "explanation": "设计说明"
      }
    `;
    
    const aiResponse = await this.aiProvider.complete({
      prompt: schemaPrompt,
      model: 'gpt-4'
    });
    
    return JSON.parse(aiResponse.content);
  }
  
  async suggestTableModifications(tableName: string, modifications: string): Promise<AlterTableSQL[]> {
    const currentSchema = await this.schemaService.getTableSchema(tableName);
    
    const modificationPrompt = `
      请根据以下修改需求，生成相应的ALTER TABLE语句：
      
      当前表结构：
      ${JSON.stringify(currentSchema, null, 2)}
      
      修改需求："${modifications}"
      
      请返回JSON格式的修改方案：
      {
        "alterStatements": [
          {
            "sql": "ALTER TABLE语句",
            "description": "修改说明",
            "riskLevel": "low/medium/high",
            "backupRequired": true/false
          }
        ],
        "migrationSteps": ["迁移步骤"],
        "rollbackPlan": ["回滚计划"]
      }
    `;
    
    const aiResponse = await this.aiProvider.complete({
      prompt: modificationPrompt,
      model: 'gpt-4'
    });
    
    const result = JSON.parse(aiResponse.content);
    return result.alterStatements;
  }
  
  private buildTableDesignPrompt(description: string, context?: DatabaseContext): string {
    return `
      作为数据库设计专家，请根据以下描述设计一个合理的数据库表结构：
      
      表设计需求："${description}"
      
      ${context ? `数据库上下文：\n${JSON.stringify(context, null, 2)}` : ''}
      
      请返回JSON格式的表设计：
      {
        "tableName": "表名(使用下划线命名)",
        "description": "表描述",
        "columns": [
          {
            "name": "字段名",
            "type": "数据类型",
            "length": "长度(如适用)",
            "nullable": true/false,
            "defaultValue": "默认值",
            "comment": "字段注释",
            "isPrimaryKey": true/false,
            "isAutoIncrement": true/false
          }
        ],
        "indexes": [
          {
            "name": "索引名",
            "columns": ["字段列表"],
            "type": "索引类型",
            "comment": "索引说明"
          }
        ],
        "constraints": [
          {
            "type": "约束类型",
            "columns": ["相关字段"],
            "definition": "约束定义"
          }
        ]
      }
      
      设计原则：
      1. 遵循数据库设计规范
      2. 考虑性能优化
      3. 确保数据完整性
      4. 支持业务扩展性
    `;
  }
}
```

### 7.4 智能数据建模服务

#### 7.4.1 JSON Schema生成

```typescript
// JSON Schema生成服务
class JSONSchemaService {
  constructor(private aiProvider: AIProvider) {}
  
  async generateSchemaFromQuery(queryResult: QueryResult, intent: QueryIntent): Promise<JSONSchema> {
    const schemaPrompt = `
      根据以下查询结果和用户意图，生成合适的JSON Schema：
      
      用户查询意图：
      ${JSON.stringify(intent, null, 2)}
      
      查询结果结构：
      ${JSON.stringify(queryResult.fields, null, 2)}
      
      样本数据：
      ${JSON.stringify(queryResult.rows.slice(0, 3), null, 2)}
      
      请返回完整的JSON Schema定义，包含：
      1. 字段类型定义
      2. 必填字段标识
      3. 字段描述
      4. 数据验证规则
      5. 示例值
    `;
    
    const aiResponse = await this.aiProvider.complete({
      prompt: schemaPrompt,
      model: 'gpt-4'
    });
    
    return JSON.parse(aiResponse.content);
  }
  
  async generateSchemaFromTable(tableName: string, tableSchema: ColumnInfo[]): Promise<JSONSchema> {
    const prompt = `
      根据数据库表结构生成对应的JSON Schema：
      
      表名：${tableName}
      表结构：
      ${JSON.stringify(tableSchema, null, 2)}
      
      请生成完整的JSON Schema，考虑：
      1. 数据类型映射（数据库类型 -> JSON类型）
      2. 约束转换（NOT NULL -> required）
      3. 格式验证（email, date等）
      4. 数值范围限制
    `;
    
    const aiResponse = await this.aiProvider.complete({
      prompt,
      model: 'gpt-4'
    });
    
    return JSON.parse(aiResponse.content);
  }
}
```

### 7.5 AI服务集成管理

```typescript
// AI服务管理器
class AIServiceManager {
  private queryService: IntelligentQueryService;
  private tableService: IntelligentTableService;
  private schemaService: JSONSchemaService;
  
  constructor(
    private aiProvider: AIProvider,
    private databaseManager: DatabaseManager,
    private schemaManager: SchemaService
  ) {
    this.queryService = new IntelligentQueryService(aiProvider, schemaManager, databaseManager);
    this.tableService = new IntelligentTableService(aiProvider, schemaManager, databaseManager);
    this.schemaService = new JSONSchemaService(aiProvider);
  }
  
  // 智能查询处理
  async processNaturalQuery(connectionId: string, naturalLanguage: string): Promise<IntelligentQueryResult> {
    const schema = await this.databaseManager.getSchema(connectionId);
    const intent = await this.queryService.analyzeIntent(naturalLanguage, schema);
    const plan = await this.queryService.generateQueryPlan(intent);
    const optimizedQuery = await this.queryService.optimizeQuery(plan);
    
    // 执行查询
    const result = await this.databaseManager.executeQuery(connectionId, optimizedQuery.sql);
    
    // 生成JSON Schema（如果需要）
    const jsonSchema = await this.schemaService.generateSchemaFromQuery(result, intent);
    
    return {
      intent,
      plan,
      query: optimizedQuery,
      result,
      jsonSchema,
      explanation: this.generateQueryExplanation(intent, plan, optimizedQuery)
    };
  }
  
  // 智能表管理
  async processTableManagement(connectionId: string, operation: string): Promise<TableManagementResult> {
    const context = await this.getDatabaseContext(connectionId);
    
    if (operation.includes('创建') || operation.includes('新建')) {
      const design = await this.tableService.designTable(operation, context);
      const schema = await this.tableService.generateTableSchema(design);
      
      return {
        type: 'create',
        design,
        sql: schema,
        explanation: `基于需求"${operation}"生成的表设计方案`
      };
    } else if (operation.includes('修改') || operation.includes('添加') || operation.includes('删除')) {
      const tableName = this.extractTableName(operation);
      const modifications = await this.tableService.suggestTableModifications(tableName, operation);
      
      return {
        type: 'alter',
        modifications,
        explanation: `针对表"${tableName}"的修改建议`
      };
    }
    
    throw new Error('未识别的表管理操作');
  }
  
  private generateQueryExplanation(intent: QueryIntent, plan: QueryPlan, query: OptimizedQuery): string {
    return `
      查询分析：
      - 查询类型：${intent.type}
      - 涉及表：${intent.entities.join(', ')}
      - 查询字段：${intent.attributes.join(', ')}
      - 查询条件：${intent.conditions.map(c => `${c.field} ${c.operator} ${c.value}`).join(', ')}
      
      优化建议：
      ${query.explanation}
    `;
  }
}
```

### 7.6 大模型集成方案

```typescript
interface AIProvider {
  name: string;
  endpoint: string;
  apiKey: string;
  model: string;
}

// 支持多个AI提供商
const aiProviders = {
  openai: { model: 'gpt-4', endpoint: 'https://api.openai.com/v1' },
  anthropic: { model: 'claude-3', endpoint: 'https://api.anthropic.com/v1' },
  local: { model: 'llama2', endpoint: 'http://localhost:11434/v1' }
};
```

### 7.7 提示词模板库

```typescript
const promptTemplates = {
  // 查询分析模板
  queryAnalysis: `
    作为数据库查询专家，请分析以下自然语言查询：
    用户输入：{userInput}
    数据库结构：{schema}
    
    请识别：
    1. 查询意图（查询/插入/更新/删除）
    2. 目标表和字段
    3. 过滤条件
    4. 表间关系
    5. 排序和限制条件
  `,
  
  // 表设计模板
  tableDesign: `
    作为数据库设计专家，请设计一个数据库表：
    需求描述：{requirements}
    业务上下文：{context}
    
    请提供：
    1. 表名和描述
    2. 字段定义（名称、类型、约束）
    3. 主键和外键
    4. 索引设计
    5. 业务规则约束
  `,
  
  // SQL优化模板
  queryOptimization: `
    请优化以下SQL查询：
    原始查询：{sql}
    表结构：{schema}
    数据量信息：{statistics}
    
    请提供：
    1. 优化后的SQL
    2. 性能改进点
    3. 建议的索引
    4. 优化原理说明
  `,
  
  // JSON Schema生成模板
  jsonSchemaGeneration: `
    根据数据结构生成JSON Schema：
    数据结构：{dataStructure}
    字段信息：{fields}
    样本数据：{samples}
    
    请生成包含以下内容的JSON Schema：
    1. 字段类型和格式
    2. 必填字段
    3. 数据验证规则
    4. 示例值
    5. 字段描述
  `
};
```

### 7.8 AI上下文管理

```typescript
// AI会话上下文管理
class AIContextManager {
  private conversations: Map<string, AIConversation> = new Map();
  
  createConversation(userId: string, connectionId: string): string {
    const conversationId = generateId();
    const conversation: AIConversation = {
      id: conversationId,
      userId,
      connectionId,
      messages: [],
      context: {
        databaseSchema: null,
        recentQueries: [],
        userPreferences: {}
      },
      createdAt: new Date()
    };
    
    this.conversations.set(conversationId, conversation);
    return conversationId;
  }
  
  async addMessage(conversationId: string, message: AIMessage): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) throw new Error('Conversation not found');
    
    conversation.messages.push(message);
    
    // 更新上下文
    if (message.type === 'query') {
      conversation.context.recentQueries.push({
        query: message.content,
        timestamp: new Date(),
        result: message.metadata?.result
      });
      
      // 保持最近10条查询历史
      if (conversation.context.recentQueries.length > 10) {
        conversation.context.recentQueries = conversation.context.recentQueries.slice(-10);
      }
    }
  }
  
  getConversationContext(conversationId: string): AIConversationContext {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) throw new Error('Conversation not found');
    
    return {
      ...conversation.context,
      recentMessages: conversation.messages.slice(-5) // 最近5条消息
    };
  }
}

interface AIConversation {
  id: string;
  userId: string;
  connectionId: string;
  messages: AIMessage[];
  context: AIConversationContext;
  createdAt: Date;
}

interface AIConversationContext {
  databaseSchema?: DatabaseSchema;
  recentQueries: RecentQuery[];
  userPreferences: UserPreferences;
  recentMessages?: AIMessage[];
}
```

## 8. 安全性设计

### 8.1 权限控制

```mermaid
graph TD
    A[用户] --> B[角色]
    B --> C[权限]
    C --> D[资源]
    
    E[管理员] --> F[所有数据库操作]
    G[开发者] --> H[读写权限]
    I[分析师] --> J[只读权限]
```

### 8.2 SQL注入防护

```typescript
class SecurityValidator {
  validateSQL(sql: string): ValidationResult {
    // 检查危险关键词
    const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER'];
    
    // 参数化查询检查
    // 语法分析
    // 权限检查
    
    return {
      isValid: boolean,
      risks: Risk[],
      suggestions: string[]
    };
  }
}
```

## 9. 数据流设计

### 9.1 查询执行流程

```mermaid
sequenceDiagram
    participant U as 用户
    participant F as 前端
    participant B as 后端API
    participant AI as AI服务
    participant DB as 数据库
    
    U->>F: 输入自然语言查询
    F->>B: 发送AI生成请求
    B->>AI: 调用大模型API
    AI->>B: 返回SQL语句
    B->>F: 返回生成的SQL
    F->>U: 展示SQL预览
    U->>F: 确认执行
    F->>B: 执行SQL请求
    B->>DB: 执行查询
    DB->>B: 返回结果
    B->>F: 返回查询结果
    F->>U: 展示结果
```

### 9.2 连接管理流程

```mermaid
stateDiagram-v2
    [*] --> 未连接
    未连接 --> 连接中: 发起连接
    连接中 --> 已连接: 连接成功
    连接中 --> 连接失败: 连接失败
    连接失败 --> 未连接: 重试
    已连接 --> 执行中: 执行查询
    执行中 --> 已连接: 查询完成
    已连接 --> 未连接: 断开连接
```

## 10. 测试策略

### 10.1 前端测试

#### 单元测试
- 组件测试：Vue Test Utils + Jest
- 状态管理测试：Pinia测试
- 工具函数测试

#### 集成测试
- API集成测试
- 路由测试
- 端到端测试：Cypress

### 10.2 后端测试

#### 单元测试
- 服务层测试：Jest
- 工具函数测试
- 数据库操作测试

#### 集成测试
- API接口测试：Supertest
- 数据库集成测试
- AI服务集成测试

## 11. 项目数据存储方案

### 11.1 项目本身数据存储：SQLite

**使用SQLite作为项目本身的数据存储，管理：**
- 数据库连接配置
- AI查询历史  
- 用户会话记录
- 系统设置

**而AI驱动管理的目标数据库支持：**
- MySQL、PostgreSQL、SQLite、MongoDB、Redis等

### 11.2 SQLite数据模型设计

```sql
-- 数据库连接配置表
CREATE TABLE connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                    -- 连接名称
    type TEXT NOT NULL,                    -- mysql|postgresql|mongodb|redis
    host TEXT, port INTEGER,               -- 主机和端口
    database_name TEXT, username TEXT,     -- 数据库名和用户名
    password TEXT,                         -- 密码(可加密存储)
    connection_string TEXT,                -- 完整连接字符串
    config_json TEXT,                      -- 额外配置(JSON)
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI查询历史表
CREATE TABLE query_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    connection_id INTEGER,                 -- 关联连接ID
    session_id TEXT,                       -- 会话ID
    natural_query TEXT NOT NULL,          -- 用户输入的自然语言
    ai_analysis TEXT,                      -- AI分析结果(JSON)
    generated_sql TEXT,                    -- AI生成的SQL
    execution_status TEXT DEFAULT 'pending', -- 执行状态
    execution_time INTEGER,                -- 执行时间(ms)
    result_rows INTEGER,                   -- 结果行数
    result_schema TEXT,                    -- 结果的JSON Schema
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (connection_id) REFERENCES connections(id)
);

-- AI对话记录表
CREATE TABLE ai_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,             -- 会话标识
    message_type TEXT NOT NULL,            -- user|assistant|system
    content TEXT NOT NULL,                 -- 消息内容
    metadata TEXT,                         -- 元数据(JSON)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 表管理记录
CREATE TABLE table_operations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    connection_id INTEGER NOT NULL,       -- 目标数据库连接
    operation_type TEXT NOT NULL,         -- create|alter|drop
    table_name TEXT,                       -- 表名
    user_request TEXT NOT NULL,           -- 用户原始需求
    ai_design TEXT,                        -- AI设计方案(JSON)
    generated_sql TEXT,                    -- 生成的DDL语句
    execution_status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (connection_id) REFERENCES connections(id)
);

-- 系统设置表
CREATE TABLE app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,                   -- 设置值(JSON格式)
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 11.3 数据库操作封装

```typescript
import Database from 'better-sqlite3';

// 项目数据库管理类
class AppDatabase {
  private db: Database.Database;
  
  constructor(dbPath: string = './data/app.db') {
    this.db = new Database(dbPath);
    this.initDatabase();
  }
  
  // 连接管理方法
  saveConnection(connection: DatabaseConnectionConfig): number {
    const stmt = this.db.prepare(`
      INSERT INTO connections (name, type, host, port, database_name, username, password)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      connection.name, connection.type, connection.host,
      connection.port, connection.databaseName, 
      connection.username, connection.password
    );
    
    return result.lastInsertRowid as number;
  }
  
  getConnections(): DatabaseConnectionConfig[] {
    const stmt = this.db.prepare('SELECT * FROM connections WHERE is_active = 1');
    return stmt.all() as DatabaseConnectionConfig[];
  }
  
  // 查询历史管理
  saveQueryHistory(history: QueryHistoryRecord): number {
    const stmt = this.db.prepare(`
      INSERT INTO query_history (
        connection_id, session_id, natural_query, ai_analysis, 
        generated_sql, execution_status, execution_time, result_rows
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      history.connectionId, history.sessionId, history.naturalQuery,
      JSON.stringify(history.aiAnalysis), history.generatedSQL,
      history.executionStatus, history.executionTime, history.resultRows
    );
    
    return result.lastInsertRowid as number;
  }
  
  getQueryHistory(connectionId?: number, limit: number = 50): QueryHistoryRecord[] {
    let sql = 'SELECT * FROM query_history';
    const params: any[] = [];
    
    if (connectionId) {
      sql += ' WHERE connection_id = ?';
      params.push(connectionId);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);
    
    const stmt = this.db.prepare(sql);
    return stmt.all(params) as QueryHistoryRecord[];
  }
  
  // AI对话管理
  saveConversationMessage(message: ConversationMessage): number {
    const stmt = this.db.prepare(`
      INSERT INTO ai_conversations (session_id, message_type, content, metadata)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      message.sessionId, message.messageType, message.content,
      message.metadata ? JSON.stringify(message.metadata) : null
    );
    
    return result.lastInsertRowid as number;
  }
  
  // 设置管理
  getSetting(key: string): any {
    const stmt = this.db.prepare('SELECT value FROM app_settings WHERE key = ?');
    const row = stmt.get(key) as any;
    return row ? JSON.parse(row.value) : null;
  }
  
  setSetting(key: string, value: any): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO app_settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(key, JSON.stringify(value));
  }
}
```

### 11.4 数据类型定义

```typescript
// 数据库连接配置
interface DatabaseConnectionConfig {
  id?: number;
  name: string;
  type: 'mysql' | 'postgresql' | 'sqlite' | 'mongodb' | 'redis';
  host?: string;
  port?: number;
  databaseName?: string;
  username?: string;
  password?: string;
  connectionString?: string;
}

// 查询历史记录
interface QueryHistoryRecord {
  id?: number;
  connectionId: number;
  sessionId: string;
  naturalQuery: string;
  aiAnalysis?: any;
  generatedSQL?: string;
  executionStatus: 'pending' | 'success' | 'error';
  executionTime?: number;
  resultRows?: number;
  resultSchema?: any;
}

// AI对话消息
interface ConversationMessage {
  id?: number;
  sessionId: string;
  messageType: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: any;
}
```

**总结：**

1. **项目本身数据** → SQLite存储（连接配置、查询历史、AI对话）
2. **AI管理目标** → 不同类型数据库（MySQL、PostgreSQL、MongoDB等）
3. **简单高效** → 零配置启动，专注AI核心功能
4. **完整记录** → 保存AI分析过程和结果，支持历史回顾