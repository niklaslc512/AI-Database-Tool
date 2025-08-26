import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiKeyService } from '../services/ApiKeyService';
import { UserService } from '../services/UserService';
import { AppError } from '../types';
import { logger } from '../utils/logger';

// 扩展Express Request类型
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        role: string;
        authMethod: 'jwt' | 'api_key';
      };
      apiKey?: {
        id: string;
        name: string;
        permissions?: string[];
      };
    }
  }
}

export class AuthMiddleware {
  private jwtSecret: string;
  private apiKeyService: ApiKeyService;
  private userService: UserService;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.apiKeyService = ApiKeyService.getInstance();
    this.userService = UserService.getInstance();
  }

  /**
   * JWT认证中间件
   */
  authenticateJWT = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError('缺少认证令牌', 401);
      }

      const token = authHeader.substring(7);
      
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      // 验证用户是否仍然存在且状态正常
      const user = await this.userService.getUserById(decoded.userId);
      if (user.status !== 'active') {
        throw new AppError('用户账户已被锁定', 401);
      }

      req.user = {
        id: decoded.userId,
        username: decoded.username,
        role: decoded.role,
        authMethod: 'jwt'
      };

      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        logger.warn(`JWT验证失败: ${error.message}`);
        res.status(401).json({
          success: false,
          message: '无效的认证令牌'
        });
        return;
      }
      
      logger.error('JWT认证中间件错误:', error);
      res.status(401).json({
        success: false,
        message: error instanceof AppError ? error.message : '认证失败'
      });
      return;
    }
  };

  /**
   * API Key认证中间件
   */
  authenticateApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const apiKey = req.headers['x-api-key'] as string;
      
      if (!apiKey) {
        throw new AppError('缺少API密钥', 401);
      }

      const validation = await this.apiKeyService.validateApiKey(apiKey);
      if (!validation.valid || !validation.apiKey || !validation.user) {
        throw new AppError('无效的API密钥', 401);
      }

      req.user = {
        id: validation.user.id,
        username: validation.user.username,
        role: validation.user.role,
        authMethod: 'api_key'
      };

      req.apiKey = {
        id: validation.apiKey.id,
        name: validation.apiKey.name,
        permissions: validation.apiKey.permissions || []
      };

      next();
    } catch (error) {
      logger.error('API Key认证中间件错误:', error);
      res.status(401).json({
        success: false,
        message: error instanceof AppError ? error.message : 'API密钥认证失败'
      });
      return;
    }
  };

  /**
   * 通用认证中间件（支持JWT和API Key）
   */
  authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // 使用JWT认证
      return this.authenticateJWT(req, res, next);
    } else if (apiKey) {
      // 使用API Key认证
      return this.authenticateApiKey(req, res, next);
    } else {
      return res.status(401).json({
        success: false,
        message: '缺少认证信息'
      });
    }
  };

  /**
   * 角色权限检查中间件
   */
  requireRole = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: '用户未认证'
        });
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        logger.warn(`用户 ${req.user.username} 尝试访问需要角色 [${allowedRoles.join(', ')}] 的资源，当前角色: ${req.user.role}`);
        res.status(403).json({
          success: false,
          message: '权限不足'
        });
        return;
      }

      next();
    };
  };

  /**
   * 权限检查中间件
   */
  requirePermission = (requiredPermissions: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '用户未认证'
        });
      }

      // 管理员拥有所有权限
      if (req.user.role === 'admin') {
        return next();
      }

      // 检查API Key权限
      if (req.apiKey && req.apiKey.permissions) {
        const hasPermission = requiredPermissions.some(permission => 
          req.apiKey!.permissions!.includes(permission)
        );
        
        if (!hasPermission) {
          logger.warn(`API Key ${req.apiKey.name} 缺少权限: [${requiredPermissions.join(', ')}]`);
          return res.status(403).json({
            success: false,
            message: 'API密钥权限不足'
          });
        }
      }

      next();
    };
  };

  /**
   * 可选认证中间件（不强制要求认证）
   */
  optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        await this.authenticateJWT(req, res, () => {});
      } catch (error) {
        // 忽略认证错误，继续处理请求
      }
    } else if (apiKey) {
      try {
        await this.authenticateApiKey(req, res, () => {});
      } catch (error) {
        // 忽略认证错误，继续处理请求
      }
    }

    next();
  };

  /**
   * 用户自己或管理员权限检查
   */
  requireOwnerOrAdmin = (userIdParam: string = 'userId') => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '用户未认证'
        });
      }

      const targetUserId = req.params[userIdParam] || req.body.userId;
      
      // 管理员可以访问任何用户的资源
      if (req.user.role === 'admin') {
        return next();
      }

      // 用户只能访问自己的资源
      if (req.user.id !== targetUserId) {
        logger.warn(`用户 ${req.user.username} 尝试访问用户 ${targetUserId} 的资源`);
        return res.status(403).json({
          success: false,
          message: '只能访问自己的资源'
        });
      }

      next();
    };
  };
}

// 创建中间件实例的工厂函数
export function createAuthMiddleware() {
  return new AuthMiddleware();
}