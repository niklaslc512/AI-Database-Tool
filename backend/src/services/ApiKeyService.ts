import crypto from 'crypto';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { 
  ApiKey,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  PaginationParams,
  PaginatedResult
} from '../types';
import { AppError } from '../types';
import { logger } from '../utils/logger';

export class ApiKeyService {
  private db: Database<sqlite3.Database, sqlite3.Statement>;
  private keyPrefix: string;

  constructor(db: Database<sqlite3.Database, sqlite3.Statement>) {
    this.db = db;
    this.keyPrefix = process.env.API_KEY_PREFIX || 'ak_';
  }

  /**
   * 创建API密钥
   */
  async createApiKey(userId: string, keyData: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
    try {
      // 检查用户是否存在
      const user = await this.db.get('SELECT id FROM users WHERE id = ?', userId);
      if (!user) {
        throw new AppError('用户不存在', 404);
      }

      // 检查用户API密钥数量限制（最多10个）
      const keyCount = await this.db.get('SELECT COUNT(*) as count FROM api_keys WHERE user_id = ? AND is_active = TRUE', userId) as any;
      if (keyCount.count >= 10) {
        throw new AppError('API密钥数量已达上限（10个）', 400);
      }

      // 生成密钥ID和密钥
      const keyId = this.generateKeyId();
      const secret = this.generateSecret();
      const secretHash = this.hashSecret(secret);

      // 插入API密钥数据
      const result = await this.db.run(`
        INSERT INTO api_keys (
          user_id, name, key_id, key_secret, permissions, expires_at, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        userId,
        keyData.name,
        keyId,
        secretHash,
        keyData.permissions ? JSON.stringify(keyData.permissions) : null,
        keyData.expiresAt ? keyData.expiresAt.toISOString() : null,
        true
      );

      const apiKey = await this.getApiKeyById(result.lastID?.toString() || '');
      
      logger.info(`创建API密钥成功: ${keyData.name} (用户ID: ${userId})`);

      return {
        apiKey,
        secret: `${keyId}.${secret}` // 只在创建时返回完整密钥
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
      
      const keys = await this.db.all(query, userId) as any[];
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
    const key = await this.db.get('SELECT * FROM api_keys WHERE id = ?', id) as any;
    if (!key) {
      throw new AppError('API密钥不存在', 404);
    }
    return this.mapDbApiKeyToApiKey(key);
  }

  /**
   * 根据密钥ID验证API密钥
   */
  async validateApiKey(fullKey: string): Promise<{ valid: boolean; apiKey?: ApiKey; user?: any }> {
    try {
      // 解析密钥格式：keyId.secret
      const parts = fullKey.split('.');
      if (parts.length !== 2) {
        return { valid: false };
      }

      const [keyId, secret] = parts;

      // 查找API密钥
      const dbKey = await this.db.get(`
        SELECT ak.*, u.id as user_id, u.username, u.role, u.status
        FROM api_keys ak
        JOIN users u ON ak.user_id = u.id
        WHERE ak.key_id = ? AND ak.is_active = TRUE
      `, keyId) as any;

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

      // 验证密钥
      const isSecretValid = this.verifySecret(secret || '', dbKey.key_secret);
      if (!isSecretValid) {
        return { valid: false };
      }

      // 更新最后使用时间
      await this.db.run(`
        UPDATE api_keys 
        SET last_used_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, dbKey.id);

      const apiKey = this.mapDbApiKeyToApiKey(dbKey);
      const user = {
        id: dbKey.user_id,
        username: dbKey.username,
        role: dbKey.role,
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
  async updateApiKey(id: string, userId: string, updateData: { name?: string; permissions?: string[] }): Promise<ApiKey> {
    try {
      const existingKey = await this.db.get('SELECT * FROM api_keys WHERE id = ? AND user_id = ?', id, userId) as any;
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

      if (updates.length === 0) {
        return this.getApiKeyById(id);
      }

      values.push(id);
      const updateQuery = `UPDATE api_keys SET ${updates.join(', ')} WHERE id = ?`;
      await this.db.run(updateQuery, ...values);

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
      const result = await this.db.run(`
        UPDATE api_keys 
        SET is_active = FALSE 
        WHERE id = ? AND user_id = ?
      `, id, userId);

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
      const result = await this.db.run(`
        DELETE FROM api_keys 
        WHERE id = ? AND user_id = ?
      `, id, userId);

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
      const stats = await this.db.get(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN expires_at IS NOT NULL AND expires_at < datetime('now') THEN 1 ELSE 0 END) as expired,
          SUM(usage_count) as totalUsage
        FROM api_keys 
        WHERE user_id = ?
      `, userId) as any;

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
      const result = await this.db.run(`
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
   * 生成密钥ID
   */
  private generateKeyId(): string {
    const randomBytes = crypto.randomBytes(8);
    return `${this.keyPrefix}${randomBytes.toString('hex')}`;
  }

  /**
   * 生成密钥
   */
  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * 哈希密钥
   */
  private hashSecret(secret: string): string {
    return crypto.createHash('sha256').update(secret).digest('hex');
  }

  /**
   * 验证密钥
   */
  private verifySecret(secret: string, hashedSecret: string): boolean {
    const secretHash = this.hashSecret(secret);
    return crypto.timingSafeEqual(Buffer.from(secretHash), Buffer.from(hashedSecret));
  }

  /**
   * 映射数据库API密钥对象到ApiKey类型
   */
  private mapDbApiKeyToApiKey(dbKey: any): ApiKey {
    const apiKey: ApiKey = {
      id: dbKey.id?.toString(),
      userId: dbKey.user_id?.toString(),
      name: dbKey.name,
      keyId: dbKey.key_id,
      permissions: dbKey.permissions ? JSON.parse(dbKey.permissions) : undefined,
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