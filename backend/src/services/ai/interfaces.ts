import type { 
  AIQueryRequest, 
  AIQueryResponse, 
  ColumnInfo, 
  TableInfo 
} from '../../types';

/**
 * AI提供商类型
 */
export type AIProvider = 'openai' | 'claude' | 'custom';

/**
 * AI配置接口
 */
export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  baseURL?: string;
}

/**
 * AI上下文信息
 */
export interface AIContext {
  connectionId: string;
  databaseType: string;
  tables: TableInfo[];
  schema: Record<string, ColumnInfo[]>;
  recentQueries?: string[];
}

/**
 * SQL生成请求
 */
export interface SQLGenerationRequest {
  naturalQuery: string;
  context: AIContext;
  options?: {
    includeExplanation?: boolean;
    optimizeQuery?: boolean;
    validateSyntax?: boolean;
  };
}

/**
 * SQL生成响应
 */
export interface SQLGenerationResponse {
  sql: string;
  explanation: string;
  confidence: number;
  warnings: string[];
  suggestions: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
  estimatedExecutionTime?: number;
}

/**
 * 表结构建议请求
 */
export interface TableSuggestionRequest {
  description: string;
  databaseType: string;
  existingTables?: string[];
  constraints?: string[];
}

/**
 * 表结构建议响应
 */
export interface TableSuggestionResponse {
  tableName: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    defaultValue?: any;
    isPrimaryKey: boolean;
    isAutoIncrement: boolean;
    comment?: string;
  }>;
  indexes: Array<{
    name: string;
    columns: string[];
    isUnique: boolean;
  }>;
  relationships: Array<{
    type: 'foreign_key';
    column: string;
    referencedTable: string;
    referencedColumn: string;
  }>;
  createSQL: string;
  explanation: string;
}

/**
 * SQL优化建议请求
 */
export interface SQLOptimizationRequest {
  sql: string;
  context: AIContext;
  performanceData?: {
    executionTime: number;
    rowsScanned: number;
    indexUsage: string[];
  };
}

/**
 * SQL优化建议响应
 */
export interface SQLOptimizationResponse {
  optimizedSQL: string;
  improvements: Array<{
    type: 'index' | 'query_structure' | 'join_optimization' | 'where_clause';
    description: string;
    impact: 'low' | 'medium' | 'high';
    suggestion: string;
  }>;
  explanation: string;
  estimatedImprovement: string;
}

/**
 * AI服务接口
 */
export interface AIService {
  /**
   * 初始化AI服务
   */
  initialize(config: AIConfig): Promise<void>;

  /**
   * 生成SQL查询
   */
  generateSQL(request: SQLGenerationRequest): Promise<SQLGenerationResponse>;

  /**
   * 解释SQL查询
   */
  explainSQL(sql: string, context: AIContext): Promise<string>;

  /**
   * 优化SQL查询
   */
  optimizeSQL(request: SQLOptimizationRequest): Promise<SQLOptimizationResponse>;

  /**
   * 建议表结构
   */
  suggestTableStructure(request: TableSuggestionRequest): Promise<TableSuggestionResponse>;

  /**
   * 数据分析建议
   */
  suggestDataAnalysis(data: any[], question: string): Promise<{
    suggestions: string[];
    queries: string[];
    visualizations: string[];
  }>;

  /**
   * 自然语言查询理解
   */
  parseNaturalQuery(query: string, context: AIContext): Promise<{
    intent: string;
    entities: Array<{
      type: 'table' | 'column' | 'value' | 'operation';
      value: string;
      confidence: number;
    }>;
    complexity: 'simple' | 'moderate' | 'complex';
  }>;

  /**
   * 生成查询解释
   */
  generateQueryExplanation(sql: string, context: AIContext): Promise<string>;

  /**
   * 错误诊断和修复建议
   */
  diagnoseError(error: string, sql: string, context: AIContext): Promise<{
    diagnosis: string;
    suggestions: string[];
    fixedSQL?: string;
  }>;
}

/**
 * AI响应缓存接口
 */
export interface AICache {
  /**
   * 获取缓存的响应
   */
  get(key: string): Promise<any | null>;

  /**
   * 设置缓存
   */
  set(key: string, value: any, ttl?: number): Promise<void>;

  /**
   * 删除缓存
   */
  delete(key: string): Promise<void>;

  /**
   * 清空缓存
   */
  clear(): Promise<void>;
}

/**
 * AI提示模板接口
 */
export interface PromptTemplate {
  /**
   * 系统提示
   */
  systemPrompt: string;

  /**
   * 用户提示模板
   */
  userPromptTemplate: string;

  /**
   * 示例对话
   */
  examples?: Array<{
    user: string;
    assistant: string;
  }>;

  /**
   * 变量替换
   */
  variables: Record<string, string>;
}

/**
 * AI使用统计
 */
export interface AIUsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  totalTokensUsed: number;
  costEstimate: number;
  provider: AIProvider;
  model: string;
  date: string;
}