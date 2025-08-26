import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import type { DatabaseAdapter, SQLDialect, ColumnDefinition } from './interfaces';
import type { 
  DatabaseConnection, 
  QueryResult, 
  TableInfo, 
  ColumnInfo, 
  IndexInfo,
  FieldInfo 
} from '../types';
import { logger } from '../utils/logger';
import path from 'path';

/**
 * SQLite SQL方言实现
 */
export class SQLiteDialect implements SQLDialect {
  mapDataType(genericType: string): string {
    const typeMap: Record<string, string> = {
      'string': 'TEXT',
      'text': 'TEXT',
      'integer': 'INTEGER',
      'bigint': 'INTEGER',
      'decimal': 'REAL',
      'float': 'REAL',
      'double': 'REAL',
      'boolean': 'INTEGER',
      'date': 'TEXT',
      'datetime': 'TEXT',
      'timestamp': 'TEXT',
      'json': 'TEXT',
      'blob': 'BLOB'
    };
    return typeMap[genericType] || 'TEXT';
  }

  limitClause(limit: number, offset?: number): string {
    return offset ? `LIMIT ${limit} OFFSET ${offset}` : `LIMIT ${limit}`;
  }

  dateFormat(format: string): string {
    return `strftime('${format}', ?)`;
  }

  quoteIdentifier(identifier: string): string {
    return `"${identifier}"`;
  }

  concat(...columns: string[]): string {
    return `(${columns.join(' || ')})`;
  }

  substring(column: string, start: number, length?: number): string {
    return length 
      ? `substr(${column}, ${start}, ${length})`
      : `substr(${column}, ${start})`;
  }

  currentTimestamp(): string {
    return "datetime('now')";
  }

  autoIncrement(): string {
    return 'AUTOINCREMENT';
  }

  createTableSyntax(tableName: string, columns: ColumnDefinition[]): string {
    const columnDefs = columns.map(col => {
      let def = `${this.quoteIdentifier(col.name)} ${col.type}`;
      
      if (col.isPrimaryKey) {
        def += ' PRIMARY KEY';
        if (col.isAutoIncrement) {
          def += ` ${this.autoIncrement()}`;
        }
      }
      
      if (!col.nullable && !col.isPrimaryKey) {
        def += ' NOT NULL';
      }
      
      if (col.defaultValue !== undefined && !col.isAutoIncrement) {
        def += ` DEFAULT ${typeof col.defaultValue === 'string' ? `'${col.defaultValue}'` : col.defaultValue}`;
      }
      
      return def;
    }).join(',\n  ');

    return `CREATE TABLE ${this.quoteIdentifier(tableName)} (\n  ${columnDefs}\n)`;
  }
}

/**
 * SQLite数据库适配器
 */
export class SQLiteAdapter implements DatabaseAdapter {
  private db: Database<sqlite3.Database, sqlite3.Statement> | null = null;
  private dialect: SQLiteDialect;
  private config: DatabaseConnection | null = null;

  constructor() {
    this.dialect = new SQLiteDialect();
  }

  async connect(config: DatabaseConnection): Promise<void> {
    try {
      this.config = config;
      
      // 使用DSN连接字符串
      let dbPath = config.dsn;
      if (!dbPath) {
        throw new Error('SQLite连接需要DSN连接字符串');
      }
      
      // 处理SQLite DSN格式 (sqlite:///path/to/db.sqlite 或 file:///path/to/db.sqlite)
      if (dbPath.startsWith('sqlite:///')) {
        dbPath = dbPath.replace('sqlite:///', '');
      } else if (dbPath.startsWith('file:///')) {
        dbPath = dbPath.replace('file:///', '');
      } else if (dbPath.startsWith('sqlite://')) {
        dbPath = dbPath.replace('sqlite://', '');
      }
      
      // 确保路径是绝对路径
      if (!path.isAbsolute(dbPath)) {
        dbPath = path.resolve(dbPath);
      }

      // 确保目录存在
      const dbDir = path.dirname(dbPath);
      const fs = await import('fs/promises');
      try {
        await fs.mkdir(dbDir, { recursive: true });
      } catch (error) {
        // 目录可能已存在，忽略错误
      }

      // 连接SQLite数据库
      this.db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });

