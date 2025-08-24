import { Router } from 'express';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { UserService } from '../services/UserService';
import { createAuthMiddleware } from '../middleware/auth';
import { ApiResponse, UserRole, UserStatus } from '../types';
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
        res.status(400).json({
          success: false,
          message: '用户名和密码不能为空'
        } as ApiResponse);
        return;
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

      res.json({
        success: true,
        data: result,
        message: '登录成功'
      } as ApiResponse);

    } catch (error: any) {
      logger.error('用户登录失败:', error);
      res.status(401).json({
        success: false,
        message: error.message || '登录失败'
      } as ApiResponse);
    }
  });

  // 获取当前用户信息
  router.get('/me', authMiddleware.authenticate, async (req, res) => {
    try {
      const user = await userService.getUserById(req.user!.id);
      
      res.json({
        success: true,
        data: user,
        message: '获取用户信息成功'
      } as ApiResponse);

    } catch (error: any) {
      logger.error('获取用户信息失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取用户信息失败'
      } as ApiResponse);
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

      res.json({
        success: true,
        data: updatedUser,
        message: '更新用户信息成功'
      } as ApiResponse);

    } catch (error: any) {
      logger.error('更新用户信息失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '更新用户信息失败'
      } as ApiResponse);
    }
  });

  // 修改密码
  router.put('/me/password', authMiddleware.authenticate, async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      
      if (!oldPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: '原密码和新密码不能为空'
        } as ApiResponse);
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({
          success: false,
          message: '新密码至少6个字符'
        } as ApiResponse);
        return;
      }

      await userService.changePassword(req.user!.id, oldPassword, newPassword);

      res.json({
        success: true,
        message: '密码修改成功'
      } as ApiResponse);

    } catch (error: any) {
      logger.error('修改密码失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '修改密码失败'
      } as ApiResponse);
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

        res.json({
          success: true,
          data: result,
          message: '获取用户列表成功'
        } as ApiResponse);

      } catch (error: any) {
        logger.error('获取用户列表失败:', error);
        res.status(500).json({
          success: false,
          message: error.message || '获取用户列表失败'
        } as ApiResponse);
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
          res.status(400).json({
            success: false,
            message: '用户名、邮箱和密码不能为空'
          } as ApiResponse);
          return;
        }

        const user = await userService.createUser({
          username,
          email,
          password,
          role,
          displayName,
          settings
        });

        res.status(201).json({
          success: true,
          data: user,
          message: '创建用户成功'
        } as ApiResponse);

      } catch (error: any) {
        logger.error('创建用户失败:', error);
        res.status(500).json({
          success: false,
          message: error.message || '创建用户失败'
        } as ApiResponse);
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
          res.status(400).json({
            success: false,
            message: '用户ID不能为空'
          } as ApiResponse);
          return;
        }
        
        const user = await userService.getUserById(userId);

        res.json({
          success: true,
          data: user,
          message: '获取用户信息成功'
        } as ApiResponse);

      } catch (error: any) {
        logger.error('获取用户信息失败:', error);
        res.status(500).json({
          success: false,
          message: error.message || '获取用户信息失败'
        } as ApiResponse);
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
          res.status(400).json({
            success: false,
            message: '用户ID不能为空'
          } as ApiResponse);
          return;
        }
        
        const { displayName, email, settings } = req.body;

        const updatedUser = await userService.updateUser(userId, {
          displayName,
          email,
          settings
        });

        res.json({
          success: true,
          data: updatedUser,
          message: '更新用户信息成功'
        } as ApiResponse);

      } catch (error: any) {
        logger.error('更新用户信息失败:', error);
        res.status(500).json({
          success: false,
          message: error.message || '更新用户信息失败'
        } as ApiResponse);
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
          res.status(400).json({
            success: false,
            message: '用户ID不能为空'
          } as ApiResponse);
          return;
        }

        // 不能删除自己
        if (userId === req.user!.id) {
          res.status(400).json({
            success: false,
            message: '不能删除自己的账户'
          } as ApiResponse);
          return;
        }

        await userService.deleteUser(userId);

        res.json({
          success: true,
          message: '删除用户成功'
        } as ApiResponse);

      } catch (error: any) {
        logger.error('删除用户失败:', error);
        res.status(500).json({
          success: false,
          message: error.message || '删除用户失败'
        } as ApiResponse);
      }
    }
  );

  return router;
}