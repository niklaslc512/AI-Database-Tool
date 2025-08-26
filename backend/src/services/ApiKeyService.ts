import crypto from 'crypto';
import { 
  ApiKey,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  PaginationParams,
  PaginatedResult,
  ApiKeyPermission
} from '../types';
import { AppError } from '../types';
import { logger } from '../utils/logger';
import { databaseManager } from '../config/database';

export class ApiKeyService {
  private static instance: ApiKeyService;
  private keyPrefix: string;

  private constructor() {
    this.keyPrefix = process.env.API_KEY_PREFIX || 'ak_';
  }

  /**
   * 获取ApiKeyService单例实例
   */
  static getInstance(): ApiKeyService {
    if (!ApiKeyService.instance) {
      ApiKeyService.instance = new ApiKeyService();
    }
    return ApiKeyService.instance;
  }

  /**
   * 获取数据库实例
   */
  private async getDatabase(): Promise<any> {
    return databaseManager.getDatabase();
  }

  /**
   * 执行查询语句，返回单个结果
   */
  private async executeQuery<T = any>(
    sql: string, 
    params?: any[]
  ): Promise<T> {
    const db = await this.getDatabase();
    return db.get(sql, params) as Promise<T>;
  }

  /**
   * 执行查询语句，返回所有结果
   */
  private async executeAll<T = any>(
    sql: string, 
    params?: any[]
  ): Promise<T[]> {
    const db = await this.getDatabase();
    return db.all(sql, params) as Promise<T[]>;
  }

  /**
   * 执行插入、更新或删除语句
   */
  private async executeRun(
    sql: string, 
    params?: any[]
  ): Promise<any> {
    const db = await this.getDatabase();
    return db.run(sql, params);
  }

  /**
   * 创建API密钥
   */
  async createApiKey(userId: string, keyData: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
    try {
      // 检查用户是否存在
      const user = await this.executeQuery('SELECT id FROM users WHERE id = ?', [userId]);
      if (!user) {
        throw new AppError('用户不存在', 404);
      }

      // 检查用户API密钥数量限制（最多10个）
      const keyCount = await this.executeQuery('SELECT COUNT(*) as count FROM api_keys WHERE user_id = ? AND is_active = TRUE', [userId]) as any;
      if (keyCount.count >= 10) {
        throw new AppError('API密钥数量已达上限（10个）', 400);
      }

      // 生成完整的API密钥（ak-开头的单一字符串）
      const apiKey = this.generateApiKey();

      // 验证权限列表
      if (keyData.permissions && keyData.permissions.length > 0) {
        const validPermissions = ['read', 'write', 'delete', 'admin'];
        const invalidPermissions = keyData.permissions.filter(p => !validPermissions.includes(p));
        if (invalidPermissions.length > 0) {
          throw new AppError(`无效的权限: ${invalidPermissions.join(', ')}`, 400);
        }
      }

      // 插入API密钥数据
      const result = await this.executeRun(`
        INSERT INTO api_keys (
          user_id, name, api_key, permissions, database_ids, expires_at, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        [userId,
        keyData.name,
        apiKey,
        keyData.permissions ? JSON.stringify(keyData.permissions) : '["read"]',
        keyData.databaseIds ? JSON.stringify(keyData.databaseIds) : null,
        keyData.expiresAt ? keyData.expiresAt.toISOString() : null,
        true]
      );

      const createdApiKey = await this.getApiKeyById(result.lastID?.toString() || '');
      
      logger.info(`创建API密钥成功: ${keyData.name} (用户ID: ${userId})`);

      return {
        apiKey: createdApiKey,
        secret: apiKey // 只在创建时返回完整密钥
      };
    } catch (error) {
      logger.error('创建API密钥失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户的API密钥列表
   */
  async getUserApiKeys(userId: string, includeInactive: boolean = false): Promise<ApiKey[]> {
    try {
      const query = `
        SELECT * FROM api_keys 
        WHERE user_id = ? ${includeInactive ? '' : 'AND is_active = TRUE'}
        ORDER BY created_at DESC
      `;
      
      const keys = await this.executeAll(query, [userId]) as any[];
      return keys.map(key => this.mapDbApiKeyToApiKey(key));
    } catch (error) {
      logger.error('获取API密钥列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取API密钥
   */
  async getApiKeyById(id: string): Promise<ApiKey> {
    const key = await this.executeQuery('SELECT * FROM api_keys WHERE id = ?', [id]) as any;
    if (!key) {
      throw new AppError('API密钥不存在', 404);
    }
    return this.mapDbApiKeyToApiKey(key);
  }

  /**
   * 验证API密钥
   */
  async validateApiKey(apiKeyString: string): Promise<{ valid: boolean; apiKey?: ApiKey; user?: any }> {
    try {
      // 检查API密钥格式（必须以ak-开头）
      if (!apiKeyString.startsWith(this.keyPrefix)) {
        return { valid: false };
      }

      // 查找API密钥
      const dbKey = await this.executeQuery(`
        SELECT ak.*, u.id as user_id, u.username, u.roles, u.status
        FROM api_keys ak
        JOIN users u ON ak.user_id = u.id
        WHERE ak.api_key = ? AND ak.is_active = TRUE
      `, [apiKeyString]) as any;

      if (!dbKey) {
        return { valid: false };
      }

      // 检查密钥是否过期
      if (dbKey.expires_at && new Date(dbKey.expires_at) < new Date()) {
        return { valid: false };
      }

      // 检查用户状态
      if (dbKey.status !== 'active') {
        return { valid: false };
      }

      // 更新最后使用时间
      await this.executeRun(`
        UPDATE api_keys 
        SET last_used_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [dbKey.id]);

      const apiKey = this.mapDbApiKeyToApiKey(dbKey);
      const user = {
        id: dbKey.user_id,
        username: dbKey.username,
        roles: dbKey.roles,
        status: dbKey.status
      };

      return { valid: true, apiKey, user };
    } catch (error) {
      logger.error('验证API密钥失败:', error);
      return { valid: false };
    }
  }

