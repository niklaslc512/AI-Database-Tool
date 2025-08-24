import { Router } from 'express';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { UserService } from '../services/UserService';
import { createAuthMiddleware } from '../middleware/auth';
import { AppError, UserRole, UserStatus } from '../types';
import { logger } from '../utils/logger';

export function createUserRoutes(db: Database<sqlite3.Database, sqlite3.Statement>): Router {
  const router = Router();
  const userService = new UserService(db);
  const authMiddleware = createAuthMiddleware(db);

  // 用户登录
  router.post('/auth/login', async (req, res) => {
    try {
      const { username, password, rememberMe } = req.body;
      
      if (!username || !password) {
        throw new AppError('用户名和密码不能为空', 400, true, req.url);
      }

      const clientInfo: { ip?: string; userAgent?: string } = {};
      
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      
      if (ip) clientInfo.ip = ip;
      if (userAgent) clientInfo.userAgent = userAgent;

      const result = await userService.login(
        { username, password, rememberMe },
        clientInfo
      );

      res.json(result);

    } catch (error: any) {
      throw new AppError(error.message || '登录失败', 401, true, req.url);
    }
  });

  // 获取当前用户信息
  router.get('/me', authMiddleware.authenticate, async (req, res) => {
    try {
      const user = await userService.getUserById(req.user!.id);
      res.json(user);
    } catch (error: any) {
      throw new AppError(error.message || '获取用户信息失败', 500, true, req.url);
    }
  });

  // 更新当前用户信息
  router.put('/me', authMiddleware.authenticate, async (req, res) => {
    try {
      const { displayName, email, settings } = req.body;
      
      const updatedUser = await userService.updateUser(req.user!.id, {
        displayName,
        email,
        settings
      });

      res.json(updatedUser);
    } catch (error: any) {
      throw new AppError(error.message || '更新用户信息失败', 500, true, req.url);
    }
  });

  // 修改密码
  router.put('/me/password', authMiddleware.authenticate, async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      
      if (!oldPassword || !newPassword) {
        throw new AppError('原密码和新密码不能为空', 400, true, req.url);
      }

      if (newPassword.length < 6) {
        throw new AppError('新密码至少6个字符', 400, true, req.url);
      }

      await userService.changePassword(req.user!.id, oldPassword, newPassword);

      res.json({ message: '密码修改成功' });
    } catch (error: any) {
      throw new AppError(error.message || '修改密码失败', 500, true, req.url);
    }
  });

  // 获取用户列表（仅管理员）
  router.get('/', 
    authMiddleware.authenticate,
    authMiddleware.requireRole(['admin']),
    async (req, res) => {
      try {
        const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc', role, status } = req.query;

        const baseParams = {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          sortBy: sortBy as string,
          sortOrder: sortOrder as 'asc' | 'desc'
        };
        
        const params: typeof baseParams & { role?: UserRole; status?: UserStatus } = { ...baseParams };
        
        if (role && role !== '') {
          params.role = role as UserRole;
        }
        
        if (status && status !== '') {
          params.status = status as UserStatus;
        }

        const result = await userService.getUsers(params);
        res.json(result);
      } catch (error: any) {
        throw new AppError(error.message || '获取用户列表失败', 500, true, req.url);
      }
    }
  );

  // 创建用户（仅管理员）
  router.post('/',
    authMiddleware.authenticate,
    authMiddleware.requireRole(['admin']),
    async (req, res) => {
      try {
        const { username, email, password, role, displayName, settings } = req.body;

        if (!username || !email || !password) {
          throw new AppError('用户名、邮箱和密码不能为空', 400, true, req.url);
        }

        const user = await userService.createUser({
          username,
          email,
          password,
          role,
          displayName,
          settings
        });

        res.status(201).json(user);
      } catch (error: any) {
        throw new AppError(error.message || '创建用户失败', 500, true, req.url);
      }
    }
  );

  // 获取指定用户信息（管理员或用户自己）
  router.get('/:userId',
    authMiddleware.authenticate,
    authMiddleware.requireOwnerOrAdmin('userId'),
    async (req, res) => {
      try {
        const { userId } = req.params;
        
        if (!userId) {
          throw new AppError('用户ID不能为空', 400, true, req.url);
        }
        
        const user = await userService.getUserById(userId);
        res.json(user);
      } catch (error: any) {
        throw new AppError(error.message || '获取用户信息失败', 500, true, req.url);
      }
    }
  );

  // 更新指定用户信息（管理员或用户自己）
  router.put('/:userId',
    authMiddleware.authenticate,
    authMiddleware.requireOwnerOrAdmin('userId'),
    async (req, res) => {
      try {
        const { userId } = req.params;
        
        if (!userId) {
          throw new AppError('用户ID不能为空', 400, true, req.url);
        }
        
        const { displayName, email, settings } = req.body;

        const updatedUser = await userService.updateUser(userId, {
          displayName,
          email,
          settings
        });

        res.json(updatedUser);
      } catch (error: any) {
        throw new AppError(error.message || '更新用户信息失败', 500, true, req.url);
      }
    }
  );

  // 删除用户（仅管理员）
  router.delete('/:userId',
    authMiddleware.authenticate,
    authMiddleware.requireRole(['admin']),
    async (req, res) => {
      try {
        const { userId } = req.params;
        
        if (!userId) {
          throw new AppError('用户ID不能为空', 400, true, req.url);
        }

        // 不能删除自己
        if (userId === req.user!.id) {
          throw new AppError('不能删除自己的账户', 400, true, req.url);
        }

        await userService.deleteUser(userId);
        res.json({ message: '删除用户成功' });
      } catch (error: any) {
        throw new AppError(error.message || '删除用户失败', 500, true, req.url);
      }
    }
  );

  return router;
}