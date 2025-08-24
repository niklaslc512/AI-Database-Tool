/**
 * 增强的日志系统
 * 
 * @description 提供分级日志、emoji标识、中文本地化、按日期分割的完整日志解决方案
 * @author AI数据库团队
 * @version 1.0.0
 * @example
 * ```typescript
 * import { enhancedLogger, BusinessLogger } from './enhancedLogger';
 * 
 * // 基础使用
 * enhancedLogger.info('系统启动成功');
 * 
 * // 业务模块使用
 * const logger = new BusinessLogger('UserService');
 * logger.info('用户登录成功', { userId: 123 });
 * ```
 */

import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import DailyRotateFile from 'winston-daily-rotate-file';

/**
 * 日志级别类型定义
 */
type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

/**
 * 日志级别emoji映射
 */
const EMOJI_MAP: { [key in LogLevel]: string } = {
  error: '❌',
  warn: '⚠️',
  info: 'ℹ️',
  debug: '🔍',
  trace: '📋'
};

/**
 * 自定义日志格式化
 */
const customFormat = winston.format.printf((info) => {
  const emoji = EMOJI_MAP[info.level as LogLevel] || '';
  const module = info.module ? `[${info.module}]` : '';
  const duration = info.duration ? ` (耗时: ${info.duration}ms)` : '';
  const context = info.context ? ` ${JSON.stringify(info.context)}` : '';
  
  return `${info.timestamp} ${emoji} [${info.level.toUpperCase()}] ${module} ${info.message}${duration}${context}`;
});

/**
 * 确保日志目录存在
 */
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * 增强的Winston日志实例
 */
export const enhancedLogger = winston.createLogger({
  levels: { error: 0, warn: 1, info: 2, debug: 3, trace: 4 },
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    customFormat
  ),
  transports: [
    // 错误日志 - 按日期分割
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '10m',      // 单文件最大10MB
      maxFiles: '30d',     // 保留30天
      zippedArchive: true, // 压缩归档
      auditFile: path.join(logsDir, 'error-audit.json')
    }),
    
    // 警告日志 - 按日期分割
    new DailyRotateFile({
      filename: path.join(logsDir, 'warn-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'warn',
      maxSize: '10m',
      maxFiles: '15d',
      zippedArchive: true,
      auditFile: path.join(logsDir, 'warn-audit.json')
    }),
    
    // 完整日志 - 按日期分割
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',      // 单文件最大20MB
      maxFiles: '15d',     // 保留15天
      zippedArchive: true,
      auditFile: path.join(logsDir, 'combined-audit.json')
    }),
    
    // 应用日志 - 按日期和小时分割（高频日志）
    new DailyRotateFile({
      filename: path.join(logsDir, 'app-%DATE%-%HOUR%.log'),
      datePattern: 'YYYY-MM-DD-HH',
      level: 'info',
      maxSize: '50m',
      maxFiles: '7d',
      zippedArchive: true,
      auditFile: path.join(logsDir, 'app-audit.json')
    })
  ]
});

// 开发环境添加控制台输出
if (process.env.NODE_ENV !== 'production') {
  enhancedLogger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      customFormat
    )
  }));
  
  // 开发环境调试日志 - 按日期分割
  enhancedLogger.add(new DailyRotateFile({
    filename: path.join(logsDir, 'debug-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'debug',
    maxSize: '10m',
    maxFiles: '3d',
    zippedArchive: false, // 调试日志不压缩，便于查看
    auditFile: path.join(logsDir, 'debug-audit.json')
  }));
}

// 监听日志轮转事件
enhancedLogger.on('rotate', (oldFilename: string, newFilename: string) => {
  console.log(`📁 日志文件轮转: ${oldFilename} -> ${newFilename}`);
});

// 监听日志归档事件
enhancedLogger.on('archive', (zipFilename: string) => {
  console.log(`🗜️ 日志文件已归档: ${zipFilename}`);
});

// 监听日志清理事件
enhancedLogger.on('logRemoved', (removedFilename: string) => {
  console.log(`🗑️ 过期日志已清理: ${removedFilename}`);
});

/**
 * 业务模块专用日志记录器
 * 
 * @description 为特定业务模块提供专用的日志记录功能，支持性能统计、用户行为追踪等
 * @example
 * ```typescript
 * const logger = new BusinessLogger('UserService');
 * logger.info('用户登录成功', { userId: 123 });
 * logger.performance('查询用户信息', startTime);
 * ```
 */
export class BusinessLogger {
  /**
   * 创建业务日志记录器实例
   * 
   * @param module - 业务模块名称
   */
  constructor(private module: string) {}

  /**
   * 记录错误日志
   * 
   * @param message - 错误消息
   * @param error - 错误对象（可选）
   * @param context - 上下文信息（可选）
   */
  error(message: string, error?: Error, context?: any): void {
    enhancedLogger.error(message, { 
      module: this.module, 
      error: error?.message,
      stack: error?.stack,
      context 
    });
  }

  /**
   * 记录警告日志
   * 
   * @param message - 警告消息
   * @param context - 上下文信息（可选）
   */
  warn(message: string, context?: any): void {
    enhancedLogger.warn(message, { module: this.module, context });
  }

