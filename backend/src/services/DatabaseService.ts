import { AdapterFactory } from '../adapters/AdapterFactory';
import type { DatabaseAdapter } from '../adapters/interfaces';
import type { 
  DatabaseConnection, 
  QueryResult, 
  TableInfo, 
  ColumnInfo, 
  IndexInfo,
  DatabaseType 
} from '../types';
import { logger } from '../utils/logger';
import { databaseManager } from '../config/database';
import { BaseService } from './BaseService';

/**
 * 数据库服务类
 */
export class DatabaseService extends BaseService {
  /**
   * 获取数据库适配器
   */
  private static async getAdapter(connectionId: string): Promise<DatabaseAdapter> {
    const db = await databaseManager.getDatabase();
    
    const connection = await db.get(
      'SELECT * FROM database_connections WHERE id = ?',
      [connectionId]
    );
    
    if (!connection) {
      throw new Error(`数据库连接不存在: ${connectionId}`);
    }

    // 转换数据库记录为连接配置
    const config: DatabaseConnection = {
      id: connection.id,
      name: connection.name,
      type: connection.type as DatabaseType,
      host: connection.host,
      port: connection.port,
      database: connection.database_name,
      username: connection.username,
      password: connection.password, // 实际应用中应该解密
      ssl: !!connection.ssl,
      connectionString: connection.connection_string,
      metadata: connection.metadata ? JSON.parse(connection.metadata) : undefined,
      createdAt: connection.created_at,
      updatedAt: connection.updated_at
    };

    return AdapterFactory.getAdapter(config);
  }

  /**
   * 测试数据库连接
   */
  static async testConnection(connection: Omit<DatabaseConnection, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      const config: DatabaseConnection = {
        ...connection,
        id: 'test',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return await AdapterFactory.testConnection(config);
    } catch (error) {
      logger.error('测试数据库连接失败:', error);
      return false;
    }
  }

