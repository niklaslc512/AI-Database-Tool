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
  createdAt: string;
  updatedAt: string;
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
  roles: string; // 支持多角色，格式如 'admin,developer,guest'
  status: UserStatus;
  displayName?: string;
  avatarUrl?: string;
  settings?: UserSettings;
  lastLoginAt?: string;
  loginCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 用户角色
 */
export type UserRole = 'admin' | 'developer' | 'guest';

/**
 * 🔐 角色权限映射
 */
export interface RolePermissions {
  admin: string[];
  developer: string[];
  guest: string[];
}

/**
 * 🛡️ 权限常量
 */
export const PERMISSIONS = {
  // 用户管理权限
  USER_MANAGEMENT: 'user:management',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_VIEW: 'user:view',
  
  // 系统设置权限
  SYSTEM_SETTINGS: 'system:settings',
  SYSTEM_CONFIG: 'system:config',
  
  // 数据库管理权限
  DATABASE_MANAGEMENT: 'database:management',
  DATABASE_CREATE: 'database:create',
  DATABASE_UPDATE: 'database:update',
  DATABASE_DELETE: 'database:delete',
  DATABASE_VIEW: 'database:view',
  
  // API密钥管理权限
  APIKEY_MANAGEMENT: 'apikey:management',
  APIKEY_CREATE: 'apikey:create',
  APIKEY_UPDATE: 'apikey:update',
  APIKEY_DELETE: 'apikey:delete',
  APIKEY_VIEW: 'apikey:view',
  
  // 查询工作台权限
  QUERY_WORKSPACE: 'query:workspace',
  QUERY_EXECUTE: 'query:execute',
  QUERY_SAVE: 'query:save',
  
  // 仪表板权限
  DASHBOARD_VIEW: 'dashboard:view'
} as const;

/**
 * 🎯 默认角色权限配置
 */
export const DEFAULT_ROLE_PERMISSIONS: RolePermissions = {
  admin: [
    PERMISSIONS.USER_MANAGEMENT,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.SYSTEM_CONFIG,
    PERMISSIONS.DASHBOARD_VIEW
  ],
  developer: [
    PERMISSIONS.DATABASE_MANAGEMENT,
    PERMISSIONS.DATABASE_CREATE,
    PERMISSIONS.DATABASE_UPDATE,
    PERMISSIONS.DATABASE_DELETE,
    PERMISSIONS.DATABASE_VIEW,
    PERMISSIONS.APIKEY_MANAGEMENT,
    PERMISSIONS.APIKEY_CREATE,
    PERMISSIONS.APIKEY_UPDATE,
    PERMISSIONS.APIKEY_DELETE,
    PERMISSIONS.APIKEY_VIEW,
    PERMISSIONS.QUERY_WORKSPACE,
    PERMISSIONS.QUERY_EXECUTE,
    PERMISSIONS.QUERY_SAVE,
    PERMISSIONS.DASHBOARD_VIEW
  ],
  guest: [
    PERMISSIONS.QUERY_WORKSPACE,
    PERMISSIONS.QUERY_EXECUTE,
    PERMISSIONS.DASHBOARD_VIEW
  ]
};

/**
 * 🔍 角色工具函数类型
 */
export interface RoleUtils {
  parseRoles: (roleString: string) => UserRole[];
  hasRole: (userRoles: UserRole[], requiredRole: UserRole) => boolean;
  hasAnyRole: (userRoles: UserRole[], requiredRoles: UserRole[]) => boolean;
  hasPermission: (userRoles: UserRole[], permission: string) => boolean;
  getRolePermissions: (roles: UserRole[]) => string[];
}

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
  user: User;
  token: string;
  refreshToken?: string;
  expiresAt: string;
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
 * 修改密码请求
 */
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
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
  lastUsedAt?: string;
  usageCount: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

/**
 * 创建API Key请求
 */
export interface CreateApiKeyRequest {
  name: string;
  permissions?: string[];
  expiresAt?: string;
}

/**
 * 创建API Key响应
 */
export interface CreateApiKeyResponse {
  apiKey: ApiKey;
  secret: string; // 仅在创建时返回
}

/**
 * API Key统计
 */
export interface ApiKeyStats {
  total: number;
  active: number;
  expired: number;
  totalUsage: number;
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
  expiresAt: string;
  isRevoked: boolean;
  createdAt: string;
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
  expiresAt: string;
  authUrl?: string; // 用于OAuth重定向
}

/**
 * 授权统计
 */
export interface AuthStats {
  totalTokens: number;
  activeTokens: number;
  expiredTokens: number;
  revokedTokens: number;
  byType: Record<string, number>;
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
  createdAt: string;
}

/**
 * 查询历史
 */
export interface QueryHistory {
  id: string;
  naturalQuery?: string;
  sql: string;
  executionTime: number;
  resultCount: number;
  success: boolean;
  error?: string;
  createdAt: string;
}

/**
 * 主题类型
 */
export type ThemeType = 'light' | 'dark' | 'auto';

/**
 * 应用设置
 */
export interface AppSettings {
  theme: ThemeType;
  language: string;
  autoSave: boolean;
  queryTimeout: number;
  maxRowsPerPage: number;
}

/**
 * 菜单项
 */
export interface MenuItem {
  id: string;
  title: string;
  icon?: string;
  path?: string;
  children?: MenuItem[];
  permission?: string;
}

/**
 * 面包屑项
 */
export interface BreadcrumbItem {
  title: string;
  path?: string;
}

/**
 * 表单规则
 */
export interface FormRule {
  required?: boolean;
  message?: string;
  trigger?: string | string[];
  min?: number;
  max?: number;
  pattern?: RegExp;
  validator?: (rule: any, value: any, callback: any) => void;
}

/**
 * 图表数据
 */
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}

/**
 * 错误信息
 */
export interface ErrorInfo {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

/**
 * 🔧 系统配置类型
 */
export type ConfigType = 'string' | 'number' | 'boolean' | 'json';

/**
 * 🔧 系统配置分类
 */
export type ConfigCategory = 'general' | 'database' | 'ai' | 'security' | 'system';

/**
 * 🔧 系统配置接口
 */
export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  type: ConfigType;
  category: ConfigCategory;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 🔧 创建系统配置请求
 */
export interface CreateConfigRequest {
  key: string;
  value: string;
  type: ConfigType;
  category: ConfigCategory;
  description?: string;
}

/**
 * 🔧 更新系统配置请求
 */
export interface UpdateConfigRequest {
  value?: string;
  description?: string;
  category?: ConfigCategory;
}

/**
 * 🔧 配置分类映射
 */
export const CONFIG_CATEGORIES = {
  general: { name: '通用', description: '通用配置', icon: 'Setting' },
  database: { name: '数据库', description: '数据库连接配置', icon: 'Connection' },
  ai: { name: 'AI', description: 'AI服务配置', icon: 'ChatLineRound' },
  security: { name: '安全', description: '安全策略配置', icon: 'Lock' },
  system: { name: '系统', description: '系统基础配置', icon: 'Document' }
} as const;

/**
 * 🔧 配置类型映射
 */
export const CONFIG_TYPES = {
  string: { name: '字符串', color: 'primary' },
  number: { name: '数字', color: 'success' },
  boolean: { name: '布尔值', color: 'warning' },
  json: { name: 'JSON', color: 'info' }
} as const;