import mysql from 'mysql2/promise';
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

/**
 * MySQL SQL方言实现
 */
export class MySQLDialect implements SQLDialect {
  mapDataType(genericType: string): string {
    const typeMap: Record<string, string> = {
      'string': 'VARCHAR(255)',
      'text': 'TEXT',
      'integer': 'INT',
      'bigint': 'BIGINT',
      'decimal': 'DECIMAL(10,2)',
      'float': 'FLOAT',
      'double': 'DOUBLE',
      'boolean': 'BOOLEAN',
      'date': 'DATE',
      'datetime': 'DATETIME',
      'timestamp': 'TIMESTAMP',
      'json': 'JSON',
      'blob': 'BLOB'
    };
    return typeMap[genericType] || genericType;
  }

  limitClause(limit: number, offset?: number): string {
    return offset ? `LIMIT ${offset}, ${limit}` : `LIMIT ${limit}`;
  }

  dateFormat(format: string): string {
    return `DATE_FORMAT(?, '${format}')`;
  }

  quoteIdentifier(identifier: string): string {
    return `\`${identifier}\``;
  }

  concat(...columns: string[]): string {
    return `CONCAT(${columns.join(', ')})`;
  }

  substring(column: string, start: number, length?: number): string {
    return length 
      ? `SUBSTRING(${column}, ${start}, ${length})`
      : `SUBSTRING(${column}, ${start})`;
  }

  currentTimestamp(): string {
    return 'NOW()';
  }

  autoIncrement(): string {
    return 'AUTO_INCREMENT';
  }

  createTableSyntax(tableName: string, columns: ColumnDefinition[]): string {
    let columnDefs = columns.map(col => {
      let def = `${this.quoteIdentifier(col.name)} ${col.type}`;
      
      if (!col.nullable) {
        def += ' NOT NULL';
      }
      
      if (col.isAutoIncrement) {
        def += ` ${this.autoIncrement()}`;
      }
      
      if (col.defaultValue !== undefined) {
        def += ` DEFAULT ${typeof col.defaultValue === 'string' ? `'${col.defaultValue}'` : col.defaultValue}`;
      }
      
      if (col.comment) {
        def += ` COMMENT '${col.comment}'`;
      }
      
      return def;
    }).join(',\n  ');

    const primaryKeys = columns.filter(col => col.isPrimaryKey).map(col => this.quoteIdentifier(col.name));
    if (primaryKeys.length > 0) {
      columnDefs += `,\n  PRIMARY KEY (${primaryKeys.join(', ')})`;
    }

    return `CREATE TABLE ${this.quoteIdentifier(tableName)} (\n  ${columnDefs}\n)`;
  }
}

/**
 * MySQL数据库适配器
 */
export class MySQLAdapter implements DatabaseAdapter {
  private connection: mysql.Connection | null = null;
  private pool: mysql.Pool | null = null;
  private dialect: MySQLDialect;
  private config: DatabaseConnection | null = null;

  constructor() {
    this.dialect = new MySQLDialect();
  }