  /**
   * 创建数据库连接
   */
  static async createConnection(
    userId: string, 
    connection: Omit<DatabaseConnection, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DatabaseConnection> {
    // 验证连接配置
    const tempConfig: DatabaseConnection = {
      ...connection,
      id: 'temp',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const errors = AdapterFactory.validateConnectionConfig(tempConfig);
    if (errors.length > 0) {
      throw new Error(`连接配置验证失败: ${errors.join(', ')}`);
    }

    // 测试连接
    const isValid = await this.testConnection(connection);
    if (!isValid) {
      throw new Error('数据库连接测试失败');
    }

    // 生成连接ID
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // 保存连接配置
      const dbService = new DatabaseService();
      await dbService.executeRun(`
        INSERT INTO database_connections (
          id, user_id, name, type, host, port, database_name, 
          username, password, ssl, connection_string, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        connectionId,
        userId,
        connection.name,
        connection.type,
        connection.host,
        connection.port,
        connection.database,
        connection.username,
        connection.password, // 实际应用中应该加密
        connection.ssl ? 1 : 0,
        connection.connectionString,
        connection.metadata ? JSON.stringify(connection.metadata) : null
      ]);

      logger.info(`数据库连接创建成功: ${connection.name} (${connectionId})`);

      return {
        ...connection,
        id: connectionId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      logger.error('保存数据库连接失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户的数据库连接列表
   */
  static async getUserConnections(userId: string): Promise<DatabaseConnection[]> {
    const dbService = new DatabaseService();
    
    const connections = await dbService.executeAll(
      'SELECT * FROM database_connections WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    return connections.map(conn => ({
      id: conn.id,
      name: conn.name,
      type: conn.type as DatabaseType,
      host: conn.host,
      port: conn.port,
      database: conn.database_name,
      username: conn.username,
      password: '***', // 不返回密码
      ssl: !!conn.ssl,
      connectionString: conn.connection_string,
      metadata: conn.metadata ? JSON.parse(conn.metadata) : undefined,
      createdAt: new Date(conn.created_at),
      updatedAt: new Date(conn.updated_at)
    }));
  }

  /**
   * 删除数据库连接
   */
  static async deleteConnection(userId: string, connectionId: string): Promise<void> {
    const dbService = new DatabaseService();
    
    const result = await dbService.executeRun(
      'DELETE FROM database_connections WHERE id = ? AND user_id = ?',
      [connectionId, userId]
    );

    if (result.changes === 0) {
      throw new Error('数据库连接不存在或无权限删除');
    }

    // 移除缓存的适配器
    await AdapterFactory.removeAdapter(connectionId);
    
    logger.info(`数据库连接删除成功: ${connectionId}`);
  }

  /**
   * 执行SQL查询
   */
  static async executeQuery(connectionId: string, sql: string, params?: any[]): Promise<QueryResult> {
    try {
      const adapter = await this.getAdapter(connectionId);
      return await adapter.executeQuery(sql, params);
    } catch (error) {
      logger.error(`查询执行失败 [${connectionId}]:`, error);
      throw error;
    }
  }

  /**
   * 执行事务
   */
  static async executeTransaction(
    connectionId: string, 
    queries: Array<{ sql: string; params?: any[] }>
  ): Promise<QueryResult[]> {
    try {
      const adapter = await this.getAdapter(connectionId);
      return await adapter.executeTransaction(queries);
    } catch (error) {
      logger.error(`事务执行失败 [${connectionId}]:`, error);
      throw error;
    }
  }

  /**
   * 获取数据库列表
   */
  static async getDatabases(connectionId: string): Promise<string[]> {
    try {
      const adapter = await this.getAdapter(connectionId);
      return await adapter.getDatabases();
    } catch (error) {
      logger.error(`获取数据库列表失败 [${connectionId}]:`, error);
      throw error;
    }
  }

  /**
   * 获取表列表
   */
  static async getTables(connectionId: string, database?: string): Promise<TableInfo[]> {
    try {
      const adapter = await this.getAdapter(connectionId);
      return await adapter.getTables(database);
    } catch (error) {
      logger.error(`获取表列表失败 [${connectionId}]:`, error);
      throw error;
    }
  }

  /**
   * 获取表结构
   */
  static async getTableSchema(connectionId: string, tableName: string): Promise<ColumnInfo[]> {
    try {
      const adapter = await this.getAdapter(connectionId);
      return await adapter.getTableSchema(tableName);
    } catch (error) {
      logger.error(`获取表结构失败 [${connectionId}]:`, error);
      throw error;
    }
  }

  /**
   * 获取索引信息
   */
  static async getIndexes(connectionId: string, tableName: string): Promise<IndexInfo[]> {
    try {
      const adapter = await this.getAdapter(connectionId);
      return await adapter.getIndexes(tableName);
    } catch (error) {
      logger.error(`获取索引信息失败 [${connectionId}]:`, error);
      throw error;
    }
  }

  /**
   * 插入数据
   */
  static async insertData(
    connectionId: string, 
    tableName: string, 
    data: Record<string, any>
  ): Promise<QueryResult> {
    try {
      const adapter = await this.getAdapter(connectionId);
      return await adapter.insert(tableName, data);
    } catch (error) {
      logger.error(`插入数据失败 [${connectionId}]:`, error);
      throw error;
    }
  }

  /**
   * 更新数据
   */
  static async updateData(
    connectionId: string, 
    tableName: string, 
    data: Record<string, any>,
    where: Record<string, any>
  ): Promise<QueryResult> {
    try {
      const adapter = await this.getAdapter(connectionId);
      return await adapter.update(tableName, data, where);
    } catch (error) {
      logger.error(`更新数据失败 [${connectionId}]:`, error);
      throw error;
    }
  }

  /**
   * 删除数据
   */
  static async deleteData(
    connectionId: string, 
    tableName: string, 
    where: Record<string, any>
  ): Promise<QueryResult> {
    try {
      const adapter = await this.getAdapter(connectionId);
      return await adapter.delete(tableName, where);
    } catch (error) {
      logger.error(`删除数据失败 [${connectionId}]:`, error);
      throw error;
    }
  }

  /**
   * 解释查询执行计划
   */
  static async explainQuery(connectionId: string, sql: string): Promise<any> {
    try {
      const adapter = await this.getAdapter(connectionId);
      return await adapter.explainQuery(sql);
    } catch (error) {
      logger.error(`解释查询失败 [${connectionId}]:`, error);
      throw error;
    }
  }

  /**
   * 获取查询统计信息
   */
  static async getQueryStats(connectionId: string): Promise<any> {
    try {
      const adapter = await this.getAdapter(connectionId);
      return await adapter.getQueryStats();
    } catch (error) {
      logger.error(`获取查询统计失败 [${connectionId}]:`, error);
      throw error;
    }
  }

  /**
   * 获取支持的数据库类型
   */
  static getSupportedDatabaseTypes(): DatabaseType[] {
    return AdapterFactory.getSupportedDatabaseTypes();
  }

  /**
   * 获取数据库类型的默认端口
   */
  static getDefaultPort(type: DatabaseType): number {
    return AdapterFactory.getDefaultPort(type);
  }

  /**
   * 清理所有连接
   */
  static async cleanup(): Promise<void> {
    await AdapterFactory.removeAllAdapters();
  }
}