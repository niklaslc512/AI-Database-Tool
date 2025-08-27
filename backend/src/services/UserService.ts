import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
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
import { BusinessLogger } from '../utils/enhancedLogger';
import { RoleUtils } from '../utils/roleUtils';
import { databaseManager } from '../config/database';

/**
 * 用户服务类 - 负责用户账户管理的核心业务逻辑
 * 
 * @description 提供用户注册、登录、信息管理等完整功能，支持密码加密、JWT认证、用户状态管理
 * @author AI数据库团队
 * @version 1.0.0
 * @example
 * ```typescript
 * const userService = UserService.getInstance();
 * const user = await userService.createUser({
 *   username: '张三',
 *   email: 'zhangsan@example.com',
 *   password: 'securePassword123'
 * });
 * ```
 */
export class UserService {
  private static instance: UserService;
  private saltRounds: number;
  private jwtSecret: string;
  private jwtExpiresIn: string;
  private logger: BusinessLogger;

  /**
   * 创建UserService实例
   */
  private constructor() {
    this.saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
    this.logger = new BusinessLogger('UserService');
  }

  /**
   * 获取UserService单例实例
   */
  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
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
   * 创建用户账户
   * 
   * @description 创建新用户账户，包含完整的数据验证和安全处理
   * @param userData - 用户创建数据
   * @param userData.username - 用户名（3-50字符，唯一）
   * @param userData.email - 邮箱地址（必须有效且唯一）
   * @param userData.password - 密码（最少6位字符）
   * @param userData.role - 用户角色（可选，默认为'user'）
   * @param userData.displayName - 显示名称（可选）
   * @param userData.settings - 用户设置（可选）
   * @returns Promise<User> 创建的用户对象（不包含敏感信息）
   * @throws {AppError} 当用户名或邮箱已存在时抛出400错误
   * @example
   * ```typescript
   * const user = await userService.createUser({
   *   username: 'zhangsan',
   *   email: 'zhangsan@example.com',
   *   password: 'securePassword123',
   *   displayName: '张三'
   * });
   * ```
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    const startTime = Date.now();
    
