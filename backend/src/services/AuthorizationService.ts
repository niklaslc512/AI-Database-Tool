import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { 
  AuthorizationToken,
  ExternalAuthRequest,
  ExternalAuthResponse,
  User
} from '../types';
import { AppError } from '../types';
import { BusinessLogger } from '../utils/enhancedLogger';

/**
 * 授权服务类 - 负责外部授权和令牌管理
 * 
 * @description 提供外部授权令牌创建、验证、撤销等功能，支持OAuth和临时访问令牌
 * @author AI数据库团队
 * @version 1.0.0
 */
export class AuthorizationService {
  private db: Database<sqlite3.Database, sqlite3.Statement>;
  private jwtSecret: string;
  private logger: BusinessLogger;

  constructor(db: Database<sqlite3.Database, sqlite3.Statement>) {
    this.db = db;
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.logger = new BusinessLogger('AuthorizationService');
  }

  /**
   * 创建外部授权令牌
   * 
   * @description 生成新的外部授权令牌，支持OAuth和临时访问
   * @param authRequest - 授权请求参数
   * @returns Promise<ExternalAuthResponse> 包含令牌和授权URL
   */
  async createExternalAuth(authRequest: ExternalAuthRequest): Promise<ExternalAuthResponse> {
    const startTime = Date.now();
    
    try {
      const { provider, scope, clientInfo, expiresIn = 3600 } = authRequest;
      this.logger.info('🚀 创建外部授权令牌', { provider, expiresIn, scopeCount: scope?.length });

      // 生成授权令牌
      this.logger.debug('🎫 生成授权令牌');
      const token = this.generateAuthToken();
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

      // 存储授权令牌
      await this.db.run(`
        INSERT INTO auth_tokens (
          token, token_type, scope, client_info, expires_at
        ) VALUES (?, ?, ?, ?, ?)
      `,
        token,
        provider,
        scope ? JSON.stringify(scope) : null,
        clientInfo ? JSON.stringify(clientInfo) : null,
        expiresAt.toISOString()
      );

      let authUrl: string | undefined;
      
      // 如果是OAuth类型，生成授权URL
      if (provider === 'oauth') {
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        authUrl = `${baseUrl}/auth/external?token=${token}`;
      }

      this.logger.info('✅ 外部授权令牌创建成功', { 
        tokenId: token.substring(0, 8) + '...', 
        provider, 
        expiresAt: expiresAt.toISOString() 
      });
      this.logger.performance('创建外部授权令牌', startTime);
      this.logger.securityEvent('外部授权令牌创建', 'medium', { provider, expiresIn });

      return {
        token,
        expiresAt,
        authUrl: authUrl || ''
      };
    } catch (error) {
      this.logger.error('❌ 创建外部授权令牌失败', error as Error, { provider: authRequest.provider });
      throw error;
    }
  }

  /**
   * 验证授权令牌
   */
  async validateAuthToken(token: string): Promise<{ valid: boolean; authToken?: AuthorizationToken }> {
    try {
      const dbToken = await this.db.get(`
        SELECT * FROM auth_tokens 
        WHERE token = ? AND is_revoked = FALSE
      `, token) as any;

      if (!dbToken) {
        return { valid: false };
      }

      // 检查令牌是否过期
      if (new Date(dbToken.expires_at) < new Date()) {
        return { valid: false };
      }

      const authToken = this.mapDbTokenToAuthToken(dbToken);
      return { valid: true, authToken };
    } catch (error) {
      this.logger.error('❌ 验证授权令牌失败', error as Error, { tokenId: token.substring(0, 8) + '...' });
      return { valid: false };
    }
  }

