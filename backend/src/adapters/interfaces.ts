/**
 * 数据库适配器接口定义
 * 
 * @fileoverview 定义了所有数据库适配器需要实现的接口，包括基础适配器、SQL方言、连接池等
 * @author AI数据库团队
 * @version 1.0.0
 * @since 1.0.0
 */

import type { 
  DatabaseConnection, 
  QueryResult, 
  TableInfo, 
  ColumnInfo, 
  IndexInfo 
} from '../types';

/**
 * 数据库适配器基础接口
 * 
 * @description 定义了所有数据库适配器必须实现的方法，支持MySQL、PostgreSQL、SQLite、MongoDB等
 * @interface DatabaseAdapter
 * @example
 * ```typescript
 * class MySQLAdapter implements DatabaseAdapter {
 *   async connect(config: DatabaseConnection) {
 *     // 实现MySQL连接逻辑
 *   }
 * }
 * ```
 */
export interface DatabaseAdapter {
  /**
   * 连接数据库
   * 
   * @description 根据配置信息建立数据库连接
   * @param config - 数据库连接配置
   * @returns Promise<void> 连接成功时resolve
   * @throws {DatabaseConnectionError} 当连接失败时抛出
   * @example
   * ```typescript
   * await adapter.connect({
   *   host: 'localhost',
   *   port: 3306,
   *   username: 'root',
   *   password: 'password',
   *   database: 'test'
   * });
   * ```
   */
  connect(config: DatabaseConnection): Promise<void>;

  /**
   * 断开数据库连接
   * 
   * @description 关闭当前数据库连接并释放相关资源
   * @returns Promise<void> 断开成功时resolve
   * @example
   * ```typescript
   * await adapter.disconnect();
   * ```
   */
  disconnect(): Promise<void>;

  /**
   * 测试数据库连接
   * 
   * @description 验证数据库连接是否正常，不会影响当前连接状态
   * @returns Promise<boolean> 连接正常返回true，否则返回false
   * @example
   * ```typescript
   * const isConnected = await adapter.testConnection();
   * if (isConnected) {
   *   console.log('数据库连接正常');
   * }
   * ```
   */
  testConnection(): Promise<boolean>;

  /**
   * 执行SQL查询
   * 
   * @description 执行单条SQL语句，支持参数化查询防止SQL注入
   * @param sql - 要执行的SQL语句
   * @param params - 查询参数数组（可选）
   * @returns Promise<QueryResult> 查询结果，包含数据行、影响行数等
   * @throws {QueryExecutionError} 当SQL执行失败时抛出
   * @example
   * ```typescript
   * // 无参数查询
   * const result1 = await adapter.executeQuery('SELECT * FROM users');
   * 
   * // 参数化查询
   * const result2 = await adapter.executeQuery(
   *   'SELECT * FROM users WHERE id = ? AND status = ?',
   *   [123, 'active']
   * );
   * ```
   */
  executeQuery(sql: string, params?: any[]): Promise<QueryResult>;

  /**
   * 执行事务
   * 
   * @description 在一个事务中执行多条SQL语句，保证原子性
   * @param queries - 要执行的SQL语句数组，每个元素包含sql和params
   * @returns Promise<QueryResult[]> 所有查询的结果数组
   * @throws {TransactionError} 当事务执行失败时抛出，所有操作会被回滚
   * @example
   * ```typescript
   * const results = await adapter.executeTransaction([
   *   { sql: 'INSERT INTO users (name) VALUES (?)', params: ['张三'] },
   *   { sql: 'UPDATE accounts SET balance = balance - 100 WHERE user_id = ?', params: [1] },
   *   { sql: 'UPDATE accounts SET balance = balance + 100 WHERE user_id = ?', params: [2] }
   * ]);
   * ```
   */
  executeTransaction(queries: Array<{ sql: string; params?: any[] }>): Promise<QueryResult[]>;

  /**
   * 获取数据库列表
   * 
   * @description 获取当前数据库实例中所有数据库的名称
   * @returns Promise<string[]> 数据库名称数组
   * @example
   * ```typescript
   * const databases = await adapter.getDatabases();
   * console.log('可用数据库:', databases); // ['test', 'production', 'staging']
   * ```
   */
  getDatabases(): Promise<string[]>;

  /**
   * 获取表列表
   * 
   * @description 获取指定数据库中所有表的信息
   * @param database - 数据库名称（可选，不指定则使用当前数据库）
   * @returns Promise<TableInfo[]> 表信息数组，包含表名、类型、注释等
   * @example
   * ```typescript
   * const tables = await adapter.getTables('test');
   * tables.forEach(table => {
   *   console.log(`表名: ${table.name}, 类型: ${table.type}`);
   * });
   * ```
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

  // AI语义化操作扩展
  /**
   * 全文搜索
   */
  fullTextSearch?(tableName: string, searchText: string, columns?: string[]): Promise<QueryResult>;

  /**
   * 向量相似性搜索
   */
  vectorSearch?(tableName: string, vectorColumn: string, queryVector: number[], topK?: number): Promise<QueryResult>;

  /**
   * 语义化数据统计
   */
  getDataStatistics?(tableName: string, columns?: string[]): Promise<DataStatistics>;

