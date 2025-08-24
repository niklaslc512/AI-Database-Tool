/**
 * 数据库连接配置
 */
export interface DatabaseConnection {
  id: string;
  name: string;
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  connectionString?: string;
  metadata?: {
    description: string;
    tags: string[];
    environment: 'development' | 'staging' | 'production';
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 支持的数据库类型
 */
export type DatabaseType = 
  | 'mysql' 
  | 'postgresql' 
  | 'sqlite' 
  | 'mongodb' 
  | 'redis'
  | 'oracle'
  | 'sqlserver';

/**
 * 查询结果
 */
export interface QueryResult {
  rows: Record<string, any>[];
  rowCount: number;
  fields: FieldInfo[];
  executionTime: number;
  affectedRows?: number;
  insertId?: string | number;
}

/**
 * 字段信息
 */
export interface FieldInfo {
  name: string;
  type: string;
  length?: number;
  nullable?: boolean;
  defaultValue?: any;
  isPrimaryKey?: boolean;
  isAutoIncrement?: boolean;
}

/**
 * 表信息
 */
export interface TableInfo {
  name: string;
  type: 'table' | 'view' | 'collection';
  rowCount?: number;
  size?: string;
  engine?: string;
  collation?: string;
  comment?: string;
  schema?: string;
}

/**
 * 列信息
 */
export interface ColumnInfo {
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

/**
 * 索引信息
 */
export interface IndexInfo {
  name: string;
  columns: string[];
  isUnique: boolean;
  isPrimary: boolean;
  type: string;
}

/**
 * AI查询请求
 */
export interface AIQueryRequest {
  naturalQuery: string;
  connectionId: string;
  context?: {
    tables?: string[];
    schema?: Record<string, ColumnInfo[]>;
  };
}

/**
 * AI查询响应
 */
export interface AIQueryResponse {
  sql: string;
  explanation: string;
  confidence: number;
  suggestions?: string[];
  warning?: string;
  estimatedRows?: number;
}

/**
 * 用户信息
 */
export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash?: string;
  salt?: string;
  role: UserRole;
  status: UserStatus;
  displayName?: string;
  avatarUrl?: string;
  settings?: UserSettings;
  lastLoginAt?: Date;
  loginCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 用户角色
 */
export type UserRole = 'admin' | 'user' | 'readonly' | 'guest';

/**
 * 用户状态
 */
export type UserStatus = 'active' | 'inactive' | 'locked';

/**
 * 用户设置
 */
export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    browser: boolean;
    security: boolean;
  };
}

/**
 * 权限
 */
export interface Permission {
  resource: string;
  actions: string[];
}

/**
 * 用户创建请求
 */
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
  displayName?: string;
  settings?: UserSettings;
}

/**
 * 用户更新请求
 */
export interface UpdateUserRequest {
  displayName?: string;
  email?: string;
  settings?: UserSettings;
}

/**
 * 登录请求
 */
export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * 登录响应
 */
export interface LoginResponse {
  user: Omit<User, 'passwordHash' | 'salt'>;
  token: string;
  refreshToken?: string;
  expiresAt: Date;
}

/**
 * JWT负载
 */
export interface JWTPayload {
  userId: string;
  username: string;
  role: UserRole;
  iat: number;
  exp: number;
}

/**
 * API密钥
 */
export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  keyId: string;
  permissions?: string[];
  lastUsedAt?: Date;
  usageCount: number;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
}

/**
 * 创建API Key请求
 */
export interface CreateApiKeyRequest {
  name: string;
  permissions?: string[];
  expiresAt?: Date;
}

/**
 * 创建API Key响应
 */
export interface CreateApiKeyResponse {
  apiKey: ApiKey;
  secret: string; // 仅在创建时返回
}

/**
 * 授权令牌
 */
export interface AuthorizationToken {
  id: string;
  userId?: string;
  token: string;
  tokenType: 'jwt' | 'oauth' | 'temporary';
  scope?: string[];
  clientInfo?: {
    name?: string;
    ip?: string;
    userAgent?: string;
  };
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
}

/**
 * 外部授权请求
 */
export interface ExternalAuthRequest {
  provider: 'oauth' | 'temporary';
  scope?: string[];
  clientInfo?: {
    name?: string;
    redirectUri?: string;
  };
  expiresIn?: number; // 秒
}

/**
 * 外部授权响应
 */
export interface ExternalAuthResponse {
  token: string;
  expiresAt: Date;
  authUrl?: string; // 用于OAuth重定向
}

/**
 * 登录日志
 */
export interface LoginLog {
  id: string;
  userId?: string;
  username: string;
  ipAddress?: string;
  userAgent?: string;
  loginMethod: 'password' | 'api_key' | 'oauth';
  success: boolean;
  failureReason?: string;
  createdAt: Date;
}

/**
 * API响应格式
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 分页结果
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * 查询历史
 */
export interface QueryHistory {
  id: string;
  userId: string;
  connectionId: string;
  naturalQuery?: string;
  sql: string;
  executionTime: number;
  resultCount: number;
  success: boolean;
  error?: string;
  createdAt: Date;
}

/**
 * 数据库适配器接口
 */
export interface DatabaseAdapter {
  connect(config: DatabaseConnection): Promise<void>;
  disconnect(): Promise<void>;
  testConnection(): Promise<boolean>;
  executeQuery(sql: string, params?: any[]): Promise<QueryResult>;
  getDatabases(): Promise<string[]>;
  getTables(database?: string): Promise<TableInfo[]>;
  getTableSchema(tableName: string): Promise<ColumnInfo[]>;
  getIndexes(tableName: string): Promise<IndexInfo[]>;
}

/**
 * AI服务配置
 */
export interface AIConfig {
  provider: 'openai' | 'claude' | 'custom';
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  baseURL?: string;
}

/**
 * 错误类型
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 环境变量类型
 */
export interface ENV {
  PORT: string;
  NODE_ENV: string;
  API_PREFIX: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  DATABASE_URL: string;
  AI_PROVIDER: string;
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;
  OPENAI_MAX_TOKENS: string;
  OPENAI_TEMPERATURE: string;
  CLAUDE_API_KEY?: string;
  CLAUDE_MODEL?: string;
  LOG_LEVEL: string;
  LOG_FILE: string;
  CORS_ORIGIN: string;
  BCRYPT_ROUNDS: string;
  RATE_LIMIT_WINDOW_MS: string;
  RATE_LIMIT_MAX_REQUESTS: string;
  MAX_FILE_SIZE: string;
  UPLOAD_PATH: string;
  API_KEY_PREFIX: string;
  SESSION_SECRET: string;
  OAUTH_CLIENT_ID?: string;
  OAUTH_CLIENT_SECRET?: string;
  OAUTH_CALLBACK_URL?: string;
}