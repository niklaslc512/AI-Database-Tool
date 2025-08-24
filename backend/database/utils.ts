import * as path from 'path';
import * as fs from 'fs';
import { open, Database } from 'sqlite';
import * as sqlite3 from 'sqlite3';
import { logger } from '../src/utils/logger';

/**
 * 数据库工具类
 */
export class DatabaseUtils {
  /**
   * 创建数据库连接
   */
  static async createConnection(dbPath?: string): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
    const finalDbPath = dbPath || process.env.DATABASE_URL?.replace('sqlite:', '') || path.join(__dirname, '..', 'data', 'ai-database.db');
    const dbDir = path.dirname(finalDbPath);
    
    // 确保数据库目录存在
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const db = await open({
      filename: finalDbPath,
      driver: sqlite3.Database
    });

    // 启用外键约束
    await db.exec('PRAGMA foreign_keys = ON');
    
    // 设置WAL模式提高并发性能
    await db.exec('PRAGMA journal_mode = WAL');
    
    // 设置其他优化
    await db.exec('PRAGMA synchronous = NORMAL');
    await db.exec('PRAGMA cache_size = 10000');
    await db.exec('PRAGMA temp_store = memory');

    logger.info(`数据库连接成功: ${finalDbPath}`);
    return db;
  }

  /**
   * 执行迁移文件
   */
  static async runMigrations(db: Database<sqlite3.Database, sqlite3.Statement>, migrationsDir?: string): Promise<void> {
    const migrationPath = migrationsDir || path.join(__dirname, 'migrations');
    
    if (!fs.existsSync(migrationPath)) {
      logger.warn('迁移目录不存在，跳过迁移');
      return;
    }

    const migrationFiles = fs.readdirSync(migrationPath)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      try {
        const filePath = path.join(migrationPath, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        // 执行SQL语句
        const statements = sql.split(';').filter(stmt => stmt.trim());
        for (const statement of statements) {
          if (statement.trim()) {
            await db.exec(statement);
          }
        }
        
        logger.info(`迁移文件执行成功: ${file}`);
      } catch (error) {
        logger.error(`迁移文件执行失败 ${file}:`, error);
        throw error;
      }
    }

    logger.info('数据库迁移完成');
  }

  /**
   * 备份数据库
   */
  static async backupDatabase(sourcePath: string, backupPath: string): Promise<void> {
    try {
      if (!fs.existsSync(sourcePath)) {
        throw new Error(`源数据库文件不存在: ${sourcePath}`);
      }

      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      fs.copyFileSync(sourcePath, backupPath);
      logger.info(`数据库备份成功: ${backupPath}`);
    } catch (error) {
      logger.error('数据库备份失败:', error);
      throw error;
    }
  }

  /**
   * 检查数据库健康状态
   */
  static async checkDatabaseHealth(db: Database<sqlite3.Database, sqlite3.Statement>): Promise<boolean> {
    try {
      // 检查数据库完整性
      const integrityResult = await db.get('PRAGMA integrity_check');
      if (integrityResult && integrityResult['integrity_check'] !== 'ok') {
        logger.error('数据库完整性检查失败:', integrityResult);
        return false;
      }

      // 检查基本表是否存在
      const tables = await db.all(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN ('users', 'database_connections', 'api_keys')
      `);

      if (tables.length < 3) {
        logger.error('缺少必要的数据库表');
        return false;
      }

      logger.info('数据库健康检查通过');
      return true;
    } catch (error) {
      logger.error('数据库健康检查失败:', error);
      return false;
    }
  }

  /**
   * 获取数据库统计信息
   */
  static async getDatabaseStats(db: Database<sqlite3.Database, sqlite3.Statement>): Promise<Record<string, any>> {
    try {
      const stats: Record<string, any> = {};

      // 获取表信息
      const tables = await db.all(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `);

      stats.tableCount = tables.length;
      stats.tables = {};

      // 获取每个表的行数
      for (const table of tables) {
        const countResult = await db.get(`SELECT COUNT(*) as count FROM "${table.name}"`);
        stats.tables[table.name] = countResult?.count || 0;
      }

      // 获取数据库大小
      const sizeResult = await db.get('PRAGMA page_count');
      const pageSizeResult = await db.get('PRAGMA page_size');
      if (sizeResult && pageSizeResult) {
        stats.sizeBytes = sizeResult.page_count * pageSizeResult.page_size;
        stats.sizeKB = Math.round(stats.sizeBytes / 1024);
        stats.sizeMB = Math.round(stats.sizeKB / 1024);
      }

      return stats;
    } catch (error) {
      logger.error('获取数据库统计信息失败:', error);
      throw error;
    }
  }
}