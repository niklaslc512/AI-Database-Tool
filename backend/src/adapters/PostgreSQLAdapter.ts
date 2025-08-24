import { Pool, Client } from 'pg';
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
 * PostgreSQL SQL方言实现
 */
export class PostgreSQLDialect implements SQLDialect {
  mapDataType(genericType: string): string {
    const typeMap: Record<string, string> = {
      'string': 'VARCHAR(255)',
      'text': 'TEXT',
      'integer': 'INTEGER',
      'bigint': 'BIGINT',
      'decimal': 'NUMERIC(10,2)',
      'float': 'REAL',
      'double': 'DOUBLE PRECISION',
      'boolean': 'BOOLEAN',
      'date': 'DATE',
      'datetime': 'TIMESTAMP',
      'timestamp': 'TIMESTAMP WITH TIME ZONE',
      'json': 'JSONB',
      'blob': 'BYTEA'
    };
    return typeMap[genericType] || genericType;
  }

  limitClause(limit: number, offset?: number): string {
    return offset ? `LIMIT ${limit} OFFSET ${offset}` : `LIMIT ${limit}`;
  }

  dateFormat(format: string): string {
    return `TO_CHAR(?, '${format}')`;
  }

  quoteIdentifier(identifier: string): string {
    return `"${identifier}"`;
  }

  concat(...columns: string[]): string {
    return `${columns.join(' || ')}`;
  }

  substring(column: string, start: number, length?: number): string {
    return length 
      ? `SUBSTRING(${column} FROM ${start} FOR ${length})`
      : `SUBSTRING(${column} FROM ${start})`;
  }

  currentTimestamp(): string {
    return 'CURRENT_TIMESTAMP';
  }

  autoIncrement(): string {
    return 'SERIAL';
  }

