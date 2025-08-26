import type { DatabaseAdapter } from './interfaces';
import type { DatabaseConnection, DatabaseType } from '../types';
import { PostgreSQLAdapter } from './PostgreSQLAdapter';
import { MongoDBAdapter } from './MongoDBAdapter';
import { logger } from '../utils/logger';

/**
 * 数据库适配器工厂 - 支持多连接管理
 */
export class AdapterFactory {
  private static adapters = new Map<string, DatabaseAdapter>();
  private static connectionMetrics = new Map<string, {
    createdAt: Date;
    lastUsed: Date;
    queryCount: number;
    errorCount: number;
  }>();

  /**
   * 创建数据库适配器 - 支持PostgreSQL和MongoDB
   */
  static createAdapter(type: DatabaseType): DatabaseAdapter {
    switch (type) {
      case 'postgresql':
        return new PostgreSQLAdapter();
      
      case 'mongodb':
        return new MongoDBAdapter();
      
      default:
        throw new Error(`不支持的数据库类型: ${type}。当前仅支持PostgreSQL和MongoDB`);
    }
  }

  /**
   * 获取或创建数据库连接适配器
   */
  static async getAdapter(connection: DatabaseConnection): Promise<DatabaseAdapter> {
    const key = `${connection.type}_${connection.id}`;
    
    if (this.adapters.has(key)) {
      const adapter = this.adapters.get(key)!;
      
      // 更新使用统计
      this.updateConnectionMetrics(key, 'used');
      
      // 测试连接是否有效
      const isConnected = await adapter.testConnection();
      if (isConnected) {
        return adapter;
      } else {
        // 连接失效，移除并重新创建
        this.adapters.delete(key);
        this.connectionMetrics.delete(key);
      }
    }

    // 创建新的适配器
    const adapter = this.createAdapter(connection.type);
    
    try {
      await adapter.connect(connection);
      this.adapters.set(key, adapter);
      
      // 初始化连接指标
      this.connectionMetrics.set(key, {
        createdAt: new Date(),
        lastUsed: new Date(),
        queryCount: 0,
        errorCount: 0
      });
      
      logger.info(`数据库适配器创建成功: ${connection.type} - ${connection.name}`);
      return adapter;
    } catch (error) {
      this.updateConnectionMetrics(key, 'error');
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
    return ['postgresql', 'mongodb'];
  }

  /**
   * 获取数据库类型的默认端口
   */
  static getDefaultPort(type: DatabaseType): number {
    const defaultPorts: Record<DatabaseType, number> = {
      'postgresql': 5432,
      'mongodb': 27017
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
    
    // 验证DSN连接字符串
    if (!connection.dsn?.trim()) {
      errors.push('DSN连接字符串不能为空');
    } else {
      // 基本DSN格式验证
      try {
        const url = new URL(connection.dsn);
        if (!url.hostname) {
          errors.push('DSN中缺少主机地址');
        }
        if (!url.pathname || url.pathname === '/') {
          errors.push('DSN中缺少数据库名称');
        }
      } catch (error) {
        errors.push('DSN格式无效');
      }
    }
    
    return errors;
  }

  // ===========================================
  // 多连接管理增强功能
  // ===========================================

  /**
   * 更新连接指标
   */
  private static updateConnectionMetrics(key: string, action: 'used' | 'query' | 'error'): void {
    const metrics = this.connectionMetrics.get(key);
    if (metrics) {
      switch (action) {
        case 'used':
          metrics.lastUsed = new Date();
          break;
        case 'query':
          metrics.queryCount++;
          metrics.lastUsed = new Date();
          break;
        case 'error':
          metrics.errorCount++;
          break;
      }
    }
  }

  /**
   * 获取所有连接的详细状态
   */
  static async getDetailedConnectionStatus(): Promise<Array<{
    key: string;
    connected: boolean;
    metrics: {
      createdAt: Date;
      lastUsed: Date;
      queryCount: number;
      errorCount: number;
      uptime: string;
    };
  }>> {
    const status: Array<any> = [];
    
    for (const [key, adapter] of this.adapters.entries()) {
      const metrics = this.connectionMetrics.get(key);
      const connected = await adapter.testConnection().catch(() => false);
      
      if (metrics) {
        const uptime = this.formatUptime(Date.now() - metrics.createdAt.getTime());
        
        status.push({
          key,
          connected,
          metrics: {
            createdAt: metrics.createdAt,
            lastUsed: metrics.lastUsed,
            queryCount: metrics.queryCount,
            errorCount: metrics.errorCount,
            uptime
          }
        });
      }
    }
    
    return status;
  }

  /**
   * 获取连接池统计信息
   */
  static getPoolStatistics(): {
    totalConnections: number;
    activeConnections: number;
    connectionsByType: Record<string, number>;
    totalQueries: number;
    totalErrors: number;
  } {
    const stats = {
      totalConnections: this.adapters.size,
      activeConnections: 0,
      connectionsByType: {} as Record<string, number>,
      totalQueries: 0,
      totalErrors: 0
    };

    for (const [key, _] of this.adapters.entries()) {
      const [type] = key.split('_');
      if (type) {
        stats.connectionsByType[type] = (stats.connectionsByType[type] || 0) + 1;
      }
      
      const metrics = this.connectionMetrics.get(key);
      if (metrics) {
        stats.totalQueries += metrics.queryCount;
        stats.totalErrors += metrics.errorCount;
        
        // 如果最近5分钟内有活动，认为是活跃连接
        if (Date.now() - metrics.lastUsed.getTime() < 5 * 60 * 1000) {
          stats.activeConnections++;
        }
      }
    }

    return stats;
  }

  /**
   * 清理空闲连接
   */
  static async cleanupIdleConnections(idleTimeoutMs: number = 30 * 60 * 1000): Promise<number> {
    const now = Date.now();
    const keysToRemove: string[] = [];
    
    for (const [key, metrics] of this.connectionMetrics.entries()) {
      if (now - metrics.lastUsed.getTime() > idleTimeoutMs) {
        keysToRemove.push(key);
      }
    }

    // 断开空闲连接
    for (const key of keysToRemove) {
      try {
        const adapter = this.adapters.get(key);
        if (adapter) {
          await adapter.disconnect();
        }
        this.adapters.delete(key);
        this.connectionMetrics.delete(key);
        logger.info(`清理空闲连接: ${key}`);
      } catch (error) {
        logger.error(`清理连接失败: ${key}`, error);
      }
    }

    return keysToRemove.length;
  }

  /**
   * 按类型获取适配器列表
   */
  static getAdaptersByType(type: 'postgresql' | 'mongodb'): string[] {
    const keys: string[] = [];
    for (const [key, _] of this.adapters.entries()) {
      if (key.startsWith(type)) {
        keys.push(key);
      }
    }
    return keys;
  }

  /**
   * 记录查询执行
   */
  static recordQuery(connectionId: string, type: 'postgresql' | 'mongodb'): void {
    const key = `${type}_${connectionId}`;
    this.updateConnectionMetrics(key, 'query');
  }

  /**
   * 记录查询错误
   */
  static recordError(connectionId: string, type: 'postgresql' | 'mongodb'): void {
    const key = `${type}_${connectionId}`;
    this.updateConnectionMetrics(key, 'error');
  }

  /**
   * 格式化运行时间
   */
  private static formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}