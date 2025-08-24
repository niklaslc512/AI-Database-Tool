"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseUtils = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const sqlite_1 = require("sqlite");
const sqlite3 = __importStar(require("sqlite3"));
const logger_1 = require("../src/utils/logger");
class DatabaseUtils {
    static async createConnection(dbPath) {
        const finalDbPath = dbPath || process.env.DATABASE_URL?.replace('sqlite:', '') || path.join(__dirname, '..', 'data', 'ai-database.db');
        const dbDir = path.dirname(finalDbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        const db = await (0, sqlite_1.open)({
            filename: finalDbPath,
            driver: sqlite3.Database
        });
        await db.exec('PRAGMA foreign_keys = ON');
        await db.exec('PRAGMA journal_mode = WAL');
        await db.exec('PRAGMA synchronous = NORMAL');
        await db.exec('PRAGMA cache_size = 10000');
        await db.exec('PRAGMA temp_store = memory');
        logger_1.logger.info(`数据库连接成功: ${finalDbPath}`);
        return db;
    }
    static async runMigrations(db, migrationsDir) {
        const migrationPath = migrationsDir || path.join(__dirname, 'migrations');
        if (!fs.existsSync(migrationPath)) {
            logger_1.logger.warn('迁移目录不存在，跳过迁移');
            return;
        }
        const migrationFiles = fs.readdirSync(migrationPath)
            .filter(file => file.endsWith('.sql'))
            .sort();
        for (const file of migrationFiles) {
            try {
                const filePath = path.join(migrationPath, file);
                const sql = fs.readFileSync(filePath, 'utf8');
                const statements = sql.split(';').filter(stmt => stmt.trim());
                for (const statement of statements) {
                    if (statement.trim()) {
                        await db.exec(statement);
                    }
                }
                logger_1.logger.info(`迁移文件执行成功: ${file}`);
            }
            catch (error) {
                logger_1.logger.error(`迁移文件执行失败 ${file}:`, error);
                throw error;
            }
        }
        logger_1.logger.info('数据库迁移完成');
    }
    static async backupDatabase(sourcePath, backupPath) {
        try {
            if (!fs.existsSync(sourcePath)) {
                throw new Error(`源数据库文件不存在: ${sourcePath}`);
            }
            const backupDir = path.dirname(backupPath);
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }
            fs.copyFileSync(sourcePath, backupPath);
            logger_1.logger.info(`数据库备份成功: ${backupPath}`);
        }
        catch (error) {
            logger_1.logger.error('数据库备份失败:', error);
            throw error;
        }
    }
    static async checkDatabaseHealth(db) {
        try {
            const integrityResult = await db.get('PRAGMA integrity_check');
            if (integrityResult && integrityResult['integrity_check'] !== 'ok') {
                logger_1.logger.error('数据库完整性检查失败:', integrityResult);
                return false;
            }
            const tables = await db.all(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN ('users', 'database_connections', 'api_keys')
      `);
            if (tables.length < 3) {
                logger_1.logger.error('缺少必要的数据库表');
                return false;
            }
            logger_1.logger.info('数据库健康检查通过');
            return true;
        }
        catch (error) {
            logger_1.logger.error('数据库健康检查失败:', error);
            return false;
        }
    }
    static async getDatabaseStats(db) {
        try {
            const stats = {};
            const tables = await db.all(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `);
            stats.tableCount = tables.length;
            stats.tables = {};
            for (const table of tables) {
                const countResult = await db.get(`SELECT COUNT(*) as count FROM "${table.name}"`);
                stats.tables[table.name] = countResult?.count || 0;
            }
            const sizeResult = await db.get('PRAGMA page_count');
            const pageSizeResult = await db.get('PRAGMA page_size');
            if (sizeResult && pageSizeResult) {
                stats.sizeBytes = sizeResult.page_count * pageSizeResult.page_size;
                stats.sizeKB = Math.round(stats.sizeBytes / 1024);
                stats.sizeMB = Math.round(stats.sizeKB / 1024);
            }
            return stats;
        }
        catch (error) {
            logger_1.logger.error('获取数据库统计信息失败:', error);
            throw error;
        }
    }
}
exports.DatabaseUtils = DatabaseUtils;
//# sourceMappingURL=utils.js.map