  /**
   * 智能连表查询
   */
  intelligentJoin?(tables: string[], conditions?: JoinCondition[]): Promise<QueryResult>;

  /**
   * 创建向量索引
   */
  createVectorIndex?(tableName: string, columnName: string, dimensions: number): Promise<void>;

  /**
   * 创建全文搜索索引
   */
  createFullTextIndex?(tableName: string, columns: string[], language?: string): Promise<void>;
}

/**
 * SQL方言接口
 * 
 * @description 定义不同数据库的SQL方言特性，用于生成兼容的SQL语句
 * @interface SQLDialect
 * @example
 * ```typescript
 * class MySQLDialect implements SQLDialect {
 *   limitClause(limit: number, offset?: number): string {
 *     return offset ? `LIMIT ${offset}, ${limit}` : `LIMIT ${limit}`;
 *   }
 * }
 * ```
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
 * 列定义接口
 * 
 * @description 定义数据库表列的结构信息，用于创建表和查看表结构
 * @interface ColumnDefinition
 * @example
 * ```typescript
 * const userIdColumn: ColumnDefinition = {
 *   name: 'id',
 *   type: 'INT',
 *   isPrimaryKey: true,
 *   isAutoIncrement: true,
 *   comment: '用户唯一标识符'
 * };
 * ```
 */
export interface ColumnDefinition {
  /** 列名 */
  name: string;
  /** 数据类型 */
  type: string;
  /** 是否允许为空（默认true） */
  nullable?: boolean;
  /** 默认值 */
  defaultValue?: any;
  /** 是否为主键 */
  isPrimaryKey?: boolean;
  /** 是否自增 */
  isAutoIncrement?: boolean;
  /** 最大长度（字符串类型） */
  maxLength?: number;
  /** 精度（数值类型） */
  precision?: number;
  /** 标度（数值类型） */
  scale?: number;
  /** 列注释 */
  comment?: string;
}

/**
 * 数据库连接池接口
 * 
 * @description 管理数据库连接池，提高连接复用效率并控制连接数量
 * @interface ConnectionPool
 * @example
 * ```typescript
 * const pool = new MySQLConnectionPool({
 *   max: 10,
 *   min: 2,
 *   acquireTimeoutMillis: 30000
 * });
 * 
 * const connection = await pool.getConnection();
 * try {
 *   // 使用连接执行查询
 * } finally {
 *   await pool.releaseConnection(connection);
 * }
 * ```
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
 * 
 * @description 管理数据库事务的生命周期，支持事务的开始、提交和回滚
 * @interface Transaction
 * @example
 * ```typescript
 * const transaction = await adapter.beginTransaction();
 * try {
 *   await transaction.executeQuery('INSERT INTO users ...');
 *   await transaction.executeQuery('UPDATE accounts ...');
 *   await transaction.commit();
 * } catch (error) {
 *   await transaction.rollback();
 *   throw error;
 * }
 * ```
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
 * 
 * @description 定义数据库版本迁移的操作，支持数据库结构的版本管理
 * @interface DatabaseMigration
 * @example
 * ```typescript
 * class CreateUsersTableMigration implements DatabaseMigration {
 *   getVersion(): string { return '20231201_120000'; }
 *   getDescription(): string { return '创建用户表'; }
 *   
 *   async up(): Promise<void> {
 *     // 执行迁移逻辑
 *   }
 *   
 *   async down(): Promise<void> {
 *     // 回滚迁移逻辑
 *   }
 * }
 * ```
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

/**
 * 数据统计信息接口
 * 
 * @description 提供表和列的统计信息，用于AI分析
 */
export interface DataStatistics {
  /** 表名 */
  tableName: string;
  /** 总行数 */
  totalRows: number;
  /** 列统计信息 */
  columns: ColumnStatistics[];
  /** 数据分布信息 */
  distribution?: Record<string, any>;
}

/**
 * 列统计信息
 */
export interface ColumnStatistics {
  /** 列名 */
  name: string;
  /** 数据类型 */
  type: string;
  /** 非空值数量 */
  nonNullCount: number;
  /** 唯一值数量 */
  uniqueCount: number;
  /** 最小值 */
  minValue?: any;
  /** 最大值 */
  maxValue?: any;
  /** 平均值（数值类型） */
  avgValue?: number | undefined;
  /** 最常见的值 */
  mostCommonValues?: Array<{ value: any; count: number }>;
}

/**
 * 连表查询条件
 */
export interface JoinCondition {
  /** 左表 */
  leftTable: string;
  /** 右表 */
  rightTable: string;
  /** 连接类型 */
  joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  /** 连接条件 */
  onCondition: string;
  /** 连接字段映射 */
  fieldMapping?: Record<string, string>;
}

/**
 * 向量搜索结果
 */
export interface VectorSearchResult {
  /** 原始数据 */
  data: Record<string, any>;
  /** 相似度分数 */
  similarity: number;
  /** 距离 */
  distance?: number;
}

/**
 * 全文搜索配置
 */
export interface FullTextSearchConfig {
  /** 搜索语言 */
  language?: string;
  /** 最小词长 */
  minWordLength?: number;
  /** 是否启用模糊匹配 */
  fuzzyMatch?: boolean;
  /** 权重配置 */
  weights?: Record<string, number>;
}