/**
 * 前端日志系统
 * 
 * @description 提供前端分级日志、emoji标识、中文本地化的完整日志解决方案
 * @author AI数据库团队
 * @version 1.0.0
 * @example
 * ```typescript
 * import { frontendLogger, useLogger } from './logger';
 * 
 * // 基础使用
 * frontendLogger.info('App', '应用启动成功');
 * 
 * // Vue组件使用
 * const logger = useLogger('LoginPage');
 * logger.info('用户登录成功', { userId: 123 });
 * ```
 */

/**
 * 日志级别类型定义
 */
type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

/**
 * 日志上下文接口
 */
interface LogContext {
  [key: string]: any;
}

/**
 * 日志配置接口
 */
interface LoggerConfig {
  level: LogLevel;
  enableStorage: boolean;
  maxStorageEntries: number;
  enableRemoteLogging: boolean;
  remoteEndpoint?: string;
}

/**
 * 日志条目接口
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  context?: LogContext;
  userAgent: string;
  url: string;
}

/**
 * 前端日志记录器类
 * 
 * @description 提供完整的前端日志功能，支持分级、emoji、本地存储和远程上报
 */
class FrontendLogger {
  /**
   * 日志级别emoji映射
   */
  private emojiMap: { [key in LogLevel]: string } = {
    error: '❌',
    warn: '⚠️',
    info: 'ℹ️',
    debug: '🔍',
    trace: '📋'
  };