  /**
   * 记录信息日志
   * 
   * @param message - 信息消息
   * @param context - 上下文信息（可选）
   */
  info(message: string, context?: any): void {
    enhancedLogger.info(message, { module: this.module, context });
  }

  /**
   * 记录调试日志
   * 
   * @param message - 调试消息
   * @param context - 上下文信息（可选）
   */
  debug(message: string, context?: any): void {
    enhancedLogger.debug(message, { module: this.module, context });
  }

  /**
   * 记录跟踪日志
   * 
   * @param message - 跟踪消息
   * @param context - 上下文信息（可选）
   */
  trace(message: string, context?: any): void {
    enhancedLogger.log('trace', message, { module: this.module, context });
  }

  /**
   * 记录性能统计日志
   * 
   * @param operation - 操作名称
   * @param startTime - 开始时间戳
   * @param context - 上下文信息（可选）
   */
  performance(operation: string, startTime: number, context?: any): void {
    const duration = Date.now() - startTime;
    enhancedLogger.info(`📊 性能统计: ${operation}`, { 
      module: this.module, 
      duration,
      context
    });
  }

  /**
   * 记录用户操作日志
   * 
   * @param userId - 用户ID
   * @param action - 操作动作
   * @param details - 操作详情（可选）
   */
  userAction(userId: string, action: string, details?: any): void {
    enhancedLogger.info(`👤 用户操作: ${action}`, {
      module: this.module,
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 记录数据库操作日志
   * 
   * @param operation - 操作类型
   * @param table - 表名
   * @param duration - 执行耗时
   * @param context - 上下文信息（可选）
   */
  dbOperation(operation: string, table: string, duration: number, context?: any): void {
    enhancedLogger.info(`💾 数据库操作: ${operation}`, {
      module: this.module,
      operation,
      table,
      duration,
      context
    });
  }

  /**
   * 记录API请求日志
   * 
   * @param method - HTTP方法
   * @param url - 请求URL
   * @param statusCode - 状态码
   * @param duration - 请求耗时
   * @param context - 上下文信息（可选）
   */
  apiRequest(method: string, url: string, statusCode: number, duration: number, context?: any): void {
    const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';
    enhancedLogger[level](`🌐 API请求: ${method} ${url}`, {
      module: this.module,
      method,
      url,
      statusCode,
      duration,
      context
    });
  }

  /**
   * 记录安全事件日志
   * 
   * @param event - 安全事件名称
   * @param severity - 严重程度
   * @param context - 上下文信息（可选）
   */
  securityEvent(event: string, severity: 'low' | 'medium' | 'high', context?: any): void {
    const level = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
    enhancedLogger[level](`🔒 安全事件: ${event}`, {
      module: this.module,
      event,
      severity,
      context,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * 日志管理工具类
 * 
 * @description 提供日志文件管理、清理、统计等实用功能
 */
export class LogManager {
  /**
   * 获取日志文件列表
   * 
   * @returns Promise<string[]> 日志文件名数组
   */
  static async getLogFiles(): Promise<string[]> {
    const fs = require('fs').promises;
    const logsDir = path.join(process.cwd(), 'logs');
    
    try {
      const files = await fs.readdir(logsDir);
      return files.filter((file: string) => file.endsWith('.log') || file.endsWith('.log.gz'));
    } catch (error) {
      enhancedLogger.error('获取日志文件列表失败', error as Error);
      return [];
    }
  }

  /**
   * 清理过期日志
   * 
   * @param daysToKeep - 保留天数（默认30天）
   */
  static async cleanupLogs(daysToKeep: number = 30): Promise<void> {
    const fs = require('fs').promises;
    const logsDir = path.join(process.cwd(), 'logs');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    try {
      const files = await fs.readdir(logsDir);
      
      for (const file of files) {
        if (file.endsWith('.log') || file.endsWith('.log.gz')) {
          const filePath = path.join(logsDir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            enhancedLogger.info(`🗑️ 清理过期日志: ${file}`);
          }
        }
      }
    } catch (error) {
      enhancedLogger.error('清理日志失败', error as Error);
    }
  }

  /**
   * 获取日志统计信息
   * 
   * @returns Promise<any> 日志统计数据
   */
  static async getLogStats(): Promise<any> {
    const fs = require('fs').promises;
    const logsDir = path.join(process.cwd(), 'logs');
    
    try {
      const files = await fs.readdir(logsDir);
      let totalSize = 0;
      let fileCount = 0;
      
      for (const file of files) {
        if (file.endsWith('.log') || file.endsWith('.log.gz')) {
          const filePath = path.join(logsDir, file);
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
          fileCount++;
        }
      }
      
      return {
        fileCount,
        totalSize: Math.round(totalSize / 1024 / 1024 * 100) / 100, // MB
        oldestFile: files.length > 0 ? files.sort()[0] : null,
        newestFile: files.length > 0 ? files.sort().reverse()[0] : null
      };
    } catch (error) {
      enhancedLogger.error('获取日志统计失败', error as Error);
      return { fileCount: 0, totalSize: 0, oldestFile: null, newestFile: null };
    }
  }
}

// 导出配置好的日志实例
export { enhancedLogger as logger };
export default enhancedLogger;