import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { BaseService } from './BaseService';
import { 
  Config, 
  CreateConfigRequest, 
  UpdateConfigRequest, 
  ConfigType, 
  ConfigCategory,
  ConfigChangeEvent,
  ConfigInitOptions,
  AppError,
  PaginationParams,
  PaginatedResult
} from '../types';
import { logger } from '../utils/logger';

/**
 * 🔧 系统配置服务
 * 
 * 提供系统配置的完整管理功能，包括：
 * - CRUD操作
 * - 配置验证
 * - 热更新机制
 * - 环境变量覆盖
 * - 配置变更事件
 * 
 * @example
 * ```typescript
 * const configService = ConfigService.getInstance();
 * 
 * // 创建配置
 * await configService.createConfig({
 *   key: 'app.name',
 *   value: 'AI数据库管理系统',
 *   type: 'string',
 *   category: 'general'
 * });
 * 
 * // 获取配置值
 * const appName = await configService.getConfigValue('app.name');
 * 
 * // 监听配置变更
 * configService.on('configChanged', (event) => {
 *   console.log(`配置 ${event.key} 已更新`);
 * });
 * ```
 */
export class ConfigService extends BaseService {
  private static instance: ConfigService;
  private eventEmitter: EventEmitter;
  private configCache: Map<string, any> = new Map();
  private isInitialized = false;

  private constructor() {
    super();
    this.eventEmitter = new EventEmitter();
  }

  /**
   * 获取服务单例实例
   */
  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * 🚀 初始化配置服务
   * 从数据库加载配置并覆盖环境变量
   */
  async initialize(options: ConfigInitOptions = {}): Promise<void> {
    try {
      logger.info('🔧 开始初始化系统配置服务...');
      
      const {
        overrideEnv = true,
        categories
      } = options;

      // 🔍 从数据库加载所有配置
      let sql = 'SELECT * FROM configs WHERE 1=1';
      const params: any[] = [];

      if (categories && categories.length > 0) {
        sql += ` AND config_type IN (${categories.map(() => '?').join(',')})`;
        params.push(...categories);
      }

      sql += ' ORDER BY config_type, config_key';

      const configs = await this.executeAll<Config>(sql, params);
      
      logger.info(`📋 加载了 ${configs.length} 个系统配置`);

      // 🔄 更新配置缓存和环境变量
      for (const config of configs) {
        const parsedValue = this.parseConfigValue(config.config_value || '', config.config_type);
        this.configCache.set(config.config_key, parsedValue);

        // 🌍 覆盖环境变量（如果启用）
        if (overrideEnv && config.config_value) {
          const envKey = config.config_key.toUpperCase().replace(/\./g, '_');
          process.env[envKey] = config.config_value;
          logger.debug(`🌍 环境变量 ${envKey} 已更新`);
        }
      }

      this.isInitialized = true;
      logger.info('✅ 系统配置服务初始化完成');
      
    } catch (error) {
      logger.error('💥 系统配置服务初始化失败:', error);
      throw new AppError('配置服务初始化失败', 500);
    }
  }

  /**
   * 📋 获取所有配置（分页）
   */
  async getConfigs(
    pagination: PaginationParams,
    category?: ConfigCategory,
    includeValues = true
  ): Promise<PaginatedResult<Config>> {
    try {
      const { page, limit, sortBy = 'category', sortOrder = 'asc' } = pagination;
      const offset = (page - 1) * limit;

      // 🔍 构建查询条件
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];

      if (category) {
        whereClause += ' AND category = ?';
        params.push(category);
      }

      // 📊 获取总数
      const countSql = `SELECT COUNT(*) as total FROM configs ${whereClause}`;
      const countResult = await this.executeQuery<{ total: number }>(countSql, params);
      const total = countResult.total;

      // 📋 获取配置列表
      const selectFields = includeValues 
        ? '*' 
        : 'id, config_key, config_type, description, category, created_at, updated_at';
      
      const dataSql = `
        SELECT ${selectFields} FROM configs 
        ${whereClause} 
        ORDER BY ${sortBy} ${sortOrder.toUpperCase()}, config_key ASC 
        LIMIT ? OFFSET ?
      `;
      
      const configs = await this.executeAll<Config>(
        dataSql, 
        [...params, limit, offset]
      );

      // 处理配置数据
      const processedConfigs = configs.map(config => ({
        ...config
      }));

      return {
        data: processedConfigs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('💥 获取配置列表失败:', error);
      throw new AppError('获取配置列表失败', 500);
    }
  }

