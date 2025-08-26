import { MongoClient, Db, Collection } from 'mongodb';
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
 * MongoDB查询语言方言实现（适配SQL风格的接口）
 */
export class MongoDBDialect implements SQLDialect {
  mapDataType(genericType: string): string {
    // MongoDB是无模式的，这些类型主要用于模拟和建议
    const typeMap: Record<string, string> = {
      'string': 'String',
      'text': 'String',
      'integer': 'Number',
      'bigint': 'Long',
      'decimal': 'Decimal128',
      'float': 'Double',
      'double': 'Double',
      'boolean': 'Boolean',
      'date': 'Date',
      'datetime': 'Date',
      'timestamp': 'Timestamp',
      'json': 'Object',
      'blob': 'BinData'
    };
    return typeMap[genericType] || 'Mixed';
  }

  limitClause(limit: number, offset?: number): string {
    // MongoDB使用limit()和skip()方法
    return offset ? `.skip(${offset}).limit(${limit})` : `.limit(${limit})`;
  }

  dateFormat(format: string): string {
    // MongoDB日期格式化
    return `$dateToString: { format: "${format}", date: "$field" }`;
  }

  quoteIdentifier(identifier: string): string {
    // MongoDB字段名通常不需要引号，除非包含特殊字符
    return identifier.includes(' ') || identifier.includes('.') ? `"${identifier}"` : identifier;
  }

  concat(...columns: string[]): string {
    // MongoDB字符串连接
    return `$concat: [${columns.map(col => `"$${col}"`).join(', ')}]`;
  }

  substring(column: string, start: number, length?: number): string {
    // MongoDB字符串截取
    return length 
      ? `$substr: ["$${column}", ${start}, ${length}]`
      : `$substr: ["$${column}", ${start}, -1]`;
  }

  currentTimestamp(): string {
    return '$now';
  }

  autoIncrement(): string {
    // MongoDB使用ObjectId或自定义序列
    return 'ObjectId';
  }

  createTableSyntax(tableName: string, columns: ColumnDefinition[]): string {
    // MongoDB创建集合的JSON Schema验证规则
    const schema = {
      $jsonSchema: {
        bsonType: 'object',
        required: columns.filter(col => !col.nullable).map(col => col.name),
        properties: columns.reduce((props, col) => {
          props[col.name] = {
            bsonType: this.mapBSONType(col.type),
            description: col.comment || `${col.name} field`
          };
          return props;
        }, {} as any)
      }
    };

    return `db.createCollection("${tableName}", {
      validator: ${JSON.stringify(schema, null, 2)}
    })`;
  }

  private mapBSONType(type: string): string {
    const typeMap: Record<string, string> = {
      'String': 'string',
      'Number': 'number',
      'Long': 'long',
      'Double': 'double',
      'Boolean': 'bool',
      'Date': 'date',
      'Object': 'object',
      'Array': 'array'
    };
    return typeMap[type] || 'string';
  }
}

/**
 * MongoDB数据库适配器
 */
export class MongoDBAdapter implements DatabaseAdapter {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private dialect: MongoDBDialect;
  private config: DatabaseConnection | null = null;

  constructor() {
    this.dialect = new MongoDBDialect();
  }

  async connect(config: DatabaseConnection): Promise<void> {
    try {
      this.config = config;
      
      // 使用DSN连接字符串
      const connectionString = config.dsn;
      if (!connectionString) {
        throw new Error('MongoDB连接需要DSN连接字符串');
      }

      // 解析DSN获取连接信息用于日志
      const url = new URL(connectionString);
      const dbName = url.pathname.slice(1) || 'default';
      
      // 创建MongoDB客户端
      this.client = new MongoClient(connectionString, {
        maxPoolSize: 10,
        minPoolSize: 2,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
      });

      // 连接到MongoDB
      await this.client.connect();
      
      // 选择数据库
      this.db = this.client.db(dbName);
      
      // 测试连接
      await this.db.admin().ping();

      logger.info(`MongoDB数据库连接成功: ${url.host}/${dbName}`);
    } catch (error) {
      logger.error('MongoDB数据库连接失败:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
        this.db = null;
      }
      
      logger.info('MongoDB数据库连接已关闭');
    } catch (error) {
      logger.error('关闭MongoDB数据库连接失败:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.db) {
        throw new Error('数据库连接未初始化');
      }

      await this.db.admin().ping();
      return true;
    } catch (error) {
      logger.error('MongoDB连接测试失败:', error);
      return false;
    }
  }

