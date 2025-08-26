import { Pool, Client } from 'pg';
import type { 
  DatabaseAdapter, 
  SQLDialect, 
  ColumnDefinition,
  DataStatistics,
  ColumnStatistics,
  JoinCondition,
  VectorSearchResult,
  FullTextSearchConfig
} from './interfaces';
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
  private connectionInfo: { host: string; port: number; database: string } | null = null;

  constructor() {
    this.dialect = new PostgreSQLDialect();
  }

  async connect(config: DatabaseConnection): Promise<void> {
    try {
      this.config = config;
      
      // 从DSN解析连接参数
      const url = new URL(config.dsn);
      const connectionConfig = {
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        database: url.pathname.slice(1), // 移除开头的 '/'
        user: url.username,
        password: url.password,
        ssl: url.searchParams.get('ssl') === 'true'
      };
      
      // 保存解析后的连接信息用于日志
      this.connectionInfo = {
        host: connectionConfig.host,
        port: connectionConfig.port,
        database: connectionConfig.database
      };
      
      // 创建连接池
      this.pool = new Pool({
        host: connectionConfig.host,
        port: connectionConfig.port,
        user: connectionConfig.user,
        password: connectionConfig.password,
        database: connectionConfig.database,
        ssl: connectionConfig.ssl ? { rejectUnauthorized: false } : false,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // 测试连接
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();

      logger.info(`PostgreSQL数据库连接成功: ${this.connectionInfo?.host}:${this.connectionInfo?.port}/${this.connectionInfo?.database}`);
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

  // ===========================================
  // AI语义化操作功能实现
  // ===========================================

  /**
   * 全文搜索功能
   * 使用PostgreSQL的全文搜索功能
   */
  async fullTextSearch(
    tableName: string, 
    searchText: string, 
    columns?: string[],
    config?: FullTextSearchConfig
  ): Promise<QueryResult> {
    if (!this.pool) {
      throw new Error('数据库连接池未初始化');
    }

    const searchColumns = columns && columns.length > 0 ? columns : ['*'];
    const language = config?.language || 'english';
    
    // 使用PostgreSQL的全文搜索
    let sql: string;
    let params: any[];

    if (columns && columns.length > 0) {
      // 指定列的全文搜索
      const tsVectorExpression = columns.map(col => 
        `to_tsvector('${language}', COALESCE(${this.dialect.quoteIdentifier(col)}, ''))`
      ).join(' || ');
      
      sql = `
        SELECT *, 
               ts_rank((${tsVectorExpression}), plainto_tsquery('${language}', $1)) as relevance_score
        FROM ${this.dialect.quoteIdentifier(tableName)}
        WHERE (${tsVectorExpression}) @@ plainto_tsquery('${language}', $1)
        ORDER BY relevance_score DESC
      `;
      params = [searchText];
    } else {
      // 全表搜索（需要先创建全文索引）
      sql = `
        SELECT *
        FROM ${this.dialect.quoteIdentifier(tableName)}
        WHERE to_tsvector('${language}', ${this.dialect.quoteIdentifier(tableName)}::text) @@ plainto_tsquery('${language}', $1)
      `;
      params = [searchText];
    }

    try {
      return await this.executeQuery(sql, params);
    } catch (error) {
      logger.error('PostgreSQL全文搜索失败:', error);
      throw error;
    }
  }

  /**
   * 向量相似性搜索
   * 使用pgvector扩展
   */
  async vectorSearch(
    tableName: string, 
    vectorColumn: string, 
    queryVector: number[], 
    topK: number = 10
  ): Promise<QueryResult> {
    if (!this.pool) {
      throw new Error('数据库连接池未初始化');
    }

    // 检查pgvector扩展是否安装
    await this.ensurePgVectorExtension();

    const sql = `
      SELECT *,
             ${this.dialect.quoteIdentifier(vectorColumn)} <-> $1::vector as distance,
             1 - (${this.dialect.quoteIdentifier(vectorColumn)} <-> $1::vector) as similarity
      FROM ${this.dialect.quoteIdentifier(tableName)}
      ORDER BY ${this.dialect.quoteIdentifier(vectorColumn)} <-> $1::vector
      LIMIT $2
    `;

    const vectorString = `[${queryVector.join(',')}]`;
    
    try {
      return await this.executeQuery(sql, [vectorString, topK]);
    } catch (error) {
      logger.error('PostgreSQL向量搜索失败:', error);
      throw error;
    }
  }

  /**
   * 获取数据统计信息
   */
  async getDataStatistics(tableName: string, columns?: string[]): Promise<DataStatistics> {
    if (!this.pool) {
      throw new Error('数据库连接池未初始化');
    }

    // 获取总行数
    const countResult = await this.executeQuery(
      `SELECT COUNT(*) as total_rows FROM ${this.dialect.quoteIdentifier(tableName)}`
    );
    const totalRows = parseInt(countResult.rows[0]?.total_rows || '0');

    // 获取表结构
    const schema = await this.getTableSchema(tableName);
    const targetColumns = columns && columns.length > 0 
      ? schema.filter(col => columns.includes(col.name))
      : schema;

    // 为每列收集统计信息
    const columnStats: ColumnStatistics[] = [];
    
    for (const column of targetColumns) {
      const stats = await this.getColumnStatistics(tableName, column);
      columnStats.push(stats);
    }

    return {
      tableName,
      totalRows,
      columns: columnStats
    };
  }

  /**
   * 智能连表查询
   */
  async intelligentJoin(tables: string[], conditions?: JoinCondition[]): Promise<QueryResult> {
    if (!this.pool) {
      throw new Error('数据库连接池未初始化');
    }

    if (tables.length < 2) {
      throw new Error('连表查询至少需要2个表');
    }

    if (tables.length === 0) {
      throw new Error('表列表不能为空');
    }

    const firstTable = tables[0];
    if (!firstTable) {
      throw new Error('第一个表名不能为空');
    }

    let sql = `SELECT * FROM ${this.dialect.quoteIdentifier(firstTable)}`;
    
    if (conditions && conditions.length > 0) {
      // 使用提供的连接条件
      for (const condition of conditions) {
        sql += ` ${condition.joinType} JOIN ${this.dialect.quoteIdentifier(condition.rightTable)} ON ${condition.onCondition}`;
      }
    } else {
      // 智能推断连接条件（基于外键关系）
      for (let i = 1; i < tables.length; i++) {
        const currentTable = tables[i];
        if (currentTable) {
          const joinCondition = await this.inferJoinCondition(firstTable, currentTable);
          sql += ` LEFT JOIN ${this.dialect.quoteIdentifier(currentTable)} ON ${joinCondition}`;
        }
      }
    }

    return await this.executeQuery(sql);
  }

  /**
   * 创建向量索引
   */
  async createVectorIndex(tableName: string, columnName: string, dimensions: number): Promise<void> {
    if (!this.pool) {
      throw new Error('数据库连接池未初始化');
    }

    await this.ensurePgVectorExtension();

    const indexName = `idx_${tableName}_${columnName}_vector`;
    const sql = `
      CREATE INDEX IF NOT EXISTS ${this.dialect.quoteIdentifier(indexName)}
      ON ${this.dialect.quoteIdentifier(tableName)}
      USING ivfflat (${this.dialect.quoteIdentifier(columnName)} vector_cosine_ops)
      WITH (lists = 100)
    `;

    await this.executeQuery(sql);
    logger.info(`向量索引创建成功: ${indexName}`);
  }

  /**
   * 创建全文搜索索引
   */
  async createFullTextIndex(tableName: string, columns: string[], language: string = 'english'): Promise<void> {
    if (!this.pool) {
      throw new Error('数据库连接池未初始化');
    }

    const indexName = `idx_${tableName}_${columns.join('_')}_fts`;
    const tsVectorExpression = columns.map(col => 
      `to_tsvector('${language}', COALESCE(${this.dialect.quoteIdentifier(col)}, ''))`
    ).join(' || ');
    
    const sql = `
      CREATE INDEX IF NOT EXISTS ${this.dialect.quoteIdentifier(indexName)}
      ON ${this.dialect.quoteIdentifier(tableName)}
      USING GIN ((${tsVectorExpression}))
    `;

    await this.executeQuery(sql);
    logger.info(`全文搜索索引创建成功: ${indexName}`);
  }

  // ===========================================
  // 私有辅助方法
  // ===========================================

  /**
   * 确保pgvector扩展已安装
   */
  private async ensurePgVectorExtension(): Promise<void> {
    try {
      await this.executeQuery('CREATE EXTENSION IF NOT EXISTS vector');
    } catch (error) {
      throw new Error('pgvector扩展未安装。请先安装pgvector扩展以支持向量搜索功能。');
    }
  }

  /**
   * 获取单列统计信息
   */
  private async getColumnStatistics(tableName: string, column: ColumnInfo): Promise<ColumnStatistics> {
    const columnName = this.dialect.quoteIdentifier(column.name);
    const tableNameQuoted = this.dialect.quoteIdentifier(tableName);
    
    let sql: string;
    let params: any[] = [];
    
    if (column.type.toLowerCase().includes('int') || column.type.toLowerCase().includes('numeric') || column.type.toLowerCase().includes('float')) {
      // 数值类型统计
      sql = `
        SELECT 
          COUNT(${columnName}) as non_null_count,
          COUNT(DISTINCT ${columnName}) as unique_count,
          MIN(${columnName}) as min_value,
          MAX(${columnName}) as max_value,
          AVG(${columnName}::numeric) as avg_value
        FROM ${tableNameQuoted}
        WHERE ${columnName} IS NOT NULL
      `;
    } else {
      // 文本类型统计
      sql = `
        SELECT 
          COUNT(${columnName}) as non_null_count,
          COUNT(DISTINCT ${columnName}) as unique_count,
          MIN(${columnName}) as min_value,
          MAX(${columnName}) as max_value
        FROM ${tableNameQuoted}
        WHERE ${columnName} IS NOT NULL
      `;
    }

    const result = await this.executeQuery(sql, params);
    const stats = result.rows[0];
    if (!stats) {
      throw new Error(`无法获取列 ${column.name} 的统计信息`);
    }

    // 获取最常见的值
    const commonValuesResult = await this.executeQuery(`
      SELECT ${columnName} as value, COUNT(*) as count
      FROM ${tableNameQuoted}
      WHERE ${columnName} IS NOT NULL
      GROUP BY ${columnName}
      ORDER BY COUNT(*) DESC
      LIMIT 5
    `);

    return {
      name: column.name,
      type: column.type,
      nonNullCount: parseInt(stats?.non_null_count) || 0,
      uniqueCount: parseInt(stats?.unique_count) || 0,
      minValue: stats?.min_value,
      maxValue: stats?.max_value,
      avgValue: stats?.avg_value ? parseFloat(stats.avg_value) : undefined,
      mostCommonValues: commonValuesResult.rows.map(row => ({
        value: row.value,
        count: parseInt(row.count)
      }))
    };
  }

  /**
   * 智能推断连接条件
   */
  private async inferJoinCondition(leftTable: string, rightTable: string): Promise<string> {
    // 查询外键关系
    const sql = `
      SELECT 
        kcu.column_name as left_column,
        ccu.column_name as right_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = $1
        AND ccu.table_name = $2
      LIMIT 1
    `;

    const result = await this.executeQuery(sql, [leftTable, rightTable]);
    
    if (result.rows.length > 0 && result.rows[0]) {
      const leftCol = this.dialect.quoteIdentifier(`${leftTable}.${result.rows[0].left_column}`);
      const rightCol = this.dialect.quoteIdentifier(`${rightTable}.${result.rows[0].right_column}`);
      return `${leftCol} = ${rightCol}`;
    }

    // 如果没找到外键，尝试通过命名约定推断（如user_id -> users.id）
    const leftSchema = await this.getTableSchema(leftTable);
    const rightSchema = await this.getTableSchema(rightTable);
    
    for (const leftCol of leftSchema) {
      for (const rightCol of rightSchema) {
        if (leftCol.name.endsWith('_id') && rightCol.isPrimaryKey) {
          const expectedName = `${rightTable.slice(0, -1)}_id`; // users -> user_id
          if (leftCol.name === expectedName) {
            return `${this.dialect.quoteIdentifier(`${leftTable}.${leftCol.name}`)} = ${this.dialect.quoteIdentifier(`${rightTable}.${rightCol.name}`)}`;
          }
        }
      }
    }

    // 默认连接条件（可能需要用户手动指定）
    return '1=1'; // 这会产生笛卡尔积，实际使用中应该避免
  }
}