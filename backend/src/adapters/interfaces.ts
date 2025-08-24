import type { 
  DatabaseConnection, 
  QueryResult, 
  TableInfo, 
  ColumnInfo, 
  IndexInfo 
} from '../types';

/**
 * 数据库适配器基础接口
 */
export interface DatabaseAdapter {
  /**
   * 连接数据库
   */
  connect(config: DatabaseConnection): Promise<void>;

  /**
   * 断开数据库连接
   */
  disconnect(): Promise<void>;

  /**
   * 测试数据库连接
   */
  testConnection(): Promise<boolean>;

  /**
   * 执行SQL查询
   */
  executeQuery(sql: string, params?: any[]): Promise<QueryResult>;

  /**
   * 执行事务
   */
  executeTransaction(queries: Array<{ sql: string; params?: any[] }>): Promise<QueryResult[]>;

  /**
   * 获取数据库列表
   */
  getDatabases(): Promise<string[]>;

  /**
   * 获取表列表
   */
  getTables(database?: string): Promise<TableInfo[]>;

  /**
   * 获取表结构
   */
  getTableSchema(tableName: string): Promise<ColumnInfo[]>;

  /**
   * 获取索引信息
   */
  getIndexes(tableName: string): Promise<IndexInfo[]>;

  /**
   * 插入数据
   */
  insert(tableName: string, data: Record<string, any>): Promise<QueryResult>;

  /**
   * 更新数据
   */
  update(tableName: string, data: Record<string, any>, where: Record<string, any>): Promise<QueryResult>;

  /**
   * 删除数据
   */
  delete(tableName: string, where: Record<string, any>): Promise<QueryResult>;

  /**
   * 解释查询执行计划
   */
  explainQuery(sql: string): Promise<any>;

  /**
   * 获取查询统计信息
   */
  getQueryStats(): Promise<any>;
}

/**
 * SQL方言接口
 */
export interface SQLDialect {
  /**
   * 数据类型映射
   */
  mapDataType(genericType: string): string;

  /**
   * 限制查询条数语法
   */
  limitClause(limit: number, offset?: number): string;

  /**
   * 日期格式化
   */
  dateFormat(format: string): string;

  /**
   * 引用标识符
   */
  quoteIdentifier(identifier: string): string;

  /**
   * 字符串连接函数
   */
  concat(...columns: string[]): string;

  /**
   * 字符串截取函数
   */
  substring(column: string, start: number, length?: number): string;

  /**
   * 当前时间戳函数
   */
  currentTimestamp(): string;

  /**
   * 自增主键语法
   */
  autoIncrement(): string;

  /**
   * 创建表语法
   */
  createTableSyntax(tableName: string, columns: ColumnDefinition[]): string;
}

/**
 * 列定义
 */
export interface ColumnDefinition {
  name: string;
  type: string;
  nullable?: boolean;
  defaultValue?: any;
  isPrimaryKey?: boolean;
  isAutoIncrement?: boolean;
  maxLength?: number;
  precision?: number;
  scale?: number;
  comment?: string;
}

/**
 * 数据库连接池接口
 */
export interface ConnectionPool {
  /**
   * 获取连接
   */
  getConnection(): Promise<any>;

  /**
   * 释放连接
   */
  releaseConnection(connection: any): Promise<void>;

  /**
   * 关闭连接池
   */
  close(): Promise<void>;

  /**
   * 获取连接池状态
   */
  getStatus(): {
    total: number;
    active: number;
    idle: number;
  };
}

/**
 * 事务接口
 */
export interface Transaction {
  /**
   * 开始事务
   */
  begin(): Promise<void>;

  /**
   * 提交事务
   */
  commit(): Promise<void>;

  /**
   * 回滚事务
   */
  rollback(): Promise<void>;

  /**
   * 执行查询
   */
  executeQuery(sql: string, params?: any[]): Promise<QueryResult>;
}

/**
 * 数据库迁移接口
 */
export interface DatabaseMigration {
  /**
   * 执行迁移
   */
  up(): Promise<void>;

  /**
   * 回滚迁移
   */
  down(): Promise<void>;

  /**
   * 获取迁移版本
   */
  getVersion(): string;

  /**
   * 获取迁移描述
   */
  getDescription(): string;
}