  createTableSyntax(tableName: string, columns: ColumnDefinition[]): string {
    let columnDefs = columns.map(col => {
      let def = `${this.quoteIdentifier(col.name)} `;
      
      if (col.isAutoIncrement && col.type.toLowerCase().includes('int')) {
        def += col.type.toLowerCase().includes('bigint') ? 'BIGSERIAL' : 'SERIAL';
      } else {
        def += col.type;
      }
      
      if (!col.nullable) {
        def += ' NOT NULL';
      }
      
      if (col.defaultValue !== undefined && !col.isAutoIncrement) {
        def += ` DEFAULT ${typeof col.defaultValue === 'string' ? `'${col.defaultValue}'` : col.defaultValue}`;
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
 * PostgreSQL数据库适配器
 */
export class PostgreSQLAdapter implements DatabaseAdapter {
  private pool: Pool | null = null;
  private dialect: PostgreSQLDialect;
  private config: DatabaseConnection | null = null;

  constructor() {
    this.dialect = new PostgreSQLDialect();
  }

  async connect(config: DatabaseConnection): Promise<void> {
    try {
      this.config = config;
      
      // 创建连接池
      this.pool = new Pool({
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        database: config.database,
        ssl: config.ssl ? { rejectUnauthorized: false } : false,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // 测试连接
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();

      logger.info(`PostgreSQL数据库连接成功: ${config.host}:${config.port}/${config.database}`);
    } catch (error) {
      logger.error('PostgreSQL数据库连接失败:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
      }
      
      logger.info('PostgreSQL数据库连接已关闭');
    } catch (error) {
      logger.error('关闭PostgreSQL数据库连接失败:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.pool) {
        throw new Error('数据库连接池未初始化');
      }

      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      logger.error('PostgreSQL连接测试失败:', error);
      return false;
    }
  }

  async executeQuery(sql: string, params?: any[]): Promise<QueryResult> {
    if (!this.pool) {
      throw new Error('数据库连接池未初始化');
    }

    const startTime = Date.now();
    
    try {
      const client = await this.pool.connect();
      
      try {
        const result = await client.query(sql, params || []);
        const executionTime = Date.now() - startTime;

        client.release();

        // 处理查询结果
        const queryResult: QueryResult = {
          rows: result.rows,
          rowCount: result.rowCount || 0,
          fields: this.mapFields(result.fields),
          executionTime
        };

        logger.info(`PostgreSQL查询执行完成: ${executionTime}ms`);
        return queryResult;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('PostgreSQL查询执行失败:', error);
      throw error;
    }
  }

  async executeTransaction(queries: Array<{ sql: string; params?: any[] }>): Promise<QueryResult[]> {
    if (!this.pool) {
      throw new Error('数据库连接池未初始化');
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const results: QueryResult[] = [];
      
      for (const query of queries) {
        const startTime = Date.now();
        const result = await client.query(query.sql, query.params || []);
        const executionTime = Date.now() - startTime;

        results.push({
          rows: result.rows,
          rowCount: result.rowCount || 0,
          fields: this.mapFields(result.fields),
          executionTime
        });
      }
      
      await client.query('COMMIT');
      client.release();
      
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      logger.error('PostgreSQL事务执行失败:', error);
      throw error;
    }
  }

  async getDatabases(): Promise<string[]> {
    const result = await this.executeQuery(
      'SELECT datname FROM pg_database WHERE datistemplate = false'
    );
    return result.rows.map(row => row.datname);
  }

  async getTables(database?: string): Promise<TableInfo[]> {
    const sql = `
      SELECT 
        t.table_name as name,
        t.table_type as type,
        pg_stat_user_tables.n_tup_ins + pg_stat_user_tables.n_tup_upd + pg_stat_user_tables.n_tup_del as rowCount,
        pg_size_pretty(pg_total_relation_size(c.oid)) as size,
        t.table_schema as schema
      FROM information_schema.tables t
      LEFT JOIN pg_class c ON c.relname = t.table_name
      LEFT JOIN pg_stat_user_tables ON pg_stat_user_tables.relname = t.table_name
      WHERE t.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY t.table_name
    `;

    const result = await this.executeQuery(sql);
    
    return result.rows.map(row => ({
      name: row.name,
      type: row.type === 'BASE TABLE' ? 'table' : 'view',
      rowCount: row.rowCount || 0,
      size: row.size || '0 bytes',
      schema: row.schema
    }));
  }

  async getTableSchema(tableName: string): Promise<ColumnInfo[]> {
    const sql = `
      SELECT 
        c.column_name as name,
        c.data_type as type,
        c.is_nullable as nullable,
        c.column_default as defaultValue,
        c.character_maximum_length as maxLength,
        c.numeric_precision as precision,
        c.numeric_scale as scale,
        col_description(pgc.oid, c.ordinal_position) as comment,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as isPrimaryKey,
        CASE WHEN c.column_default LIKE 'nextval%' THEN true ELSE false END as isAutoIncrement
      FROM information_schema.columns c
      LEFT JOIN pg_class pgc ON pgc.relname = c.table_name
      LEFT JOIN (
        SELECT ku.table_name, ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku
          ON tc.constraint_type = 'PRIMARY KEY' 
          AND tc.constraint_name = ku.constraint_name
      ) pk ON pk.table_name = c.table_name AND pk.column_name = c.column_name
      WHERE c.table_name = $1
      ORDER BY c.ordinal_position
    `;

    const result = await this.executeQuery(sql, [tableName]);
    
    return result.rows.map(row => ({
      name: row.name,
      type: row.type,
      nullable: row.nullable === 'YES',
      defaultValue: row.defaultValue,
      isPrimaryKey: row.isPrimaryKey,
      isAutoIncrement: row.isAutoIncrement,
      maxLength: row.maxLength,
      precision: row.precision,
      scale: row.scale,
      comment: row.comment
    }));
  }

  async getIndexes(tableName: string): Promise<IndexInfo[]> {
    const sql = `
      SELECT 
        i.relname as name,
        a.attname as columnName,
        ix.indisunique as isUnique,
        ix.indisprimary as isPrimary,
        am.amname as type
      FROM pg_class i
      JOIN pg_index ix ON i.oid = ix.indexrelid
      JOIN pg_class t ON ix.indrelid = t.oid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      JOIN pg_am am ON i.relam = am.oid
      WHERE t.relname = $1
      ORDER BY i.relname, a.attnum
    `;

    const result = await this.executeQuery(sql, [tableName]);
    
    // 按索引名分组
    const indexMap = new Map<string, IndexInfo>();
    
    result.rows.forEach(row => {
      const indexName = row.name;
      
      if (!indexMap.has(indexName)) {
        indexMap.set(indexName, {
          name: indexName,
          columns: [],
          isUnique: row.isUnique,
          isPrimary: row.isPrimary,
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
    const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
    
    const sql = `INSERT INTO ${this.dialect.quoteIdentifier(tableName)} 
                 (${columns.map(col => this.dialect.quoteIdentifier(col)).join(', ')}) 
                 VALUES (${placeholders}) RETURNING *`;
    
    return this.executeQuery(sql, values);
  }

  async update(tableName: string, data: Record<string, any>, where: Record<string, any>): Promise<QueryResult> {
    const dataKeys = Object.keys(data);
    const whereKeys = Object.keys(where);
    
    const setClause = dataKeys
      .map((key, index) => `${this.dialect.quoteIdentifier(key)} = $${index + 1}`)
      .join(', ');
    
    const whereClause = whereKeys
      .map((key, index) => `${this.dialect.quoteIdentifier(key)} = $${dataKeys.length + index + 1}`)
      .join(' AND ');
    
    const sql = `UPDATE ${this.dialect.quoteIdentifier(tableName)} 
                 SET ${setClause} 
                 WHERE ${whereClause} RETURNING *`;
    
    const params = [...Object.values(data), ...Object.values(where)];
    
    return this.executeQuery(sql, params);
  }

  async delete(tableName: string, where: Record<string, any>): Promise<QueryResult> {
    const whereKeys = Object.keys(where);
    
    const whereClause = whereKeys
      .map((key, index) => `${this.dialect.quoteIdentifier(key)} = $${index + 1}`)
      .join(' AND ');
    
    const sql = `DELETE FROM ${this.dialect.quoteIdentifier(tableName)} 
                 WHERE ${whereClause} RETURNING *`;
    
    return this.executeQuery(sql, Object.values(where));
  }

  async explainQuery(sql: string): Promise<any> {
    const result = await this.executeQuery(`EXPLAIN (FORMAT JSON, ANALYZE) ${sql}`);
    return result.rows[0] ? result.rows[0]['QUERY PLAN'] : null;
  }

  async getQueryStats(): Promise<any> {
    const result = await this.executeQuery(`
      SELECT 
        schemaname,
        tablename,
        seq_scan,
        seq_tup_read,
        idx_scan,
        idx_tup_fetch,
        n_tup_ins,
        n_tup_upd,
        n_tup_del
      FROM pg_stat_user_tables
    `);
    return result.rows;
  }

  private mapFields(fields: any[]): FieldInfo[] {
    return fields.map(field => ({
      name: field.name,
      type: field.dataTypeID,
      length: field.dataTypeSize
    }));
  }
}