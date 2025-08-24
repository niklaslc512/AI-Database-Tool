import type { DatabaseAdapter } from './interfaces';
import type { DatabaseConnection, DatabaseType } from '../types';
import { MySQLAdapter } from './MySQLAdapter';
import { PostgreSQLAdapter } from './PostgreSQLAdapter';
import { SQLiteAdapter } from './SQLiteAdapter';
import { MongoDBAdapter } from './MongoDBAdapter';
import { logger } from '../utils/logger';

/**
 * 数据库适配器工厂
 */
export class AdapterFactory {
  private static adapters = new Map<string, DatabaseAdapter>();

  /**
   * 创建数据库适配器
   */
  static createAdapter(type: DatabaseType): DatabaseAdapter {
    switch (type) {
      case 'mysql':
        return new MySQLAdapter();
      
      case 'postgresql':
        return new PostgreSQLAdapter();
      
      case 'mongodb':
        return new MongoDBAdapter();
      
      case 'sqlite':
        return new SQLiteAdapter();
      
      // TODO: 实现其他数据库适配器
      case 'redis':
        throw new Error('Redis适配器尚未实现');
      
      case 'oracle':
        throw new Error('Oracle适配器尚未实现');
      
      case 'sqlserver':
        throw new Error('SQL Server适配器尚未实现');
      
      default:
        throw new Error(`不支持的数据库类型: ${type}`);
    }
  }

  /**
   * 获取或创建数据库连接适配器
   */
  static async getAdapter(connection: DatabaseConnection): Promise<DatabaseAdapter> {
    const key = `${connection.type}_${connection.id}`;
    
    if (this.adapters.has(key)) {
      const adapter = this.adapters.get(key)!;
      
      // 测试连接是否有效
      const isConnected = await adapter.testConnection();
      if (isConnected) {
        return adapter;
      } else {
        // 连接失效，移除并重新创建
        this.adapters.delete(key);
      }
    }

    // 创建新的适配器
    const adapter = this.createAdapter(connection.type);
    
    try {
      await adapter.connect(connection);
      this.adapters.set(key, adapter);
      logger.info(`数据库适配器创建成功: ${connection.type} - ${connection.name}`);
      return adapter;
    } catch (error) {
      logger.error(`数据库适配器创建失败: ${connection.type} - ${connection.name}`, error);
      throw error;
    }
  }

  /**
   * 移除数据库连接适配器
   */
  static async removeAdapter(connectionId: string): Promise<void> {
    const keysToRemove: string[] = [];
    
    for (const [key, adapter] of this.adapters.entries()) {
      if (key.includes(connectionId)) {
        try {
          await adapter.disconnect();
          keysToRemove.push(key);
        } catch (error) {
          logger.error(`断开数据库连接失败: ${key}`, error);
        }
      }
    }
    
    keysToRemove.forEach(key => this.adapters.delete(key));
    logger.info(`移除数据库适配器: ${connectionId}`);
  }

  /**
   * 移除所有数据库连接适配器
   */
  static async removeAllAdapters(): Promise<void> {
    const disconnectPromises: Promise<void>[] = [];
    
    for (const [key, adapter] of this.adapters.entries()) {
      disconnectPromises.push(
        adapter.disconnect().catch(error => {
          logger.error(`断开数据库连接失败: ${key}`, error);
        })
      );
    }
    
    await Promise.all(disconnectPromises);
    this.adapters.clear();
    logger.info('所有数据库适配器已移除');
  }

  /**
   * 获取所有活跃的连接
   */
  static getActiveConnections(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * 获取连接状态
   */
  static async getConnectionStatus(): Promise<Array<{ key: string; connected: boolean }>> {
    const status: Array<{ key: string; connected: boolean }> = [];
    
    for (const [key, adapter] of this.adapters.entries()) {
      try {
        const connected = await adapter.testConnection();
        status.push({ key, connected });
      } catch (error) {
        status.push({ key, connected: false });
      }
    }
    
    return status;
  }

  /**
   * 测试数据库连接（不保存适配器）
   */
  static async testConnection(connection: DatabaseConnection): Promise<boolean> {
    const adapter = this.createAdapter(connection.type);
    
    try {
      await adapter.connect(connection);
      const isConnected = await adapter.testConnection();
      await adapter.disconnect();
      return isConnected;
    } catch (error) {
      logger.error(`测试数据库连接失败: ${connection.type} - ${connection.name}`, error);
      try {
        await adapter.disconnect();
      } catch {
        // 忽略断开连接时的错误
      }
      return false;
    }
  }

  /**
   * 获取支持的数据库类型
   */
  static getSupportedDatabaseTypes(): DatabaseType[] {
    return ['mysql', 'postgresql', 'sqlite', 'mongodb'];
    // TODO: 添加其他支持的数据库类型
    // return ['mysql', 'postgresql', 'sqlite', 'mongodb', 'redis', 'oracle', 'sqlserver'];
  }

  /**
   * 获取数据库类型的默认端口
   */
  static getDefaultPort(type: DatabaseType): number {
    const defaultPorts: Record<DatabaseType, number> = {
      'mysql': 3306,
      'postgresql': 5432,
      'sqlite': 0, // SQLite不使用端口
      'mongodb': 27017,
      'redis': 6379,
      'oracle': 1521,
      'sqlserver': 1433
    };
    
    return defaultPorts[type] || 0;
  }

  /**
   * 验证连接配置
   */
  static validateConnectionConfig(connection: DatabaseConnection): string[] {
    const errors: string[] = [];
    
    if (!connection.name?.trim()) {
      errors.push('连接名称不能为空');
    }
    
    if (!connection.type) {
      errors.push('数据库类型不能为空');
    }
    
    if (!this.getSupportedDatabaseTypes().includes(connection.type)) {
      errors.push(`不支持的数据库类型: ${connection.type}`);
    }
    
    if (connection.type !== 'sqlite') {
      if (!connection.host?.trim()) {
        errors.push('主机地址不能为空');
      }
      
      if (!connection.port || connection.port <= 0 || connection.port > 65535) {
        errors.push('端口号必须在1-65535之间');
      }
      
      if (!connection.username?.trim()) {
        errors.push('用户名不能为空');
      }
    }
    
    if (connection.type === 'sqlite') {
      if (!connection.database?.trim()) {
        errors.push('数据库文件路径不能为空');
      }
    } else {
      if (!connection.database?.trim()) {
        errors.push('数据库名称不能为空');
      }
    }
    
    return errors;
  }
}