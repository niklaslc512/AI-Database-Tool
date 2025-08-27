// 数据库配置接口
export interface DatabaseConfig {
  path?: string;
}

// 数据库管理器 - 单例模式实现
import * as sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import * as path from 'path';
import { logger } from '../utils/logger';

class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Database<sqlite3.Database, sqlite3.Statement> | null = null;
  private isInitialized = false;
  
  private constructor() {}
  
  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }
  
  async initialize(config?: DatabaseConfig): Promise<void> {
    if (this.isInitialized) return;
    
    const dbPath = config?.path || process.env.DATABASE_URL || './data/ai-database.db';
    const dbDir = path.dirname(dbPath);
    
    // 创建数据库目录
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
    
    // 初始化数据库连接
    await this.initializeDatabase();

    this.isInitialized = true;
    logger.info(`数据库初始化成功: ${dbPath}`);
  }
  
  async getDatabase(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
    if (!this.db) {
      await this.initialize();
    }
    return this.db!;
  }
  
  isConnected(): boolean {
    return this.db !== null && this.isInitialized;
  }
  
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isInitialized = false;
      logger.info('数据库连接已关闭');
    }
  }
  
  /**
   * 初始化数据库连接
   * 注意：数据库表结构由迁移文件管理，这里不再创建表
   */
  private async initializeDatabase(): Promise<void> {
    if (!this.db) {
      throw new Error('数据库未连接');
    }

    try {
      // 检查数据库连接是否正常
      await this.db.get('SELECT 1');
      logger.info('数据库连接验证成功');
    } catch (error) {
      logger.error('数据库连接验证失败:', error);
      throw error;
    }
  }
}

// 导出DatabaseManager单例实例
export const databaseManager = DatabaseManager.getInstance();

/**
 * 连接数据库
 */
export async function connectDatabase(): Promise<void> {
  await databaseManager.initialize();
}

/**
 * 获取数据库实例
 */
export async function getDatabase(): Promise<any> {
  return databaseManager.getDatabase();
}

/**
 * 关闭数据库连接
 */
export async function closeDatabase(): Promise<void> {
  await databaseManager.close();
}