  async executeQuery(sql: string, params?: any[]): Promise<QueryResult> {
    if (!this.db) {
      throw new Error('数据库连接未初始化');
    }

    const startTime = Date.now();
    
    try {
      // 将SQL风格的查询转换为MongoDB查询
      const mongoQuery = this.convertSQLToMongo(sql, params);
      const result = await this.executeMongoQuery(mongoQuery);
      
      const executionTime = Date.now() - startTime;

      const queryResult: QueryResult = {
        rows: result.documents || [],
        rowCount: result.documents?.length || result.modifiedCount || result.deletedCount || 0,
        fields: this.generateFields(result.documents),
        executionTime,
        affectedRows: result.modifiedCount || result.deletedCount,
        insertId: result.insertedId
      };

      logger.info(`MongoDB查询执行完成: ${executionTime}ms`);
      return queryResult;
    } catch (error) {
      logger.error('MongoDB查询执行失败:', error);
      throw error;
    }
  }

  async executeTransaction(queries: Array<{ sql: string; params?: any[] }>): Promise<QueryResult[]> {
    if (!this.client || !this.db) {
      throw new Error('数据库连接未初始化');
    }

    const session = this.client.startSession();
    
    try {
      const results: QueryResult[] = [];
      
      await session.withTransaction(async () => {
        for (const query of queries) {
          const mongoQuery = this.convertSQLToMongo(query.sql, query.params);
          const result = await this.executeMongoQuery(mongoQuery, session);
          
          results.push({
            rows: result.documents || [],
            rowCount: result.documents?.length || result.modifiedCount || result.deletedCount || 0,
            fields: this.generateFields(result.documents),
            executionTime: 0, // 在事务中不单独计时
            affectedRows: result.modifiedCount || result.deletedCount,
            insertId: result.insertedId
          });
        }
      });
      
      return results;
    } catch (error) {
      logger.error('MongoDB事务执行失败:', error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async getDatabases(): Promise<string[]> {
    if (!this.client) {
      throw new Error('数据库连接未初始化');
    }

    try {
      const adminDb = this.client.db().admin();
      const result = await adminDb.listDatabases();
      return result.databases.map((db: any) => db.name);
    } catch (error) {
      logger.error('获取MongoDB数据库列表失败:', error);
      throw error;
    }
  }

  async getTables(database?: string): Promise<TableInfo[]> {
    const targetDb = database ? this.client!.db(database) : this.db;
    if (!targetDb) {
      throw new Error('数据库连接未初始化');
    }

    try {
      const collections = await targetDb.listCollections().toArray();
      
      const tables: TableInfo[] = [];
      
      for (const collection of collections) {
        // 获取集合统计信息
        let stats: any = {};
        try {
          // 注意：collection.stats() 已被弃用，使用 collStats 命令
          const collStats = await targetDb.command({ collStats: collection.name });
          stats = collStats || {};
        } catch {
          // 某些集合可能无法获取统计信息
        }

        tables.push({
          name: collection.name,
          type: collection.type === 'view' ? 'view' : 'collection',
          rowCount: stats.count || 0,
          size: stats.size ? `${Math.round(stats.size / 1024)}KB` : '0KB',
          comment: (collection as any).options?.comment || ''
        });
      }

      return tables;
    } catch (error) {
      logger.error('获取MongoDB集合列表失败:', error);
      throw error;
    }
  }

  async getTableSchema(tableName: string): Promise<ColumnInfo[]> {
    if (!this.db) {
      throw new Error('数据库连接未初始化');
    }

    try {
      const collection = this.db.collection(tableName);
      
      // 获取集合的一些文档来推断模式
      const sampleDocs = await collection.find({}).limit(100).toArray();
      
      if (sampleDocs.length === 0) {
        return [];
      }

      // 分析字段结构
      const fieldMap = new Map<string, {
        types: Set<string>;
        hasNull: boolean;
        isId: boolean;
      }>();

      sampleDocs.forEach((doc: any) => {
        Object.entries(doc).forEach(([key, value]) => {
          if (!fieldMap.has(key)) {
            fieldMap.set(key, {
              types: new Set(),
              hasNull: false,
              isId: key === '_id'
            });
          }

          const field = fieldMap.get(key)!;
          
          if (value === null || value === undefined) {
            field.hasNull = true;
          } else {
            field.types.add(this.getMongoType(value));
          }
        });
      });

      // 转换为ColumnInfo格式
      const columns: ColumnInfo[] = [];
      
      fieldMap.forEach((field, name) => {
        const primaryType = field.types.size > 0 
          ? Array.from(field.types)[0] 
          : 'Mixed';

        columns.push({
          name,
          type: primaryType || 'Mixed',
          nullable: field.hasNull,
          isPrimaryKey: field.isId,
          isAutoIncrement: field.isId && primaryType === 'ObjectId',
          comment: field.types.size > 1 ? `Mixed types: ${Array.from(field.types).join(', ')}` : ''
        });
      });

      return columns;
    } catch (error) {
      logger.error('获取MongoDB集合模式失败:', error);
      throw error;
    }
  }

  async getIndexes(tableName: string): Promise<IndexInfo[]> {
    if (!this.db) {
      throw new Error('数据库连接未初始化');
    }

    try {
      const collection = this.db.collection(tableName);
      const indexes = await collection.listIndexes().toArray();
      
      return indexes.map((index: any) => ({
        name: index.name,
        columns: Object.keys(index.key),
        isUnique: !!index.unique,
        isPrimary: index.name === '_id_',
        type: index.background ? 'BACKGROUND' : 'STANDARD'
      }));
    } catch (error) {
      logger.error('获取MongoDB索引信息失败:', error);
      throw error;
    }
  }

  async insert(tableName: string, data: Record<string, any>): Promise<QueryResult> {
    if (!this.db) {
      throw new Error('数据库连接未初始化');
    }

    try {
      const collection = this.db.collection(tableName);
      const result = await collection.insertOne(data);
      
      return {
        rows: [{ _id: result.insertedId, ...data }],
        rowCount: 1,
        fields: this.generateFields([data]),
        executionTime: 0,
        insertId: result.insertedId.toString()
      };
    } catch (error) {
      logger.error('MongoDB插入数据失败:', error);
      throw error;
    }
  }

  async update(tableName: string, data: Record<string, any>, where: Record<string, any>): Promise<QueryResult> {
    if (!this.db) {
      throw new Error('数据库连接未初始化');
    }

    try {
      const collection = this.db.collection(tableName);
      const result = await collection.updateMany(where, { $set: data });
      
      return {
        rows: [],
        rowCount: result.modifiedCount,
        fields: [],
        executionTime: 0,
        affectedRows: result.modifiedCount
      };
    } catch (error) {
      logger.error('MongoDB更新数据失败:', error);
      throw error;
    }
  }

  async delete(tableName: string, where: Record<string, any>): Promise<QueryResult> {
    if (!this.db) {
      throw new Error('数据库连接未初始化');
    }

    try {
      const collection = this.db.collection(tableName);
      const result = await collection.deleteMany(where);
      
      return {
        rows: [],
        rowCount: result.deletedCount,
        fields: [],
        executionTime: 0,
        affectedRows: result.deletedCount
      };
    } catch (error) {
      logger.error('MongoDB删除数据失败:', error);
      throw error;
    }
  }

  async explainQuery(sql: string): Promise<any> {
    // MongoDB查询解释
    try {
      const mongoQuery = this.convertSQLToMongo(sql);
      // 这里需要根据具体的查询类型来执行explain
      return { message: 'MongoDB查询解释功能需要具体实现' };
    } catch (error) {
      logger.error('MongoDB查询解释失败:', error);
      throw error;
    }
  }

  async getQueryStats(): Promise<any> {
    if (!this.db) {
      throw new Error('数据库连接未初始化');
    }

    try {
      const stats = await this.db.stats();
      return {
        collections: stats.collections,
        dataSize: stats.dataSize,
        indexSize: stats.indexSize,
        storageSize: stats.storageSize
      };
    } catch (error) {
      logger.error('获取MongoDB统计信息失败:', error);
      throw error;
    }
  }

  private convertSQLToMongo(sql: string, params?: any[]): any {
    // 这是一个简化的SQL到MongoDB查询转换器
    // 实际实现需要更复杂的SQL解析
    const sqlLower = sql.trim().toLowerCase();
    
    if (sqlLower.startsWith('select')) {
      // 简单的SELECT查询转换
      return {
        operation: 'find',
        collection: this.extractTableName(sql),
        filter: {},
        projection: this.extractProjection(sql)
      };
    } else if (sqlLower.startsWith('insert')) {
      return {
        operation: 'insertOne',
        collection: this.extractTableName(sql),
        document: this.extractInsertData(sql, params)
      };
    } else if (sqlLower.startsWith('update')) {
      return {
        operation: 'updateMany',
        collection: this.extractTableName(sql),
        filter: this.extractWhereClause(sql, params),
        update: this.extractUpdateData(sql, params)
      };
    } else if (sqlLower.startsWith('delete')) {
      return {
        operation: 'deleteMany',
        collection: this.extractTableName(sql),
        filter: this.extractWhereClause(sql, params)
      };
    }
    
    throw new Error(`不支持的SQL查询类型: ${sql}`);
  }

  private async executeMongoQuery(query: any, session?: any): Promise<any> {
    if (!this.db) {
      throw new Error('数据库连接未初始化');
    }

    const collection = this.db.collection(query.collection);
    const options = session ? { session } : {};

    switch (query.operation) {
      case 'find':
        const documents = await collection.find(query.filter, options)
          .project(query.projection)
          .toArray();
        return { documents };

      case 'insertOne':
        const insertResult = await collection.insertOne(query.document, options);
        return { insertedId: insertResult.insertedId };

      case 'updateMany':
        const updateResult = await collection.updateMany(
          query.filter, 
          query.update, 
          options
        );
        return { modifiedCount: updateResult.modifiedCount };

      case 'deleteMany':
        const deleteResult = await collection.deleteMany(query.filter, options);
        return { deletedCount: deleteResult.deletedCount };

      default:
        throw new Error(`不支持的MongoDB操作: ${query.operation}`);
    }
  }

  private extractTableName(sql: string): string {
    // 简化的表名提取
    const match = sql.match(/(?:from|into|update)\s+[\`\"]?(\w+)[\`\"]?/i);
    return match?.[1] || 'unknown';
  }

  private extractProjection(sql: string): any {
    // 简化的投影提取
    return {}; // 返回所有字段
  }

  private extractInsertData(sql: string, params?: any[]): any {
    // 简化的插入数据提取
    return params?.[0] || {};
  }

  private extractWhereClause(sql: string, params?: any[]): any {
    // 简化的WHERE子句提取
    return {};
  }

  private extractUpdateData(sql: string, params?: any[]): any {
    // 简化的更新数据提取
    return { $set: params?.[0] || {} };
  }

  private getMongoType(value: any): string {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'string') return 'String';
    if (typeof value === 'number') return Number.isInteger(value) ? 'Number' : 'Double';
    if (typeof value === 'boolean') return 'Boolean';
    if (value instanceof Date) return 'Date';
    if (Array.isArray(value)) return 'Array';
    if (typeof value === 'object') return 'Object';
    return 'Mixed';
  }

  private generateFields(documents?: any[]): FieldInfo[] {
    if (!documents || documents.length === 0) {
      return [];
    }

    const firstDoc = documents[0];
    return Object.keys(firstDoc).map(key => ({
      name: key,
      type: this.getMongoType(firstDoc[key]),
      length: 0
    }));
  }

  // ===========================================
  // AI语义化操作功能实现
  // ===========================================

  /**
   * 全文搜索功能
   * 使用MongoDB的文本搜索功能
   */
  async fullTextSearch(
    tableName: string, 
    searchText: string, 
    columns?: string[],
    config?: FullTextSearchConfig
  ): Promise<QueryResult> {
    if (!this.db) {
      throw new Error('数据库连接未初始化');
    }

    const collection = this.db.collection(tableName);
    const startTime = Date.now();

    try {
      let query: any;
      
      if (columns && columns.length > 0) {
        // 在指定字段中搜索
        const regexQuery = columns.map(col => ({
          [col]: { $regex: searchText, $options: 'i' }
        }));
        query = { $or: regexQuery };
      } else {
        // 使用MongoDB的全文索引搜索
        query = { $text: { $search: searchText } };
      }

      // 执行搜索，包含相关性分数
      const cursor = collection.find(query);
      
      // 如果使用全文索引，添加分数排序
      if (!columns || columns.length === 0) {
        cursor.project({ score: { $meta: 'textScore' } });
        cursor.sort({ score: { $meta: 'textScore' } });
      }

      const documents = await cursor.toArray();
      const executionTime = Date.now() - startTime;

      return {
        rows: documents.map((doc: any) => ({ ...doc, _id: doc._id.toString() })),
        rowCount: documents.length,
        fields: this.generateFields(documents),
        executionTime
      };
    } catch (error) {
      logger.error('MongoDB全文搜索失败:', error);
      throw error;
    }
  }

  /**
   * 向量相似性搜索
   * 使用MongoDB Atlas Vector Search或自定义向量搜索
   */
  async vectorSearch(
    tableName: string, 
    vectorColumn: string, 
    queryVector: number[], 
    topK: number = 10
  ): Promise<QueryResult> {
    if (!this.db) {
      throw new Error('数据库连接未初始化');
    }

    const collection = this.db.collection(tableName);
    const startTime = Date.now();

    try {
      // MongoDB Atlas Vector Search aggregation pipeline
      const pipeline = [
        {
          $vectorSearch: {
            index: `${tableName}_${vectorColumn}_vector_index`,
            path: vectorColumn,
            queryVector: queryVector,
            numCandidates: topK * 10,
            limit: topK
          }
        },
        {
          $addFields: {
            similarity: { $meta: 'vectorSearchScore' }
          }
        }
      ];

      const documents = await collection.aggregate(pipeline).toArray();
      const executionTime = Date.now() - startTime;

      return {
        rows: documents.map((doc: any) => ({ 
          ...doc, 
          _id: doc._id.toString(),
          similarity: doc.similarity 
        })),
        rowCount: documents.length,
        fields: this.generateFields(documents),
        executionTime
      };
    } catch (error) {
      logger.error('MongoDB向量搜索失败，尝试使用余弦相似度计算:', error);
      
      // fallback: 使用聚合管道计算余弦相似度
      return this.fallbackVectorSearch(tableName, vectorColumn, queryVector, topK);
    }
  }

  /**
   * 获取数据统计信息
   */
  async getDataStatistics(tableName: string, columns?: string[]): Promise<DataStatistics> {
    if (!this.db) {
      throw new Error('数据库连接未初始化');
    }

    const collection = this.db.collection(tableName);
    
    // 获取总行数
    const totalRows = await collection.countDocuments();

    // 获取集合结构
    const sampleDocs = await collection.find({}).limit(1000).toArray();
    const fieldAnalysis = this.analyzeDocumentStructure(sampleDocs);
    
    const targetFields = columns && columns.length > 0 
      ? fieldAnalysis.filter(field => columns.includes(field.name))
      : fieldAnalysis;

    // 为每个字段收集统计信息
    const columnStats: ColumnStatistics[] = [];
    
    for (const field of targetFields) {
      const stats = await this.getMongoColumnStatistics(collection, field);
      columnStats.push(stats);
    }

    return {
      tableName,
      totalRows,
      columns: columnStats
    };
  }

  /**
   * 智能连表查询（MongoDB的聚合查询）
   */
  async intelligentJoin(tables: string[], conditions?: JoinCondition[]): Promise<QueryResult> {
    if (!this.db) {
      throw new Error('数据库连接未初始化');
    }

    if (tables.length < 2) {
      throw new Error('连表查询至少需要2个表');
    }

    const firstTable = tables[0];
    if (!firstTable) {
      throw new Error('表名不能为空');
    }

    const collection = this.db.collection(firstTable);
    const startTime = Date.now();

    try {
      // 构建聚合管道
      const pipeline: any[] = [];

      if (conditions && conditions.length > 0) {
        // 使用提供的连接条件
        for (const condition of conditions) {
          if (condition.rightTable !== tables[0]) {
            pipeline.push({
              $lookup: {
                from: condition.rightTable,
                localField: this.extractFieldFromCondition(condition.onCondition, 'left'),
                foreignField: this.extractFieldFromCondition(condition.onCondition, 'right'),
                as: condition.rightTable
              }
            });
          }
        }
      } else {
        // 自动推断连接条件（基于_id和外键约定）
        for (let i = 1; i < tables.length; i++) {
          const currentTable = tables[i];
          if (firstTable && currentTable) {
            const foreignKey = await this.inferMongoJoinField(firstTable, currentTable);
            pipeline.push({
              $lookup: {
                from: currentTable,
                localField: foreignKey.localField,
                foreignField: foreignKey.foreignField,
                as: currentTable
              }
            });
          }
        }
      }

      const documents = await collection.aggregate(pipeline).toArray();
      const executionTime = Date.now() - startTime;

      return {
        rows: documents.map((doc: any) => ({ ...doc, _id: doc._id.toString() })),
        rowCount: documents.length,
        fields: this.generateFields(documents),
        executionTime
      };
    } catch (error) {
      logger.error('MongoDB智能连表查询失败:', error);
      throw error;
    }
  }

  /**
   * 创建向量索引
   */
  async createVectorIndex(tableName: string, columnName: string, dimensions: number): Promise<void> {
    if (!this.db) {
      throw new Error('数据库连接未初始化');
    }

    const collection = this.db.collection(tableName);
    const indexName = `${tableName}_${columnName}_vector_index`;

    try {
      // MongoDB Atlas Vector Search索引配置
      const indexSpec = {
        name: indexName,
        type: 'vectorSearch',
        definition: {
          fields: [
            {
              type: 'vector',
              path: columnName,
              numDimensions: dimensions,
              similarity: 'cosine'
            }
          ]
        }
      };

      // 注意：实际的向量索引创建需要通过Atlas UI或管理API
      logger.warn('MongoDB向量索引需要通过Atlas Vector Search创建');
      logger.info('建议的索引配置:', JSON.stringify(indexSpec, null, 2));
      
    } catch (error) {
      logger.error('MongoDB向量索引创建失败:', error);
      throw error;
    }
  }

  /**
   * 创建全文搜索索引
   */
  async createFullTextIndex(tableName: string, columns: string[], language: string = 'english'): Promise<void> {
    if (!this.db) {
      throw new Error('数据库连接未初始化');
    }

    const collection = this.db.collection(tableName);
    const indexName = `${tableName}_${columns.join('_')}_text`;

    try {
      // 创建文本索引
      const indexSpec: Record<string, any> = {};
      columns.forEach(column => {
        indexSpec[column] = 'text';
      });

      await collection.createIndex(indexSpec, {
        name: indexName,
        default_language: language,
        language_override: 'language'
      });

      logger.info(`MongoDB全文索引创建成功: ${indexName}`);
    } catch (error) {
      logger.error('MongoDB全文索引创建失败:', error);
      throw error;
    }
  }

  // ===========================================
  // 私有辅助方法
  // ===========================================

  /**
   * 备用向量搜索（使用聚合管道计算余弦相似度）
   */
  private async fallbackVectorSearch(
    tableName: string,
    vectorColumn: string,
    queryVector: number[],
    topK: number
  ): Promise<QueryResult> {
    const collection = this.db!.collection(tableName);
    const startTime = Date.now();

    // 使用聚合管道计算余弦相似度
    const pipeline = [
      {
        $match: {
          [vectorColumn]: { $exists: true, $ne: null }
        }
      },
      {
        $addFields: {
          similarity: {
            $let: {
              vars: {
                dotProduct: {
                  $reduce: {
                    input: { $range: [0, { $size: `$${vectorColumn}` }] },
                    initialValue: 0,
                    in: {
                      $add: [
                        '$$value',
                        {
                          $multiply: [
                            { $arrayElemAt: [`$${vectorColumn}`, '$$this'] },
                            { $arrayElemAt: [queryVector, '$$this'] }
                          ]
                        }
                      ]
                    }
                  }
                },
                vecNorm: {
                  $sqrt: {
                    $reduce: {
                      input: `$${vectorColumn}`,
                      initialValue: 0,
                      in: { $add: ['$$value', { $multiply: ['$$this', '$$this'] }] }
                    }
                  }
                },
                queryNorm: Math.sqrt(queryVector.reduce((sum, val) => sum + val * val, 0))
              },
              in: {
                $divide: [
                  '$$dotProduct',
                  { $multiply: ['$$vecNorm', '$$queryNorm'] }
                ]
              }
            }
          }
        }
      },
      {
        $sort: { similarity: -1 }
      },
      {
        $limit: topK
      }
    ];

    const documents = await collection.aggregate(pipeline).toArray();
    const executionTime = Date.now() - startTime;

    return {
      rows: documents.map(doc => ({ ...doc, _id: doc._id.toString() })),
      rowCount: documents.length,
      fields: this.generateFields(documents),
      executionTime
    };
  }

  /**
   * 分析文档结构
   */
  private analyzeDocumentStructure(documents: any[]): Array<{ name: string; type: string }> {
    const fieldMap = new Map<string, Set<string>>();
    
    documents.forEach(doc => {
      Object.entries(doc).forEach(([key, value]) => {
        if (!fieldMap.has(key)) {
          fieldMap.set(key, new Set());
        }
        fieldMap.get(key)!.add(this.getMongoType(value));
      });
    });

    return Array.from(fieldMap.entries()).map(([name, types]) => ({
      name,
      type: Array.from(types).join(' | ')
    }));
  }

  /**
   * 获取MongoDB字段统计信息
   */
  private async getMongoColumnStatistics(
    collection: Collection,
    field: { name: string; type: string }
  ): Promise<ColumnStatistics> {
    const fieldName = field.name;
    
    // 基础统计
    const pipeline = [
      {
        $group: {
          _id: null,
          nonNullCount: {
            $sum: {
              $cond: [{ $ne: [`$${fieldName}`, null] }, 1, 0]
            }
          },
          uniqueValues: { $addToSet: `$${fieldName}` }
        }
      },
      {
        $project: {
          nonNullCount: 1,
          uniqueCount: { $size: '$uniqueValues' }
        }
      }
    ];

    const [basicStats] = await collection.aggregate(pipeline).toArray();
    
    // 数值类型的额外统计
    let minValue, maxValue, avgValue;
    if (field.type.includes('Number')) {
      const numericPipeline = [
        {
          $match: {
            [fieldName]: { $type: 'number' }
          }
        },
        {
          $group: {
            _id: null,
            min: { $min: `$${fieldName}` },
            max: { $max: `$${fieldName}` },
            avg: { $avg: `$${fieldName}` }
          }
        }
      ];
      
      const [numStats] = await collection.aggregate(numericPipeline).toArray();
      if (numStats) {
        minValue = numStats.min;
        maxValue = numStats.max;
        avgValue = numStats.avg;
      }
    }

    // 最常见的值
    const commonValuesPipeline = [
      {
        $match: {
          [fieldName]: { $ne: null }
        }
      },
      {
        $group: {
          _id: `$${fieldName}`,
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ];

    const commonValues = await collection.aggregate(commonValuesPipeline).toArray();

    return {
      name: fieldName,
      type: field.type,
      nonNullCount: basicStats?.nonNullCount || 0,
      uniqueCount: basicStats?.uniqueCount || 0,
      minValue,
      maxValue,
      avgValue,
      mostCommonValues: commonValues.map((item: any) => ({
        value: item._id,
        count: item.count
      }))
    };
  }

  /**
   * 推断MongoDB连接字段
   */
  private async inferMongoJoinField(leftCollection: string, rightCollection: string): Promise<{ localField: string; foreignField: string }> {
    // MongoDB连接推断逻辑
    // 1. 查找形如 rightCollection + '_id' 的字段
    // 2. 默认使用 '_id' 作为外键
    
    const singularRight = rightCollection.endsWith('s') 
      ? rightCollection.slice(0, -1) 
      : rightCollection;
    
    return {
      localField: `${singularRight}_id`,
      foreignField: '_id'
    };
  }

  /**
   * 从连接条件中提取字段名
   */
  private extractFieldFromCondition(condition: string, side: 'left' | 'right'): string {
    // 简单的条件解析，实际应用中可能需要更复杂的解析
    const parts = condition.split('=').map(part => part.trim());
    if (parts.length === 2) {
      const fieldPart = side === 'left' ? parts[0] : parts[1];
      if (fieldPart && fieldPart.includes('.')) {
        const splitResult = fieldPart.split('.')[1];
        return splitResult || '_id';
      }
      return fieldPart || '_id';
    }
    return '_id'; // 默认值
  }
}