  /**
   * 更新API密钥
   */
  async updateApiKey(id: string, userId: string, updateData: { name?: string; permissions?: string[]; databaseIds?: string[]; expiresAt?: Date; isActive?: boolean }): Promise<ApiKey> {
    try {
      const existingKey = await this.executeQuery('SELECT * FROM api_keys WHERE id = ? AND user_id = ?', [id, userId]) as any;
      if (!existingKey) {
        throw new AppError('API密钥不存在', 404);
      }

      const updates: string[] = [];
      const values: any[] = [];

      if (updateData.name !== undefined) {
        updates.push('name = ?');
        values.push(updateData.name);
      }

      if (updateData.permissions !== undefined) {
        updates.push('permissions = ?');
        values.push(JSON.stringify(updateData.permissions));
      }

      if (updateData.databaseIds !== undefined) {
        updates.push('database_ids = ?');
        values.push(JSON.stringify(updateData.databaseIds));
      }

      if (updateData.expiresAt !== undefined) {
        updates.push('expires_at = ?');
        values.push(updateData.expiresAt ? updateData.expiresAt.toISOString() : null);
      }

      if (updateData.isActive !== undefined) {
        updates.push('is_active = ?');
        values.push(updateData.isActive);
      }

      if (updates.length === 0) {
        return this.getApiKeyById(id);
      }

      values.push(id);
      const updateQuery = `UPDATE api_keys SET ${updates.join(', ')} WHERE id = ?`;
      await this.executeRun(updateQuery, values);

      logger.info(`更新API密钥成功: ${id}`);
      return this.getApiKeyById(id);
    } catch (error) {
      logger.error('更新API密钥失败:', error);
      throw error;
    }
  }

  /**
   * 停用API密钥
   */
  async deactivateApiKey(id: string, userId: string): Promise<void> {
    try {
      const result = await this.executeRun(`
        UPDATE api_keys 
        SET is_active = FALSE 
        WHERE id = ? AND user_id = ?
      `, [id, userId]);

      if (result.changes === 0) {
        throw new AppError('API密钥不存在', 404);
      }

      logger.info(`停用API密钥成功: ${id}`);
    } catch (error) {
      logger.error('停用API密钥失败:', error);
      throw error;
    }
  }

  /**
   * 删除API密钥
   */
  async deleteApiKey(id: string, userId: string): Promise<void> {
    try {
      const result = await this.executeRun(`
        DELETE FROM api_keys 
        WHERE id = ? AND user_id = ?
      `, [id, userId]);

      if (result.changes === 0) {
        throw new AppError('API密钥不存在', 404);
      }

      logger.info(`删除API密钥成功: ${id}`);
    } catch (error) {
      logger.error('删除API密钥失败:', error);
      throw error;
    }
  }

