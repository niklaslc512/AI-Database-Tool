/**
 * 数据库连接配置
 */
export interface DatabaseConnection {
  id: string;
  name: string;
  type: DatabaseType;
  dsn: string;  // DSN连接字符串格式
  status?: 'active' | 'inactive' | 'error';  // 连接状态
  lastTestedAt?: Date;  // 最后测试时间
  testResult?: string;  // 测试结果信息
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
export type DatabaseType = 'postgresql' | 'mongodb' 


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
 * 👤 用户信息
 */
export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash?: string;
  salt?: string;
  roles: string;  // 🎭 多角色，逗号分隔存储，如: "admin,developer"
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
 * 🎭 用户角色枚举
 * - admin: 系统管理员，可以管理用户和系统设置
 * - developer: 开发者，可以管理API密钥和数据库表
 * - guest: 访客，只能进行数据查询
 */
export type UserRole = 'admin' | 'developer' | 'guest';

/**
 * 🔐 角色权限映射
 */
export const ROLE_PERMISSIONS = {
  admin: ['user_management', 'system_settings', 'api_key_management', 'database_management', 'data_query'],
  developer: ['api_key_management', 'database_management', 'data_query'],
  guest: ['data_query']
} as const;

/**
 * 📋 权限类型
 */
export type Permission = 
  | 'user_management'      // 用户管理
  | 'system_settings'      // 系统设置
  | 'api_key_management'   // API密钥管理
  | 'database_management'  // 数据库管理
  | 'data_query';          // 数据查询

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
 * 🔐 权限资源接口（已废弃，使用Permission类型）
 */
export interface PermissionResource {
  resource: string;
  actions: string[];
}

/**
 * 👥 用户创建请求
 */
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  roles?: UserRole[];  // 🎭 角色数组
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
 * 🔑 JWT负载
 */
export interface JWTPayload {
  userId: string;
  username: string;
  roles: UserRole[];  // 🎭 用户角色数组
  iat: number;
  exp: number;
}

/**
 * API密钥权限类型（使用现有的permissions字段）
 */
export type ApiKeyPermission = 'read' | 'write' | 'delete' | 'admin';

/**
 * API密钥
 */
export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  apiKey: string;  // ak-开头的单一字符串
  permissions?: ApiKeyPermission[];  // 权限列表（存储在permissions字段）
  databaseIds?: string[];  // 关联的数据库连接ID列表
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
  permissions?: ApiKeyPermission[];  // 权限列表
  databaseIds?: string[];  // 关联的数据库连接ID列表
  expiresAt?: Date;
}

/**
 * 创建API Key响应
 */
export interface CreateApiKeyResponse {
  apiKey: ApiKey;
  secret: string; // 仅在创建时返回，实际为完整的ak-开头字符串
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
 * 操作确认响应类型
 */
export interface MessageResponse {
  message: string;
}

/**
 * 错误响应类型
 */
export interface ErrorResponse {
  message: string;
  timestamp: string;
  path: string;
  error?: string;
  stack?: string;
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
 * 🛠️ 角色工具函数类型
 */
export interface RoleUtils {
  parseRoles: (rolesString: string) => UserRole[];
  stringifyRoles: (roles: UserRole[]) => string;
  hasRole: (userRoles: string, targetRole: UserRole) => boolean;
  hasAnyRole: (userRoles: string, targetRoles: UserRole[]) => boolean;
  hasPermission: (userRoles: string, permission: Permission) => boolean;
  addRole: (userRoles: string, newRole: UserRole) => string;
  removeRole: (userRoles: string, roleToRemove: UserRole) => string;
}



/**
 * 🔑 API密钥权限预设配置
 */
export const API_KEY_PERMISSION_PRESETS = {
  READ_ONLY: ['read'] as ApiKeyPermission[],
  FULL_ACCESS: ['read', 'write', 'delete', 'admin'] as ApiKeyPermission[],
  DEVELOPER: ['read', 'write'] as ApiKeyPermission[]
} as const;

/**
 * 🔑 API密钥权限预设类型
 */
export type ApiKeyPermissionPreset = keyof typeof API_KEY_PERMISSION_PRESETS;

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
 * 🔧 系统配置类型
 */
export type ConfigType = 'string' | 'number' | 'boolean' | 'json';

/**
 * 🔧 配置分类
 */
export type ConfigCategory = 'general' | 'database' | 'ai' | 'security' | 'system';

/**
 * 🔧 系统配置接口
 */
export interface Config {
  id: string;
  key: string;
  value: string;
  type: ConfigType;
  description?: string;
  category: ConfigCategory;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 🔧 创建配置请求
 */
export interface CreateConfigRequest {
  key: string;
  value: string;
  type?: ConfigType;
  description?: string;
  category?: ConfigCategory;
}

/**
 * 🔧 更新配置请求
 */
export interface UpdateConfigRequest {
  value?: string;
  description?: string;
  category?: ConfigCategory;
}

/**
 * 🔧 配置变更事件
 */
export interface ConfigChangeEvent {
  key: string;
  oldValue: string;
  newValue: string;
  type: ConfigType;
  timestamp: Date;
  userId?: string | undefined;         // 操作用户ID
}

/**
 * 🔧 配置初始化选项
 */
export interface ConfigInitOptions {
  overrideEnv?: boolean;   // 是否覆盖环境变量
  categories?: ConfigCategory[]; // 只初始化指定分类的配置
}

/**
 * 错误类型
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly path: string | undefined;

  constructor(
    message: string, 
    statusCode: number = 500, 
    isOperational: boolean = true,
    path?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.path = path;

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