    try {
      this.logger.info('🚀 开始创建用户', { username: userData.username });
      
      // 检查用户名和邮箱是否已存在
      this.logger.debug('🔍 检查用户名和邮箱是否已存在');
      const existingUser = await this.executeQuery(`
        SELECT id FROM users WHERE username = ? OR email = ?
      `, [userData.username, userData.email]);

      if (existingUser) {
        this.logger.warn('⚠️ 用户名或邮箱已存在', { username: userData.username, email: userData.email });
        throw new AppError('用户名或邮箱已存在', 400);
      }

      // 生成密码哈希
      this.logger.debug('🔐 生成密码哈希');
      const salt = await bcrypt.genSalt(this.saltRounds);
      const passwordHash = await bcrypt.hash(userData.password, salt);

      // 🎭 处理用户角色
      const userRoles = userData.roles && userData.roles.length > 0 
        ? RoleUtils.stringifyRoles(userData.roles)
        : 'guest';  // 默认角色为guest
      
      this.logger.debug('🎭 设置用户角色', { roles: userRoles });

      // 插入用户数据
      const result = await this.executeRun(`
        INSERT INTO users (
          username, email, password_hash, salt, roles, display_name, settings
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        userData.username,
        userData.email,
        passwordHash,
        salt,
        userRoles,
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
      ]);

      const userId = result.lastID?.toString() || '';
      this.logger.info('✅ 用户创建成功', { userId, username: userData.username });
      this.logger.performance('创建用户', startTime);
      
      return this.getUserById(userId);
    } catch (error) {
      this.logger.error('❌ 用户创建失败', error as Error, { username: userData.username });
      throw error;
    }
  }

  /**
   * 用户登录认证
   * 
   * @description 验证用户凭据并生成JWT令牌，记录登录日志
   * @param loginData - 登录数据
   * @param loginData.username - 用户名或邮箱
   * @param loginData.password - 密码
   * @param clientInfo - 客户端信息（可选）
   * @param clientInfo.ip - 客户端IP地址
   * @param clientInfo.userAgent - 客户端User-Agent
   * @returns Promise<LoginResponse> 包含用户信息、token和过期时间
   * @throws {AppError} 当凭据无效或账户被锁定时抛出401错误
   */
  async login(loginData: LoginRequest, clientInfo?: { ip?: string; userAgent?: string }): Promise<LoginResponse> {
    const startTime = Date.now();
    
    try {
      this.logger.info('🚀 开始用户登录', { username: loginData.username, ip: clientInfo?.ip });
      
      // 查找用户
      this.logger.debug('🔍 查找用户信息');
      const user = await this.executeQuery(`
        SELECT * FROM users WHERE username = ? OR email = ?
      `, [loginData.username, loginData.username]) as any;

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
      await this.executeRun(`
        UPDATE users 
        SET last_login_at = CURRENT_TIMESTAMP, login_count = login_count + 1 
        WHERE id = ?
      `, [user.id]);

      // 记录登录成功
      // await this.logLoginAttempt(loginData.username, true, null, clientInfo, user.id);

      // 🔑 生成JWT令牌（包含多角色信息）
      const userRoles = RoleUtils.parseRoles(user.roles);
      const payload = {
        userId: user.id,
        username: user.username,
        roles: userRoles  // 🎭 包含角色数组
      };
      
      const secret = this.jwtSecret as string;
      const token = jwt.sign(payload, secret, { expiresIn: 86400 }); // 24小时
      
      this.logger.debug('🔑 JWT令牌生成成功', { userId: user.id, roles: userRoles });

      const expiresAt = new Date();
      expiresAt.setTime(expiresAt.getTime() + this.parseJwtExpiration(this.jwtExpiresIn));

      this.logger.info('✅ 用户登录成功', { userId: user.id, username: user.username });
      this.logger.performance('用户登录', startTime);
      this.logger.userAction(user.id, '登录成功', { ip: clientInfo?.ip, userAgent: clientInfo?.userAgent });

      return {
        user: this.sanitizeUser(user),
        token,
        expiresAt
      };
    } catch (error) {
      this.logger.error('❌ 用户登录失败', error as Error, { username: loginData.username, ip: clientInfo?.ip });
      throw error;
    }
  }

  /**
   * 根据ID获取用户
   */
  async getUserById(id: string): Promise<User> {
    const user = await this.executeQuery('SELECT * FROM users WHERE id = ?', [id]) as any;
    if (!user) {
      throw new AppError('用户不存在', 404);
    }
    return this.mapDbUserToUser(user);
  }

  /**
   * 根据用户名获取用户
   */
  async getUserByUsername(username: string): Promise<User> {
    const user = await this.executeQuery('SELECT * FROM users WHERE username = ?', [username]) as any;
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
      const existingUser = await this.executeQuery('SELECT * FROM users WHERE id = ?', [id]) as any;
      if (!existingUser) {
        throw new AppError('用户不存在', 404);
      }

      // 检查邮箱是否被其他用户使用
      if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await this.executeQuery('SELECT id FROM users WHERE email = ? AND id != ?', [updateData.email, id]);
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
      await this.executeRun(updateQuery, values);

      this.logger.info('✅ 更新用户信息成功', { userId: id, username: existingUser.username });
      this.logger.userAction(id, '更新用户信息', { updates });
      return this.getUserById(id);
    } catch (error) {
      this.logger.error('❌ 更新用户信息失败', error as Error, { userId: id });
      throw error;
    }
  }

  /**
   * 删除用户
   */
  async deleteUser(id: string): Promise<void> {
    try {
      const user = await this.executeQuery('SELECT username FROM users WHERE id = ?', [id]) as any;
      if (!user) {
        throw new AppError('用户不存在', 404);
      }

      await this.executeRun('DELETE FROM users WHERE id = ?', [id]);
      this.logger.info('✅ 删除用户成功', { userId: id, username: user.username });
      this.logger.userAction(id, '删除用户', { username: user.username });
    } catch (error) {
      this.logger.error('❌ 删除用户失败', error as Error, { userId: id });
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
        // 🎭 支持多角色查询，使用LIKE匹配
        conditions.push('(roles = ? OR roles LIKE ? OR roles LIKE ? OR roles LIKE ?)');
        values.push(role, `${role},%`, `%,${role}`, `%,${role},%`);
      }

      if (status) {
        conditions.push('status = ?');
        values.push(status);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // 获取总数
      const countQuery = `SELECT COUNT(*) as count FROM users ${whereClause}`;
      const countResult = await this.executeQuery(countQuery, values) as any;
      const total = countResult.count;

      // 获取用户列表
      const usersQuery = `
        SELECT * FROM users 
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
        LIMIT ? OFFSET ?
      `;
      
      const users = await this.executeAll(usersQuery, [...values, limit, offset]) as any[];
      
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
      this.logger.error('❌ 获取用户列表失败', error as Error, { params });
      throw error;
    }
  }

  /**
   * 修改密码
   */
  async changePassword(id: string, oldPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await this.executeQuery('SELECT * FROM users WHERE id = ?', [id]) as any;
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
      await this.executeRun(`
        UPDATE users 
        SET password_hash = ?, salt = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [passwordHash, salt, id]);

      this.logger.info('✅ 用户修改密码成功', { userId: id, username: user.username });
      this.logger.userAction(id, '修改密码', { username: user.username });
      this.logger.securityEvent('密码修改', 'medium', { userId: id, username: user.username });
    } catch (error) {
      this.logger.error('❌ 修改密码失败', error as Error, { userId: id });
      this.logger.securityEvent('密码修改失败', 'high', { userId: id, error: (error as Error).message });
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
      await this.executeRun(`
        INSERT INTO login_logs (
          user_id, username, ip_address, user_agent, 
          login_method, success, failure_reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        [userId || null,
        username,
        clientInfo?.ip || null,
        clientInfo?.userAgent || null,
        'password',
        success,
        failureReason || null]
      );
    } catch (error) {
      this.logger.error('❌ 记录登录日志失败', error as Error, { username, success });
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
   * 🗂️ 映射数据库用户对象到User类型
   */
  private mapDbUserToUser(dbUser: any): User {
    const user: User = {
      id: dbUser.id,  // 🔧 UUID字符串，无需转换
      username: dbUser.username,
      email: dbUser.email,
      passwordHash: dbUser.password_hash,
      salt: dbUser.salt,
      roles: dbUser.roles || 'guest',  // 🎭 使用多角色字段
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

  /**
   * 🎭 添加角色管理方法
   */
  async addUserRole(userId: string, role: UserRole): Promise<User> {
    try {
      const user = await this.getUserById(userId);
      const newRoles = RoleUtils.addRole(user.roles, role);
      
      await this.executeRun(`
        UPDATE users SET roles = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `, [newRoles, userId]);
      
      this.logger.info('✅ 添加用户角色成功', { userId, role, newRoles });
      this.logger.userAction(userId, '添加角色', { role, newRoles });
      
      return this.getUserById(userId);
    } catch (error) {
      this.logger.error('❌ 添加用户角色失败', error as Error, { userId, role });
      throw error;
    }
  }

  /**
   * 🎭 移除用户角色
   */
  async removeUserRole(userId: string, role: UserRole): Promise<User> {
    try {
      const user = await this.getUserById(userId);
      const newRoles = RoleUtils.removeRole(user.roles, role);
      
      await this.executeRun(`
        UPDATE users SET roles = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `, [newRoles, userId]);
      
      this.logger.info('✅ 移除用户角色成功', { userId, role, newRoles });
      this.logger.userAction(userId, '移除角色', { role, newRoles });
      
      return this.getUserById(userId);
    } catch (error) {
      this.logger.error('❌ 移除用户角色失败', error as Error, { userId, role });
      throw error;
    }
  }

  /**
   * 🎭 设置用户角色
   */
  async setUserRoles(userId: string, roles: UserRole[]): Promise<User> {
    try {
      const rolesString = RoleUtils.stringifyRoles(roles);
      
      await this.executeRun(`
        UPDATE users SET roles = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `, [rolesString, userId]);
      
      this.logger.info('✅ 设置用户角色成功', { userId, roles: rolesString });
      this.logger.userAction(userId, '设置角色', { roles: rolesString });
      
      return this.getUserById(userId);
    } catch (error) {
      this.logger.error('❌ 设置用户角色失败', error as Error, { userId, roles });
      throw error;
    }
  }

  /**
   * 🔍 检查用户权限
   */
  async checkUserPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      return RoleUtils.hasPermission(user.roles, permission as any);
    } catch (error) {
      this.logger.error('❌ 检查用户权限失败', error as Error, { userId, permission });
      return false;
    }
  }
}