  /**
   * 获取API密钥使用统计
   */
  async getApiKeyStats(userId: string): Promise<{
    total: number;
    active: number;
    expired: number;
    totalUsage: number;
  }> {
    try {
      const stats = await this.executeQuery(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN expires_at IS NOT NULL AND expires_at < datetime('now') THEN 1 ELSE 0 END) as expired,
          SUM(usage_count) as totalUsage
        FROM api_keys 
        WHERE user_id = ?
      `, [userId]) as any;

      return {
        total: stats.total || 0,
        active: stats.active || 0,
        expired: stats.expired || 0,
        totalUsage: stats.totalUsage || 0
      };
    } catch (error) {
      logger.error('获取API密钥统计失败:', error);
      throw error;
    }
  }

  /**
   * 清理过期的API密钥
   */
  async cleanupExpiredKeys(): Promise<number> {
    try {
      const result = await this.executeRun(`
        UPDATE api_keys 
        SET is_active = FALSE 
        WHERE expires_at IS NOT NULL 
        AND expires_at < datetime('now') 
        AND is_active = TRUE
      `);

      logger.info(`清理过期API密钥: ${result.changes} 个`);
      return result.changes || 0;
    } catch (error) {
      logger.error('清理过期API密钥失败:', error);
      throw error;
    }
  }

  /**
   * 检查API密钥是否有特定权限
   */
  async checkApiKeyPermission(
    apiKey: ApiKey, 
    permission: ApiKeyPermission, 
    databaseId?: string
  ): Promise<boolean> {
    try {
      // 检查基础权限
      if (!apiKey.permissions || !apiKey.permissions.includes(permission)) {
        return false;
      }

      // 检查数据库访问权限
      if (databaseId && apiKey.databaseIds && apiKey.databaseIds.length > 0) {
        if (!apiKey.databaseIds.includes(databaseId)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('检查API密钥权限失败:', error);
      return false;
    }
  }

  /**
   * 检查API密钥是否可以执行SQL语句
   */
  async canExecuteSQL(apiKey: ApiKey, sql: string): Promise<{ allowed: boolean; reason?: string | undefined }> {

    try {
      const sqlUpper = sql.trim().toUpperCase();
      
      if (sqlUpper.startsWith('SELECT')) {
        const hasPermission = apiKey.permissions?.includes('read') || false;
        return { 
          allowed: hasPermission, 
          reason: hasPermission ? undefined : '缺少读取权限' 
        };
      } else if (sqlUpper.startsWith('INSERT')) {
        const hasPermission = apiKey.permissions?.includes('write') || false;
        return { 
          allowed: hasPermission, 
          reason: hasPermission ? undefined : '缺少写入权限' 
        };
      } else if (sqlUpper.startsWith('UPDATE')) {
        const hasPermission = apiKey.permissions?.includes('write') || false;
        return { 
          allowed: hasPermission, 
          reason: hasPermission ? undefined : '缺少更新权限' 
        };
      } else if (sqlUpper.startsWith('DELETE')) {
        const hasPermission = apiKey.permissions?.includes('delete') || false;
        return { 
          allowed: hasPermission, 
          reason: hasPermission ? undefined : '缺少删除权限' 
        };
      } else {
        // 其他SQL语句（如DDL）需要管理员权限
        const hasPermission = apiKey.permissions?.includes('admin') || false;
        return { 
          allowed: hasPermission, 
          reason: hasPermission ? undefined : 'DDL操作需要管理员权限' 
        };
      }
    } catch (error) {
      logger.error('检查SQL执行权限失败:', error);
      return { allowed: false, reason: '权限检查失败' };
    }
  }

  /**
   * 生成完整的API密钥（ak-开头的单一字符串）
   */
  private generateApiKey(): string {
    const randomBytes = crypto.randomBytes(32);
    return `${this.keyPrefix}${randomBytes.toString('hex')}`;
  }

  /**
   * 映射数据库API密钥对象到ApiKey类型
   */
  private mapDbApiKeyToApiKey(dbKey: any): ApiKey {
    const apiKey: ApiKey = {
      id: dbKey.id?.toString(),
      userId: dbKey.user_id?.toString(),
      name: dbKey.name,
      apiKey: dbKey.api_key,
      permissions: dbKey.permissions ? JSON.parse(dbKey.permissions) : ['read'],
      databaseIds: dbKey.database_ids ? JSON.parse(dbKey.database_ids) : [],
      usageCount: dbKey.usage_count || 0,
      isActive: Boolean(dbKey.is_active),
      createdAt: new Date(dbKey.created_at)
    };
    
    // 单独处理可选属性
    if (dbKey.last_used_at) {
      apiKey.lastUsedAt = new Date(dbKey.last_used_at);
    }
    
    if (dbKey.expires_at) {
      apiKey.expiresAt = new Date(dbKey.expires_at);
    }
    
    return apiKey;
  }

}