  /**
   * 日志级别权重映射（用于级别过滤）
   */
  private levelWeights: { [key in LogLevel]: number } = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    trace: 4
  };

  /**
   * 日志配置
   */
  private config: LoggerConfig;

  /**
   * 本地存储的日志条目
   */
  private storageKey = 'ai-database-logs';

  /**
   * 创建前端日志记录器实例
   */
  constructor() {
    this.config = {
      level: (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'info',
      enableStorage: import.meta.env.VITE_LOG_STORAGE === 'true',
      maxStorageEntries: parseInt(import.meta.env.VITE_LOG_MAX_ENTRIES || '1000'),
      enableRemoteLogging: import.meta.env.VITE_LOG_REMOTE === 'true',
      remoteEndpoint: import.meta.env.VITE_LOG_ENDPOINT
    };
  }

  /**
   * 判断是否应该记录指定级别的日志
   * 
   * @param level - 日志级别
   * @returns 是否应该记录
   */
  private shouldLog(level: LogLevel): boolean {
    return this.levelWeights[level] <= this.levelWeights[this.config.level];
  }

  /**
   * 输出日志到控制台
   * 
   * @param level - 日志级别
   * @param module - 模块名称
   * @param message - 日志消息
   * @param context - 上下文信息
   */
  private output(level: LogLevel, module: string, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;

    const emoji = this.emojiMap[level];
    const timestamp = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Shanghai'
    });
    
    const logMessage = `${emoji} [${timestamp}] [${level.toUpperCase()}] [${module}] ${message}`;

    // 输出到控制台
    switch (level) {
      case 'error':
        console.error(logMessage, context || '');
        break;
      case 'warn':
        console.warn(logMessage, context || '');
        break;
      case 'info':
        console.info(logMessage, context || '');
        break;
      case 'debug':
        console.debug(logMessage, context || '');
        break;
      case 'trace':
        console.trace(logMessage, context || '');
        break;
    }

    // 存储到本地存储
    if (this.config.enableStorage) {
      this.storeLog({
        timestamp,
        level,
        module,
        message,
        context,
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    }

    // 发送到远程服务器
    if (this.config.enableRemoteLogging && level === 'error') {
      this.sendToRemote({
        timestamp,
        level,
        module,
        message,
        context,
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    }
  }

  /**
   * 记录错误日志
   * 
   * @param module - 模块名称
   * @param message - 错误消息
   * @param context - 上下文信息
   */
  error(module: string, message: string, context?: LogContext): void {
    this.output('error', module, message, context);
  }

  /**
   * 记录警告日志
   * 
   * @param module - 模块名称
   * @param message - 警告消息
   * @param context - 上下文信息
   */
  warn(module: string, message: string, context?: LogContext): void {
    this.output('warn', module, message, context);
  }

  /**
   * 记录信息日志
   * 
   * @param module - 模块名称
   * @param message - 信息消息
   * @param context - 上下文信息
   */
  info(module: string, message: string, context?: LogContext): void {
    this.output('info', module, message, context);
  }

  /**
   * 记录调试日志
   * 
   * @param module - 模块名称
   * @param message - 调试消息
   * @param context - 上下文信息
   */
  debug(module: string, message: string, context?: LogContext): void {
    this.output('debug', module, message, context);
  }

  /**
   * 记录跟踪日志
   * 
   * @param module - 模块名称
   * @param message - 跟踪消息
   * @param context - 上下文信息
   */
  trace(module: string, message: string, context?: LogContext): void {
    this.output('trace', module, message, context);
  }

  /**
   * 存储日志到本地存储
   * 
   * @param entry - 日志条目
   */
  private storeLog(entry: LogEntry): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      const logs: LogEntry[] = stored ? JSON.parse(stored) : [];
      
      logs.push(entry);
      
      // 限制存储条目数量
      if (logs.length > this.config.maxStorageEntries) {
        logs.splice(0, logs.length - this.config.maxStorageEntries);
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(logs));
    } catch (error) {
      console.warn('🔴 存储日志到本地失败:', error);
    }
  }

  /**
   * 发送日志到远程服务器
   * 
   * @param entry - 日志条目
   */
  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      console.warn('🔴 发送日志到远程服务器失败:', error);
    }
  }

  /**
   * 获取存储的日志列表
   * 
   * @param level - 过滤的日志级别（可选）
   * @param limit - 返回条目数量限制（可选）
   * @returns 日志条目数组
   */
  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      let logs: LogEntry[] = stored ? JSON.parse(stored) : [];
      
      if (level) {
        logs = logs.filter(log => log.level === level);
      }
      
      if (limit) {
        logs = logs.slice(-limit);
      }
      
      return logs;
    } catch (error) {
      console.warn('🔴 获取存储日志失败:', error);
      return [];
    }
  }

  /**
   * 清空存储的日志
   */
  clearLogs(): void {
    try {
      localStorage.removeItem(this.storageKey);
      this.info('Logger', '📁 本地日志已清空');
    } catch (error) {
      console.warn('🔴 清空日志失败:', error);
    }
  }

  /**
   * 导出日志为JSON文件
   */
  exportLogs(): void {
    try {
      const logs = this.getLogs();
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-database-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.info('Logger', '📤 日志导出成功');
    } catch (error) {
      this.error('Logger', '📤 日志导出失败', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * 获取日志统计信息
   * 
   * @returns 日志统计数据
   */
  getLogStats(): { total: number; byLevel: Record<LogLevel, number>; oldestEntry?: string; newestEntry?: string } {
    const logs = this.getLogs();
    const stats = {
      total: logs.length,
      byLevel: {
        error: 0,
        warn: 0,
        info: 0,
        debug: 0,
        trace: 0
      } as Record<LogLevel, number>,
      oldestEntry: logs.length > 0 ? logs[0].timestamp : undefined,
      newestEntry: logs.length > 0 ? logs[logs.length - 1].timestamp : undefined
    };
    
    logs.forEach(log => {
      stats.byLevel[log.level]++;
    });
    
    return stats;
  }
}

/**
 * 全局前端日志记录器实例
 */
export const frontendLogger = new FrontendLogger();

/**
 * Vue组件日志装饰器
 * 
 * @description 为Vue组件提供专用的日志记录功能
 * @param componentName - 组件名称
 * @returns 组件专用日志记录器
 * @example
 * ```typescript
 * // 在Vue组件中使用
 * const logger = useLogger('LoginPage');
 * logger.info('用户登录成功', { userId: 123 });
 * ```
 */
export function useLogger(componentName: string) {
  return {
    /**
     * 记录错误日志
     */
    error: (message: string, context?: LogContext) => 
      frontendLogger.error(componentName, message, context),
    
    /**
     * 记录警告日志
     */
    warn: (message: string, context?: LogContext) => 
      frontendLogger.warn(componentName, message, context),
    
    /**
     * 记录信息日志
     */
    info: (message: string, context?: LogContext) => 
      frontendLogger.info(componentName, message, context),
    
    /**
     * 记录调试日志
     */
    debug: (message: string, context?: LogContext) => 
      frontendLogger.debug(componentName, message, context),

    /**
     * 记录跟踪日志
     */
    trace: (message: string, context?: LogContext) => 
      frontendLogger.trace(componentName, message, context),

    /**
     * 记录性能日志
     */
    performance: (operation: string, startTime: number, context?: LogContext) => {
      const duration = Date.now() - startTime;
      frontendLogger.info(componentName, `📊 性能统计: ${operation} (耗时: ${duration}ms)`, {
        operation,
        duration,
        ...context
      });
    },

    /**
     * 记录用户操作日志
     */
    userAction: (action: string, details?: LogContext) => {
      frontendLogger.info(componentName, `👤 用户操作: ${action}`, {
        action,
        timestamp: new Date().toISOString(),
        ...details
      });
    },

    /**
     * 记录API请求日志
     */
    apiRequest: (method: string, url: string, statusCode: number, duration: number, context?: LogContext) => {
      const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';
      frontendLogger[level](componentName, `🌐 API请求: ${method} ${url} (${statusCode})`, {
        method,
        url,
        statusCode,
        duration,
        ...context
      });
    },

    /**
     * 记录路由导航日志
     */
    navigation: (from: string, to: string, context?: LogContext) => {
      frontendLogger.info(componentName, `🧭 页面导航: ${from} → ${to}`, {
        from,
        to,
        timestamp: new Date().toISOString(),
        ...context
      });
    }
  };
}

/**
 * API请求拦截器日志
 * 
 * @description 用于记录API请求和响应的日志
 */
export class ApiLogger {
  private logger = new FrontendLogger();

  /**
   * 记录请求开始
   */
  logRequest(method: string, url: string, data?: any): number {
    const startTime = Date.now();
    this.logger.debug('ApiLogger', `🚀 API请求开始: ${method} ${url}`, { data });
    return startTime;
  }

  /**
   * 记录请求成功
   */
  logSuccess(method: string, url: string, statusCode: number, startTime: number, response?: any): void {
    const duration = Date.now() - startTime;
    this.logger.info('ApiLogger', `✅ API请求成功: ${method} ${url}`, {
      method,
      url,
      statusCode,
      duration,
      response: response ? '有响应数据' : '无响应数据'
    });
  }

  /**
   * 记录请求失败
   */
  logError(method: string, url: string, startTime: number, error: any): void {
    const duration = Date.now() - startTime;
    this.logger.error('ApiLogger', `❌ API请求失败: ${method} ${url}`, {
      method,
      url,
      duration,
      error: error.message || String(error),
      statusCode: error.response?.status
    });
  }
}

/**
 * 错误边界日志记录器
 * 
 * @description 用于记录Vue应用中的错误
 */
export function logError(error: Error, instance: any, info: string): void {
  frontendLogger.error('ErrorBoundary', `💥 Vue错误: ${error.message}`, {
    error: error.message,
    stack: error.stack,
    component: instance?.$options?.name || '未知组件',
    info,
    url: window.location.href,
    userAgent: navigator.userAgent
  });
}

// 全局错误处理
window.addEventListener('error', (event) => {
  frontendLogger.error('GlobalError', `🌍 全局错误: ${event.message}`, {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error?.stack,
    url: window.location.href
  });
});

// 未处理的Promise拒绝
window.addEventListener('unhandledrejection', (event) => {
  frontendLogger.error('UnhandledPromise', `🚫 未处理的Promise拒绝: ${event.reason}`, {
    reason: String(event.reason),
    url: window.location.href
  });
});

// 导出默认实例
export default frontendLogger;