  async connect(config: DatabaseConnection): Promise<void> {
    try {
      this.config = config;
      
      // 创建连接池
      // 创建连接池配置
      const poolConfig: any = {
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        database: config.database,
        connectionLimit: 10
      };
      
      // 只有启用SSL时才添加ssl配置
      if (config.ssl) {
        poolConfig.ssl = {};
      }
      
      this.pool = mysql.createPool(poolConfig);

      // 测试连接
      const testConnection = await this.pool.getConnection();
      await testConnection.ping();
      testConnection.release();

      logger.info(`MySQL数据库连接成功: ${config.host}:${config.port}/${config.database}`);
    } catch (error) {
      logger.error('MySQL数据库连接失败:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.connection) {
        await this.connection.end();
        this.connection = null;
      }
      
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
      }
      
      logger.info('MySQL数据库连接已关闭');
    } catch (error) {
      logger.error('关闭MySQL数据库连接失败:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.pool) {
        throw new Error('数据库连接池未初始化');
      }

      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      return true;
    } catch (error) {
      logger.error('MySQL连接测试失败:', error);
      return false;
    }
  }

  async executeQuery(sql: string, params?: any[]): Promise<QueryResult> {
    if (!this.pool) {
      throw new Error('数据库连接池未初始化');
    }

    const startTime = Date.now();
    
    try {
      const connection = await this.pool.getConnection();
      
      try {
        const [rows, fields] = await connection.execute(sql, params || []);
        const executionTime = Date.now() - startTime;

        connection.release();

        // 处理查询结果
        const result: QueryResult = {
          rows: Array.isArray(rows) ? rows as Record<string, any>[] : [],
          rowCount: Array.isArray(rows) ? rows.length : 0,
          fields: this.mapFields(fields as any[]),
          executionTime
        };

        // 处理INSERT/UPDATE/DELETE结果
        if (!Array.isArray(rows) && typeof rows === 'object') {
          const resultSet = rows as any;
          result.affectedRows = resultSet.affectedRows;
          result.insertId = resultSet.insertId;
        }

        logger.info(`MySQL查询执行完成: ${executionTime}ms`);
        return result;
      } finally {
        connection.release();
      }
    } catch (error) {
      logger.error('MySQL查询执行失败:', error);
      throw error;
    }
  }

  async executeTransaction(queries: Array<{ sql: string; params?: any[] }>): Promise<QueryResult[]> {
    if (!this.pool) {
      throw new Error('数据库连接池未初始化');
    }

    const connection = await this.pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const results: QueryResult[] = [];
      
      for (const query of queries) {
        const startTime = Date.now();
        const [rows, fields] = await connection.execute(query.sql, query.params || []);
        const executionTime = Date.now() - startTime;

        results.push({
          rows: Array.isArray(rows) ? rows as Record<string, any>[] : [],
          rowCount: Array.isArray(rows) ? rows.length : 0,
          fields: this.mapFields(fields as any[]),
          executionTime,
          affectedRows: (rows as any)?.affectedRows,
          insertId: (rows as any)?.insertId
        });
      }
      
      await connection.commit();
      connection.release();
      
      return results;
    } catch (error) {
      await connection.rollback();
      connection.release();
      logger.error('MySQL事务执行失败:', error);
      throw error;
    }
  }

  async getDatabases(): Promise<string[]> {
    const result = await this.executeQuery('SHOW DATABASES');
    return result.rows.map(row => row.Database);
  }

  async getTables(database?: string): Promise<TableInfo[]> {
    const dbName = database || this.config?.database;
    if (!dbName) {
      throw new Error('未指定数据库名称');
    }

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

    const result = await this.executeQuery(sql, [dbName]);
    
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
    const dbName = this.config?.database;
    if (!dbName) {
      throw new Error('未指定数据库名称');
    }

    const sql = `
      SELECT 
        COLUMN_NAME as name,
        DATA_TYPE as type,
        IS_NULLABLE as nullable,
        COLUMN_DEFAULT as defaultValue,
        COLUMN_KEY as columnKey,
        EXTRA as extra,
        CHARACTER_MAXIMUM_LENGTH as maxLength,
        NUMERIC_PRECISION as precision,
        NUMERIC_SCALE as scale,
        COLUMN_COMMENT as comment
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `;

    const result = await this.executeQuery(sql, [dbName, tableName]);
    
    return result.rows.map(row => ({
      name: row.name,
      type: row.type,
      nullable: row.nullable === 'YES',
      defaultValue: row.defaultValue,
      isPrimaryKey: row.columnKey === 'PRI',
      isAutoIncrement: row.extra?.includes('auto_increment') || false,
      maxLength: row.maxLength,
      precision: row.precision,
      scale: row.scale,
      comment: row.comment
    }));
  }

  async getIndexes(tableName: string): Promise<IndexInfo[]> {
    const dbName = this.config?.database;
    if (!dbName) {
      throw new Error('未指定数据库名称');
    }

    const sql = `
      SELECT 
        INDEX_NAME as name,
        COLUMN_NAME as columnName,
        NON_UNIQUE as nonUnique,
        INDEX_TYPE as type
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      ORDER BY INDEX_NAME, SEQ_IN_INDEX
    `;

    const result = await this.executeQuery(sql, [dbName, tableName]);
    
    // 按索引名分组
    const indexMap = new Map<string, IndexInfo>();
    
    result.rows.forEach(row => {
      const indexName = row.name;
      
      if (!indexMap.has(indexName)) {
        indexMap.set(indexName, {
          name: indexName,
          columns: [],
          isUnique: row.nonUnique === 0,
          isPrimary: indexName === 'PRIMARY',
          type: row.type
        });
      }
      
      indexMap.get(indexName)!.columns.push(row.columnName);
    });

    return Array.from(indexMap.values());
  }

  async insert(tableName: string, data: Record<string, any>): Promise<QueryResult> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${this.dialect.quoteIdentifier(tableName)} 
                 (${columns.map(col => this.dialect.quoteIdentifier(col)).join(', ')}) 
                 VALUES (${placeholders})`;
    
    return this.executeQuery(sql, values);
  }

  async update(tableName: string, data: Record<string, any>, where: Record<string, any>): Promise<QueryResult> {
    const setClause = Object.keys(data)
      .map(key => `${this.dialect.quoteIdentifier(key)} = ?`)
      .join(', ');
    
    const whereClause = Object.keys(where)
      .map(key => `${this.dialect.quoteIdentifier(key)} = ?`)
      .join(' AND ');
    
    const sql = `UPDATE ${this.dialect.quoteIdentifier(tableName)} 
                 SET ${setClause} 
                 WHERE ${whereClause}`;
    
    const params = [...Object.values(data), ...Object.values(where)];
    
    return this.executeQuery(sql, params);
  }

  async delete(tableName: string, where: Record<string, any>): Promise<QueryResult> {
    const whereClause = Object.keys(where)
      .map(key => `${this.dialect.quoteIdentifier(key)} = ?`)
      .join(' AND ');
    
    const sql = `DELETE FROM ${this.dialect.quoteIdentifier(tableName)} 
                 WHERE ${whereClause}`;
    
    return this.executeQuery(sql, Object.values(where));
  }

  async explainQuery(sql: string): Promise<any> {
    const result = await this.executeQuery(`EXPLAIN ${sql}`);
    return result.rows;
  }

  async getQueryStats(): Promise<any> {
    const result = await this.executeQuery('SHOW STATUS LIKE "Com_%"');
    return result.rows;
  }

  private mapFields(fields: any[]): FieldInfo[] {
    return fields.map(field => ({
      name: field.name,
      type: field.type,
      length: field.length
    }));
  }
}