  /**
   * 使用授权令牌登录
   * 
   * @description 通过外部授权令牌进行用户身份验证和登录
   * @param token - 授权令牌
   * @param userId - 用户ID（可选）
   * @returns Promise 包含用户信息、JWT令牌和过期时间
   */
  async loginWithAuthToken(token: string, userId?: string): Promise<{ user: User; jwtToken: string; expiresAt: Date }> {
    const startTime = Date.now();
    
    try {
      this.logger.info('🚀 开始外部授权登录', { tokenId: token.substring(0, 8) + '...', userId });
      
      const validation = await this.validateAuthToken(token);
      if (!validation.valid || !validation.authToken) {
        this.logger.warn('⚠️ 授权令牌无效或已过期', { tokenId: token.substring(0, 8) + '...' });
        throw new AppError('授权令牌无效或已过期', 401);
      }

      let user: any;

      if (userId) {
        // 如果提供了用户ID，验证用户存在且状态正常
        user = await this.db.get('SELECT * FROM users WHERE id = ? AND status = ?', userId, 'active');
        if (!user) {
          throw new AppError('用户不存在或已被锁定', 401);
        }

        // 关联用户到授权令牌
        await this.db.run('UPDATE auth_tokens SET user_id = ? WHERE token = ?', userId, token);
      } else if (validation.authToken.userId) {
        // 如果令牌已关联用户
        user = await this.db.get('SELECT * FROM users WHERE id = ? AND status = ?', validation.authToken.userId, 'active');
        if (!user) {
          throw new AppError('关联的用户不存在或已被锁定', 401);
        }
      } else {
        throw new AppError('授权令牌未关联用户', 401);
      }

      // 生成JWT令牌
      const jwtToken = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          role: user.role,
          authMethod: 'external'
        },
        this.jwtSecret,
        { expiresIn: 86400 } // 24小时
      );

      const jwtExpiresAt = new Date();
      jwtExpiresAt.setTime(jwtExpiresAt.getTime() + 86400 * 1000); // 24小时

      // 更新用户登录信息
      await this.db.run(`
        UPDATE users 
        SET last_login_at = CURRENT_TIMESTAMP, login_count = login_count + 1 
        WHERE id = ?
      `, user.id);

      // 记录登录日志
      await this.logExternalLogin(user.id, user.username, validation.authToken.tokenType, true);

      // 撤销授权令牌（一次性使用）
      this.revokeAuthToken(token);

      this.logger.info('✅ 外部授权登录成功', { 
        userId: user.id, 
        username: user.username, 
        authMethod: validation.authToken.tokenType 
      });
      this.logger.performance('外部授权登录', startTime);
      this.logger.userAction(user.id, '外部授权登录', { 
        authMethod: validation.authToken.tokenType,
        tokenType: validation.authToken.tokenType
      });
      this.logger.securityEvent('外部授权登录成功', 'low', { userId: user.id, method: validation.authToken.tokenType });