      // 启用外键约束
      await this.db.exec('PRAGMA foreign_keys = ON');
      
      // 设置WAL模式提高并发性能
      await this.db.exec('PRAGMA journal_mode = WAL');
      
      // 设置其他优化
      await this.db.exec('PRAGMA synchronous = NORMAL');
      await this.db.exec('PRAGMA cache_size = 10000');
      await this.db.exec('PRAGMA temp_store = memory');

      logger.info(`SQLite数据库连接成功: ${dbPath}`);
    } catch (error) {
      logger.error('SQLite数据库连接失败:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.db) {
        await this.db.close();
        this.db = null;
      }
      
      logger.info('SQLite数据库连接已关闭');
    } catch (error) {
      logger.error('关闭SQLite数据库连接失败:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.db) {
        throw new Error('数据库连接未初始化');
      }

      await this.db.get('SELECT 1');
      return true;
    } catch (error) {
      logger.error('SQLite连接测试失败:', error);
      return false;
    }
  }

  async executeQuery(sql: string, params?: any[]): Promise<QueryResult> {
    if (!this.db) {
      throw new Error('数据库连接未初始化');
    }

    const startTime = Date.now();
    
    try {
      // 判断查询类型
      const sqlLower = sql.trim().toLowerCase();
      let result: any;
      let affectedRows: number | undefined;
      let insertId: number | undefined;

      if (sqlLower.startsWith('select') || sqlLower.startsWith('with')) {
        // SELECT查询
        result = await this.db.all(sql, params || []);
      } else if (sqlLower.startsWith('insert')) {
        // INSERT查询
        const runResult = await this.db.run(sql, params || []);
        affectedRows = runResult.changes;
        insertId = runResult.lastID;
        result = [];
      } else if (sqlLower.startsWith('update') || sqlLower.startsWith('delete')) {
        // UPDATE/DELETE查询
        const runResult = await this.db.run(sql, params || []);
        affectedRows = runResult.changes;
        result = [];
      } else {
        // 其他查询
        await this.db.exec(sql);
        result = [];
      }

      const executionTime = Date.now() - startTime;

      // 获取字段信息
      let fields: FieldInfo[] = [];
      if (Array.isArray(result) && result.length > 0) {
        fields = Object.keys(result[0]).map(key => ({
          name: key,
          type: 'TEXT', // SQLite的动态类型
          length: 0
        }));
      }

      const queryResult: QueryResult = {
        rows: Array.isArray(result) ? result : [],
        rowCount: Array.isArray(result) ? result.length : (affectedRows || 0),
        fields,
        executionTime,
        affectedRows: affectedRows || 0,
        insertId: insertId || 0
      };

      logger.info(`SQLite查询执行完成: ${executionTime}ms`);
      return queryResult;
    } catch (error) {
      logger.error('SQLite查询执行失败:', error);
      throw error;
    }
  }

  async executeTransaction(queries: Array<{ sql: string; params?: any[] }>): Promise<QueryResult[]> {
    if (!this.db) {
      throw new Error('数据库连接未初始化');
    }
    
    try {
      await this.db.exec('BEGIN TRANSACTION');
      
      const results: QueryResult[] = [];
      
      for (const query of queries) {
        const result = await this.executeQuery(query.sql, query.params);
        results.push(result);
      }
      
      await this.db.exec('COMMIT');
      
      return results;
    } catch (error) {
      await this.db.exec('ROLLBACK');
      logger.error('SQLite事务执行失败:', error);
      throw error;
    }
  }

  async getDatabases(): Promise<string[]> {
    // SQLite是单数据库文件，返回当前数据库名
    if (this.config?.dsn) {
      // 从DSN中提取数据库文件名
      let dbPath = this.config.dsn;
      if (dbPath.startsWith('sqlite:///')) {
        dbPath = dbPath.replace('sqlite:///', '');
      } else if (dbPath.startsWith('file:///')) {
        dbPath = dbPath.replace('file:///', '');
      } else if (dbPath.startsWith('sqlite://')) {
        dbPath = dbPath.replace('sqlite://', '');
      }
      const dbName = path.basename(dbPath, path.extname(dbPath));
      return [dbName];
    }
    return ['main'];
  }

  async getTables(database?: string): Promise<TableInfo[]> {
    const sql = `
      SELECT 
        name,
        type,
        sql
      FROM sqlite_master 
      WHERE type IN ('table', 'view') 
        AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `;

    const result = await this.executeQuery(sql);
    
    const tables: TableInfo[] = [];
    
    for (const row of result.rows) {
      // 获取表行数
      let rowCount = 0;
      if (row.type === 'table') {
        try {
          const countResult = await this.executeQuery(`SELECT COUNT(*) as count FROM "${row.name}"`);
          rowCount = countResult.rows[0]?.count || 0;
        } catch {
          // 忽略错误
        }
      }

      tables.push({
        name: row.name,
        type: row.type === 'table' ? 'table' : 'view',
        rowCount,
        comment: ''
      });
    }

    return tables;
  }

  async getTableSchema(tableName: string): Promise<ColumnInfo[]> {
    const result = await this.executeQuery(`PRAGMA table_info("${tableName}")`);
    
    return result.rows.map(row => ({
      name: row.name,
      type: row.type,
      nullable: !row.notnull,
      defaultValue: row.dflt_value,
      isPrimaryKey: !!row.pk,
      isAutoIncrement: false, // 需要进一步检查
      comment: ''
    }));
  }

  async getIndexes(tableName: string): Promise<IndexInfo[]> {
    const result = await this.executeQuery(`PRAGMA index_list("${tableName}")`);
    
    const indexes: IndexInfo[] = [];
    
    for (const row of result.rows) {
      // 获取索引的列信息
      const indexInfo = await this.executeQuery(`PRAGMA index_info("${row.name}")`);
      
      indexes.push({
        name: row.name,
        columns: indexInfo.rows.map(col => col.name),
        isUnique: !!row.unique,
        isPrimary: row.name.includes('primary') || row.name.includes('pk'),
        type: 'BTREE' // SQLite默认使用B-Tree
      });
    }

    return indexes;
  }

  async insert(tableName: string, data: Record<string, any>): Promise<QueryResult> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => '?').join(', ');
    
    const sql = `INSERT INTO "${tableName}" 
                 (${columns.map(col => `"${col}"`).join(', ')}) 
                 VALUES (${placeholders})`;
    
    return this.executeQuery(sql, values);
  }

  async update(tableName: string, data: Record<string, any>, where: Record<string, any>): Promise<QueryResult> {
    const setClause = Object.keys(data)
      .map(key => `"${key}" = ?`)
      .join(', ');
    
    const whereClause = Object.keys(where)
      .map(key => `"${key}" = ?`)
      .join(' AND ');
    
    const sql = `UPDATE "${tableName}" 
                 SET ${setClause} 
                 WHERE ${whereClause}`;
    
    const params = [...Object.values(data), ...Object.values(where)];
    
    return this.executeQuery(sql, params);
  }

  async delete(tableName: string, where: Record<string, any>): Promise<QueryResult> {
    const whereClause = Object.keys(where)
      .map(key => `"${key}" = ?`)
      .join(' AND ');
    
    const sql = `DELETE FROM "${tableName}" 
                 WHERE ${whereClause}`;
    
    return this.executeQuery(sql, Object.values(where));
  }

  async explainQuery(sql: string): Promise<any> {
    const result = await this.executeQuery(`EXPLAIN QUERY PLAN ${sql}`);
    return result.rows;
  }

  async getQueryStats(): Promise<any> {
    // SQLite没有复杂的统计信息，返回基本信息
    const result = await this.executeQuery(`
      SELECT 
        name,
        type,
        sql
      FROM sqlite_master 
      WHERE type = 'table'
    `);
    
    return result.rows;
  }
}