  /**
   * 🔍 根据ID获取配置
   */
  async getConfigById(id: string, includeValue = true): Promise<Config> {
    try {
      const config = await this.executeQuery<Config>(
        'SELECT * FROM configs WHERE id = ?',
        [id]
      );

      if (!config) {
        throw new AppError('配置不存在', 404);
      }

      return {
        ...config
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('💥 获取配置失败:', error);
      throw new AppError('获取配置失败', 500);
    }
  }

  /**
   * 🔑 根据key获取配置值
   */
  async getConfigValue<T = any>(key: string): Promise<T | null> {
    try {
      // 🚀 优先从缓存获取
      if (this.configCache.has(key)) {
        return this.configCache.get(key) as T;
      }

      // 🔍 从数据库获取
      const config = await this.executeQuery<Config>(
        'SELECT config_value, config_type FROM configs WHERE config_key = ?',
        [key]
      );

      if (!config) {
        return null;
      }

      const parsedValue = this.parseConfigValue(config.config_value || '', config.config_type);
      this.configCache.set(key, parsedValue);
      
      return parsedValue as T;
    } catch (error) {
      logger.error(`💥 获取配置值失败 [${key}]:`, error);
      return null;
    }
  }

  /**
   * ➕ 创建新配置
   */
  async createConfig(request: CreateConfigRequest, userId?: string): Promise<Config> {
    try {
      const {
        config_key,
        config_value,
        config_type = 'user',
        description,
        user_id,
        is_encrypted = false
      } = request;

      // 🔍 检查配置是否已存在
      const existing = await this.executeQuery<Config>(
        'SELECT id FROM configs WHERE config_key = ?',
        [config_key]
      );

      if (existing) {
        throw new AppError(`配置键 '${config_key}' 已存在`, 409);
      }

      // ✅ 验证配置值
      if (config_value) {
        this.validateConfigValue(config_value, config_type);
      }

      const id = uuidv4();
      const now = new Date().toISOString();

      // 💾 插入数据库
      await this.executeRun(
        `INSERT INTO configs (
          id, user_id, config_key, config_value, config_type, description, is_encrypted,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, user_id || userId || null, config_key, config_value || null, config_type, description || null, is_encrypted,
          now, now
        ]
      );

      // 🔄 更新缓存
      if (config_value) {
        const parsedValue = this.parseConfigValue(config_value, config_type);
        this.configCache.set(config_key, parsedValue);

        // 🌍 更新环境变量
        const envKey = config_key.toUpperCase().replace(/\./g, '_');
        process.env[envKey] = config_value;
      }

      // 📢 发送变更事件
        this.emitConfigChange({
          config_key,
          oldValue: '',
          newValue: config_value || '',
          config_type,
          timestamp: new Date(),
          userId: userId || user_id
        });

      logger.info(`✅ 创建配置成功: ${config_key}`);
      
      return this.getConfigById(id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('💥 创建配置失败:', error);
      throw new AppError('创建配置失败', 500);
    }
  }

  /**
   * ✏️ 更新配置
   */
  async updateConfig(
    id: string, 
    request: UpdateConfigRequest, 
    userId?: string
  ): Promise<Config> {
    try {
      // 🔍 获取现有配置
      const existing = await this.executeQuery<Config>(
        'SELECT * FROM configs WHERE id = ?',
        [id]
      );

      if (!existing) {
        throw new AppError('配置不存在', 404);
      }



      const {
        config_value,
        description,
        config_type
      } = request;

      // ✅ 验证新的配置值
      if (config_value !== undefined) {
        this.validateConfigValue(config_value, config_type || existing.config_type);
      }

      // 🔄 构建更新语句
      const updates: string[] = [];
      const params: any[] = [];

      if (config_value !== undefined) {
        updates.push('config_value = ?');
        params.push(config_value);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        params.push(description);
      }
      if (config_type !== undefined) {
        updates.push('config_type = ?');
        params.push(config_type);
      }


      if (updates.length === 0) {
        throw new AppError('没有提供要更新的字段', 400);
      }

      updates.push('updated_at = ?');
      params.push(new Date().toISOString());
      params.push(id);

      // 💾 执行更新
      await this.executeRun(
        `UPDATE configs SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      // 🔄 更新缓存和环境变量
      if (config_value !== undefined) {
        const parsedValue = this.parseConfigValue(config_value, config_type || existing.config_type);
        this.configCache.set(existing.config_key, parsedValue);

        // 🌍 更新环境变量
        const envKey = existing.config_key.toUpperCase().replace(/\./g, '_');
        process.env[envKey] = config_value;

        // 📢 发送变更事件
        this.emitConfigChange({
          config_key: existing.config_key,
          oldValue: existing.config_value || '',
          newValue: config_value,
          config_type: existing.config_type,
          timestamp: new Date(),
          userId
        });
      }

      logger.info(`✅ 更新配置成功: ${existing.config_key}`);
      
      return this.getConfigById(id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('💥 更新配置失败:', error);
      throw new AppError('更新配置失败', 500);
    }
  }

  /**
   * 🗑️ 删除配置
   */
  async deleteConfig(id: string, userId?: string): Promise<void> {
    try {
      // 🔍 获取配置信息
      const config = await this.executeQuery<Config>(
        'SELECT * FROM configs WHERE id = ?',
        [id]
      );

      if (!config) {
        throw new AppError('配置不存在', 404);
      }



      // 🗑️ 删除配置
      await this.executeRun('DELETE FROM configs WHERE id = ?', [id]);

      // 🔄 清除缓存
      this.configCache.delete(config.config_key);

      // 🌍 清除环境变量
      const envKey = config.config_key.toUpperCase().replace(/\./g, '_');
      delete process.env[envKey];

      logger.info(`✅ 删除配置成功: ${config.config_key}`);
      
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('💥 删除配置失败:', error);
      throw new AppError('删除配置失败', 500);
    }
  }

  /**
   * 🔄 重新加载所有配置
   */
  async reloadConfigs(): Promise<void> {
    try {
      logger.info('🔄 开始重新加载系统配置...');
      
      // 🧹 清空缓存
      this.configCache.clear();
      
      // 🚀 重新初始化
      await this.initialize({ overrideEnv: true });
      
      logger.info('✅ 系统配置重新加载完成');
    } catch (error) {
      logger.error('💥 重新加载配置失败:', error);
      throw new AppError('重新加载配置失败', 500);
    }
  }

  /**
   * 📢 监听配置变更事件
   */
  on(event: 'configChanged', listener: (event: ConfigChangeEvent) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * 🚫 移除配置变更监听器
   */
  off(event: 'configChanged', listener: (event: ConfigChangeEvent) => void): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * 🔍 解析配置值
   */
  private parseConfigValue(value: string, type: string): any {
    try {
      switch (type) {
        case 'string':
          return value;
        case 'number':
          const num = Number(value);
          if (isNaN(num)) {
            throw new Error(`无效的数字值: ${value}`);
          }
          return num;
        case 'boolean':
          if (value.toLowerCase() === 'true') return true;
          if (value.toLowerCase() === 'false') return false;
          throw new Error(`无效的布尔值: ${value}`);
        case 'json':
          return JSON.parse(value);
        default:
          return value;
      }
    } catch (error) {
      logger.warn(`⚠️ 解析配置值失败 [${type}]: ${value}`, error);
      return value; // 返回原始字符串值
    }
  }

  /**
   * ✅ 验证配置值
   */
  private validateConfigValue(value: string, type: string): void {
    // 🔍 基本类型验证
    try {
      this.parseConfigValue(value, type);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new AppError(`配置值类型验证失败: ${errorMessage}`, 400);
    }
  }

  /**
   * 📢 发送配置变更事件
   */
  private emitConfigChange(event: ConfigChangeEvent): void {
    this.eventEmitter.emit('configChanged', event);
    logger.info(`📢 配置变更事件: ${event.config_key} = ${event.newValue}`);
  }
}