      return {
        user: this.mapDbUserToUser(user),
        jwtToken,
        expiresAt: jwtExpiresAt
      };
    } catch (error) {
      this.logger.error('❌ 外部授权登录失败', error as Error, { tokenId: token.substring(0, 8) + '...', userId });
      this.logger.securityEvent('外部授权登录失败', 'high', { error: (error as Error).message, tokenId: token.substring(0, 8) + '...' });
      throw error;
    }
  }

  /**
   * 撤销授权令牌
   */
  async revokeAuthToken(token: string): Promise<void> {
    try {
      const result = await this.db.run(`
        UPDATE auth_tokens 
        SET is_revoked = TRUE 
        WHERE token = ?
      `, token);

      if ((result.changes || 0) > 0) {
        this.logger.info('✅ 撤销授权令牌成功', { tokenId: token.substring(0, 8) + '...' });
        this.logger.securityEvent('授权令牌撤销', 'medium', { tokenId: token.substring(0, 8) + '...' });
      }
    } catch (error) {
      this.logger.error('❌ 撤销授权令牌失败', error as Error, { tokenId: token.substring(0, 8) + '...' });
      throw error;
    }
  }

  /**
   * 获取用户的授权令牌列表
   */
  async getUserAuthTokens(userId: string): Promise<AuthorizationToken[]> {
    try {
      const tokens = await this.db.all(`
        SELECT * FROM auth_tokens 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `, userId) as any[];

      return tokens.map(token => this.mapDbTokenToAuthToken(token));
    } catch (error) {
      this.logger.error('❌ 获取用户授权令牌列表失败', error as Error, { userId });
      throw error;
    }
  }

  /**
   * 清理过期的授权令牌
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await this.db.run(`
        DELETE FROM auth_tokens 
        WHERE expires_at < datetime('now') 
        OR is_revoked = TRUE
      `);

      this.logger.info('🗑️ 清理过期授权令牌完成', { deletedCount: result.changes });
      return result.changes || 0;
    } catch (error) {
      this.logger.error('❌ 清理过期授权令牌失败', error as Error);
      throw error;
    }
  }

  /**
   * 获取授权统计信息
   */
  async getAuthStats(): Promise<{
    totalTokens: number;
    activeTokens: number;
    expiredTokens: number;
    revokedTokens: number;
    byType: Record<string, number>;
  }> {
    try {
      const totalResult = await this.db.get('SELECT COUNT(*) as count FROM auth_tokens') as any;
      const activeResult = await this.db.get('SELECT COUNT(*) as count FROM auth_tokens WHERE expires_at > datetime("now") AND is_revoked = FALSE') as any;
      const expiredResult = await this.db.get('SELECT COUNT(*) as count FROM auth_tokens WHERE expires_at <= datetime("now")') as any;
      const revokedResult = await this.db.get('SELECT COUNT(*) as count FROM auth_tokens WHERE is_revoked = TRUE') as any;
      
      const byTypeResults = await this.db.all(`
        SELECT token_type, COUNT(*) as count 
        FROM auth_tokens 
        GROUP BY token_type
      `) as any[];

      const byType: Record<string, number> = {};
      byTypeResults.forEach(result => {
        byType[result.token_type] = result.count;
      });

      return {
        totalTokens: totalResult.count,
        activeTokens: activeResult.count,
        expiredTokens: expiredResult.count,
        revokedTokens: revokedResult.count,
        byType
      };
    } catch (error) {
      this.logger.error('❌ 获取授权统计信息失败', error as Error);
      throw error;
    }
  }

  /**
   * 创建临时访问令牌
   */
  async createTempToken(scope: string[], expiresIn: number = 3600): Promise<ExternalAuthResponse> {
    return this.createExternalAuth({
      provider: 'temporary',
      scope,
      expiresIn
    });
  }

  /**
   * 生成授权令牌
   */
  private generateAuthToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * 记录外部登录日志
   */
  private async logExternalLogin(userId: string, username: string, method: string, success: boolean): Promise<void> {
    try {
      await this.db.run(`
        INSERT INTO login_logs (
          user_id, username, login_method, success
        ) VALUES (?, ?, ?, ?)
      `, userId, username, method, success);
    } catch (error) {
      this.logger.error('❌ 记录外部登录日志失败', error as Error, { userId, username, method });
    }
  }

  /**
   * 解析JWT过期时间
   */
  private parseJwtExpiration(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));
    
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000; // 默认24小时
    }
  }

  /**
   * 映射数据库令牌对象到AuthorizationToken类型
   */
  private mapDbTokenToAuthToken(dbToken: any): AuthorizationToken {
    return {
      id: dbToken.id?.toString(),
      userId: dbToken.user_id?.toString(),
      token: dbToken.token,
      tokenType: dbToken.token_type,
      scope: dbToken.scope ? JSON.parse(dbToken.scope) : undefined,
      clientInfo: dbToken.client_info ? JSON.parse(dbToken.client_info) : undefined,
      expiresAt: new Date(dbToken.expires_at),
      isRevoked: Boolean(dbToken.is_revoked),
      createdAt: new Date(dbToken.created_at)
    };
  }

  /**
   * 映射数据库用户对象到User类型
   */
  private mapDbUserToUser(dbUser: any): User {
    return {
      id: dbUser.id?.toString(),
      username: dbUser.username,
      email: dbUser.email,
      role: dbUser.role,
      status: dbUser.status,
      displayName: dbUser.display_name,
      avatarUrl: dbUser.avatar_url,
      settings: dbUser.settings ? JSON.parse(dbUser.settings) : undefined,
      lastLoginAt: dbUser.last_login_at ? new Date(dbUser.last_login_at) : new Date(),
      loginCount: dbUser.login_count || 0,
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at)
    };
  }
}