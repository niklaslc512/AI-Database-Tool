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
    
    // 初始化数据库表
    await this.initializeTables();

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
   * 初始化数据库表
   */
  private async initializeTables(): Promise<void> {
    if (!this.db) {
      throw new Error('数据库未连接');
    }

    try {
      // 用户表
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          salt TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',        -- admin|user|readonly|guest
          status TEXT NOT NULL DEFAULT 'active',    -- active|inactive|locked
          display_name TEXT,
          avatar_url TEXT,
          settings TEXT,                            -- JSON格式用户设置
          last_login_at DATETIME,
          login_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 数据库连接表
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS database_connections (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          host TEXT NOT NULL,
          port INTEGER NOT NULL,
          database_name TEXT NOT NULL,
          username TEXT NOT NULL,
          password TEXT NOT NULL,
          ssl BOOLEAN DEFAULT 0,
          connection_string TEXT,
          metadata TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // 查询历史表
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS query_history (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          connection_id TEXT NOT NULL,
          natural_query TEXT,
          sql_query TEXT NOT NULL,
          execution_time INTEGER,
          result_count INTEGER,
          success BOOLEAN NOT NULL,
          error_message TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (connection_id) REFERENCES database_connections (id) ON DELETE CASCADE
        )
      `);

      // AI配置表
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS ai_configs (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          provider TEXT NOT NULL DEFAULT 'openai',
          api_key TEXT NOT NULL,
          model TEXT NOT NULL,
          max_tokens INTEGER DEFAULT 2048,
          temperature REAL DEFAULT 0.1,
          base_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // 创建索引
      await this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
        CREATE INDEX IF NOT EXISTS idx_connections_user_id ON database_connections (user_id);
        CREATE INDEX IF NOT EXISTS idx_query_history_user_id ON query_history (user_id);
        CREATE INDEX IF NOT EXISTS idx_query_history_connection_id ON query_history (connection_id);
        CREATE INDEX IF NOT EXISTS idx_query_history_created_at ON query_history (created_at);
      `);

      // 创建更新时间触发器
      await this.db.exec(`
        CREATE TRIGGER IF NOT EXISTS update_users_updated_at
          AFTER UPDATE ON users
          FOR EACH ROW
          BEGIN
            UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
          END;
      `);

      await this.db.exec(`
        CREATE TRIGGER IF NOT EXISTS update_connections_updated_at
          AFTER UPDATE ON database_connections
          FOR EACH ROW
          BEGIN
            UPDATE database_connections SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
          END;
      `);

      await this.db.exec(`
        CREATE TRIGGER IF NOT EXISTS update_ai_configs_updated_at
          AFTER UPDATE ON ai_configs
          FOR EACH ROW
          BEGIN
            UPDATE ai_configs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
          END;
      `);

      logger.info('数据库表初始化完成');

    } catch (error) {
      logger.error('数据库表初始化失败:', error);
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

