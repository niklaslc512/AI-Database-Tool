import { Router } from 'express';
import { UserService } from '../services/UserService';
import { createAuthMiddleware } from '../middleware/auth';
import { AppError, UserRole, UserStatus } from '../types';
import { RoleUtils } from '../utils/roleUtils';
import { logger } from '../utils/logger';

export function createUserRoutes(): Router {
  const router = Router();
  const userService = UserService.getInstance();
  const authMiddleware = createAuthMiddleware();

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

  // 🎭 创建用户（仅管理员）
  router.post('/',
    authMiddleware.authenticate,
    authMiddleware.requireRole(['admin']),
    async (req, res) => {
      try {
        const { username, email, password, roles, displayName, settings } = req.body;

        if (!username || !email || !password) {
          throw new AppError('用户名、邮箱和密码不能为空', 400, true, req.url);
        }

        // 🔍 验证角色格式
        let userRoles: UserRole[] = ['guest']; // 默认角色
        if (roles) {
          if (Array.isArray(roles)) {
            userRoles = roles.filter(role => ['admin', 'developer', 'guest'].includes(role));
          } else if (typeof roles === 'string') {
            userRoles = RoleUtils.parseRoles(roles);
          }
        }

        const user = await userService.createUser({
          username,
          email,
          password,
          roles: userRoles,
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

  // 🎭 添加用户角色（仅管理员）
  router.post('/:userId/roles',
    authMiddleware.authenticate,
    authMiddleware.requireRole(['admin']),
    async (req, res) => {
      try {
        const { userId } = req.params;
        const { role } = req.body;
        
        if (!userId || !role) {
          throw new AppError('用户ID和角色不能为空', 400, true, req.url);
        }
        
        if (!['admin', 'developer', 'guest'].includes(role)) {
          throw new AppError('无效的角色类型', 400, true, req.url);
        }
        
        const user = await userService.addUserRole(userId, role as UserRole);
        res.json(user);
      } catch (error: any) {
        throw new AppError(error.message || '添加用户角色失败', 500, true, req.url);
      }
    }
  );

  // 🎭 移除用户角色（仅管理员）
  router.delete('/:userId/roles/:role',
    authMiddleware.authenticate,
    authMiddleware.requireRole(['admin']),
    async (req, res) => {
      try {
        const { userId, role } = req.params;
        
        if (!userId || !role) {
          throw new AppError('用户ID和角色不能为空', 400, true, req.url);
        }
        
        if (!['admin', 'developer', 'guest'].includes(role)) {
          throw new AppError('无效的角色类型', 400, true, req.url);
        }
        
        const user = await userService.removeUserRole(userId, role as UserRole);
        res.json(user);
      } catch (error: any) {
        throw new AppError(error.message || '移除用户角色失败', 500, true, req.url);
      }
    }
  );

  // 🎭 设置用户角色（仅管理员）
  router.put('/:userId/roles',
    authMiddleware.authenticate,
    authMiddleware.requireRole(['admin']),
    async (req, res) => {
      try {
        const { userId } = req.params;
        const { roles } = req.body;
        
        if (!userId || !roles) {
          throw new AppError('用户ID和角色列表不能为空', 400, true, req.url);
        }
        
        let userRoles: UserRole[];
        if (Array.isArray(roles)) {
          userRoles = roles.filter(role => ['admin', 'developer', 'guest'].includes(role));
        } else if (typeof roles === 'string') {
          userRoles = RoleUtils.parseRoles(roles);
        } else {
          throw new AppError('角色格式无效', 400, true, req.url);
        }
        
        if (userRoles.length === 0) {
          throw new AppError('至少需要一个有效角色', 400, true, req.url);
        }
        
        const user = await userService.setUserRoles(userId, userRoles);
        res.json(user);
      } catch (error: any) {
        throw new AppError(error.message || '设置用户角色失败', 500, true, req.url);
      }
    }
  );

  // 🔍 获取用户角色信息（管理员或用户自己）
  router.get('/:userId/roles',
    authMiddleware.authenticate,
    authMiddleware.requireOwnerOrAdmin('userId'),
    async (req, res) => {
      try {
        const { userId } = req.params;
        
        if (!userId) {
          throw new AppError('用户ID不能为空', 400, true, req.url);
        }
        
        const user = await userService.getUserById(userId);
        const roleStats = RoleUtils.getRoleStats(user.roles);
        
        res.json({
          userId: user.id,
          username: user.username,
          roles: roleStats.roles,
          roleCount: roleStats.roleCount,
          permissions: roleStats.permissions,
          permissionCount: roleStats.permissionCount,
          displayNames: roleStats.displayNames,
          isAdmin: roleStats.isAdmin,
          isDeveloper: roleStats.isDeveloper,
          isGuest: roleStats.isGuest
        });
      } catch (error: any) {
        throw new AppError(error.message || '获取用户角色信息失败', 500, true, req.url);
      }
    }
  );

  // 🔐 检查用户权限（管理员或用户自己）
  router.get('/:userId/permissions/:permission',
    authMiddleware.authenticate,
    authMiddleware.requireOwnerOrAdmin('userId'),
    async (req, res) => {
      try {
        const { userId, permission } = req.params;
        
        if (!userId || !permission) {
          throw new AppError('用户ID和权限不能为空', 400, true, req.url);
        }
        
        const hasPermission = await userService.checkUserPermission(userId, permission);
        
        res.json({
          userId,
          permission,
          hasPermission
        });
      } catch (error: any) {
        throw new AppError(error.message || '检查用户权限失败', 500, true, req.url);
      }
    }
  );

  return router;
}