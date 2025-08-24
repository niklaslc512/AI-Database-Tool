import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { 
  User, 
  CreateUserRequest, 
  UpdateUserRequest, 
  LoginRequest, 
  LoginResponse,
  UserRole,
  UserStatus,
  LoginLog,
  PaginationParams,
  PaginatedResult
} from '../types';
import { AppError } from '../types';
import { logger } from '../utils/logger';

export class UserService {
  private db: Database<sqlite3.Database, sqlite3.Statement>;
  private saltRounds: number;
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor(db: Database<sqlite3.Database, sqlite3.Statement>) {
    this.db = db;
    this.saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
  }

  /**
   * 创建用户
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      // 检查用户名和邮箱是否已存在
      const existingUser = await this.db.get(`
        SELECT id FROM users WHERE username = ? OR email = ?
      `, userData.username, userData.email);

      if (existingUser) {
        throw new AppError('用户名或邮箱已存在', 400);
      }

      // 生成密码哈希
      const salt = await bcrypt.genSalt(this.saltRounds);
      const passwordHash = await bcrypt.hash(userData.password, salt);

      // 插入用户数据
      const result = await this.db.run(`
        INSERT INTO users (
          username, email, password_hash, salt, role, display_name, settings
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        userData.username,
        userData.email,
        passwordHash,
        salt,
        userData.role || 'user',
        userData.displayName || userData.username,
        JSON.stringify(userData.settings || {
          theme: 'auto',
          language: 'zh-CN',
          timezone: 'Asia/Shanghai',
          notifications: {
            email: true,
            browser: true,
            security: true
          }
        })
      );

      logger.info(`创建用户成功: ${userData.username}`);
      return this.getUserById(result.lastID?.toString() || '');
    } catch (error) {
      logger.error('创建用户失败:', error);
      throw error;
    }
  }

  /**
   * 用户登录
   */
  async login(loginData: LoginRequest, clientInfo?: { ip?: string; userAgent?: string }): Promise<LoginResponse> {
    try {
      // 查找用户
      const user = await this.db.get(`
        SELECT * FROM users WHERE username = ? OR email = ?
      `, loginData.username, loginData.username) as any;

      if (!user) {
        await this.logLoginAttempt(loginData.username, false, '用户不存在', clientInfo);
        throw new AppError('用户名或密码错误', 401);
      }

      // 检查用户状态
      if (user.status !== 'active') {
        await this.logLoginAttempt(loginData.username, false, '账户已被锁定', clientInfo);
        throw new AppError('账户已被锁定，请联系管理员', 401);
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(loginData.password, user.password_hash);
      if (!isPasswordValid) {
        await this.logLoginAttempt(loginData.username, false, '密码错误', clientInfo);
        throw new AppError('用户名或密码错误', 401);
      }

      // 更新登录信息
      await this.db.run(`
        UPDATE users 
        SET last_login_at = CURRENT_TIMESTAMP, login_count = login_count + 1 
        WHERE id = ?
      `, user.id);

      // 记录登录成功
      await this.logLoginAttempt(loginData.username, true, null, clientInfo, user.id);

      // 生成JWT令牌
      const payload = {
        userId: user.id,
        username: user.username,
        role: user.role
      };
      
      const secret = this.jwtSecret as string;
      const token = jwt.sign(payload, secret, { expiresIn: 86400 }); // 24小时

      const expiresAt = new Date();
      expiresAt.setTime(expiresAt.getTime() + this.parseJwtExpiration(this.jwtExpiresIn));

      logger.info(`用户登录成功: ${user.username}`);

      return {
        user: this.sanitizeUser(user),
        token,
        expiresAt
      };
    } catch (error) {
      logger.error('用户登录失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取用户
   */
  async getUserById(id: string): Promise<User> {
    const user = await this.db.get('SELECT * FROM users WHERE id = ?', id) as any;
    if (!user) {
      throw new AppError('用户不存在', 404);
    }
    return this.mapDbUserToUser(user);
  }

  /**
   * 根据用户名获取用户
   */
  async getUserByUsername(username: string): Promise<User> {
    const user = await this.db.get('SELECT * FROM users WHERE username = ?', username) as any;
    if (!user) {
      throw new AppError('用户不存在', 404);
    }
    return this.mapDbUserToUser(user);
  }

  /**
   * 更新用户信息
   */
  async updateUser(id: string, updateData: UpdateUserRequest): Promise<User> {
    try {
      const existingUser = await this.db.get('SELECT * FROM users WHERE id = ?', id) as any;
      if (!existingUser) {
        throw new AppError('用户不存在', 404);
      }

      // 检查邮箱是否被其他用户使用
      if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await this.db.get('SELECT id FROM users WHERE email = ? AND id != ?', updateData.email, id);
        if (emailExists) {
          throw new AppError('邮箱已被使用', 400);
        }
      }

      // 构建更新语句
      const updates: string[] = [];
      const values: any[] = [];

      if (updateData.displayName !== undefined) {
        updates.push('display_name = ?');
        values.push(updateData.displayName);
      }

      if (updateData.email !== undefined) {
        updates.push('email = ?');
        values.push(updateData.email);
      }

      if (updateData.settings !== undefined) {
        updates.push('settings = ?');
        values.push(JSON.stringify(updateData.settings));
      }

      if (updates.length === 0) {
        return this.getUserById(id);
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
      await this.db.run(updateQuery, ...values);

      logger.info(`更新用户信息成功: ${existingUser.username}`);
      return this.getUserById(id);
    } catch (error) {
      logger.error('更新用户信息失败:', error);
      throw error;
    }
  }

  /**
   * 删除用户
   */
  async deleteUser(id: string): Promise<void> {
    try {
      const user = await this.db.get('SELECT username FROM users WHERE id = ?', id) as any;
      if (!user) {
        throw new AppError('用户不存在', 404);
      }

      await this.db.run('DELETE FROM users WHERE id = ?', id);
      logger.info(`删除用户成功: ${user.username}`);
    } catch (error) {
      logger.error('删除用户失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户列表
   */
  async getUsers(params: PaginationParams & { role?: UserRole; status?: UserStatus }): Promise<PaginatedResult<User>> {
    try {
      const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc', role, status } = params;
      const offset = (page - 1) * limit;

      // 构建查询条件
      const conditions: string[] = [];
      const values: any[] = [];

      if (role) {
        conditions.push('role = ?');
        values.push(role);
      }

      if (status) {
        conditions.push('status = ?');
        values.push(status);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // 获取总数
      const countQuery = `SELECT COUNT(*) as count FROM users ${whereClause}`;
      const countResult = await this.db.get(countQuery, ...values) as any;
      const total = countResult.count;

      // 获取用户列表
      const usersQuery = `
        SELECT * FROM users 
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
        LIMIT ? OFFSET ?
      `;
      
      const users = await this.db.all(usersQuery, ...values, limit, offset) as any[];
      
      return {
        data: users.map(user => this.mapDbUserToUser(user)),
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
      logger.error('获取用户列表失败:', error);
      throw error;
    }
  }

  /**
   * 修改密码
   */
  async changePassword(id: string, oldPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await this.db.get('SELECT * FROM users WHERE id = ?', id) as any;
      if (!user) {
        throw new AppError('用户不存在', 404);
      }

      // 验证旧密码
      const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
      if (!isOldPasswordValid) {
        throw new AppError('原密码错误', 400);
      }

      // 生成新密码哈希
      const salt = await bcrypt.genSalt(this.saltRounds);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      // 更新密码
      await this.db.run(`
        UPDATE users 
        SET password_hash = ?, salt = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, passwordHash, salt, id);

      logger.info(`用户修改密码成功: ${user.username}`);
    } catch (error) {
      logger.error('修改密码失败:', error);
      throw error;
    }
  }

  /**
   * 记录登录日志
   */
  private async logLoginAttempt(
    username: string, 
    success: boolean, 
    failureReason?: string | null,
    clientInfo?: { ip?: string; userAgent?: string },
    userId?: string
  ): Promise<void> {
    try {
      await this.db.run(`
        INSERT INTO login_logs (
          user_id, username, ip_address, user_agent, 
          login_method, success, failure_reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        userId || null,
        username,
        clientInfo?.ip || null,
        clientInfo?.userAgent || null,
        'password',
        success,
        failureReason || null
      );
    } catch (error) {
      logger.error('记录登录日志失败:', error);
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
   * 清理用户敏感信息
   */
  private sanitizeUser(user: any): Omit<User, 'passwordHash' | 'salt'> {
    const { password_hash, salt, ...sanitizedUser } = user;
    return this.mapDbUserToUser(sanitizedUser);
  }

  /**
   * 映射数据库用户对象到User类型
   */
  private mapDbUserToUser(dbUser: any): User {
    const user: User = {
      id: dbUser.id?.toString(),
      username: dbUser.username,
      email: dbUser.email,
      passwordHash: dbUser.password_hash,
      salt: dbUser.salt,
      role: dbUser.role,
      status: dbUser.status,
      displayName: dbUser.display_name,
      avatarUrl: dbUser.avatar_url,
      settings: dbUser.settings ? JSON.parse(dbUser.settings) : undefined,
      loginCount: dbUser.login_count || 0,
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at)
    };
    
    // 单独处理lastLoginAt属性
    if (dbUser.last_login_at) {
      user.lastLoginAt = new Date(dbUser.last_login_at);
    }
    
    return user;
  }
}