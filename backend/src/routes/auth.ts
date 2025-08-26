import { Router } from 'express';
import { AuthorizationService } from '../services/AuthorizationService';
import { createAuthMiddleware } from '../middleware/auth';
import { AppError } from '../types';
import { logger } from '../utils/logger';

export function createAuthRoutes(): Router {
  const router = Router();
  const authorizationService = AuthorizationService.getInstance();
  const authMiddleware = createAuthMiddleware();

  // 创建外部授权令牌
  router.post('/external/create', 
    authMiddleware.authenticate,
    authMiddleware.requireRole(['admin', 'developer']),
    async (req, res) => {
      try {
        const { provider = 'temporary', scope, clientInfo, expiresIn = 3600 } = req.body;

        if (!['oauth', 'temporary'].includes(provider)) {
          throw new AppError('不支持的授权类型', 400, true, req.url);
        }

        if (expiresIn > 86400) { // 最长24小时
          throw new AppError('授权令牌有效期不能超过24小时', 400, true, req.url);
        }

        const result = await authorizationService.createExternalAuth({
          provider,
          scope,
          clientInfo,
          expiresIn
        });

        res.status(201).json(result);

      } catch (error: any) {
        throw new AppError(error.message || '创建授权令牌失败', 500, true, req.url);
      }
    }
  );

  // 验证授权令牌
  router.post('/external/validate', async (req, res): Promise<void> => {
    try {
      const { token } = req.body;

      if (!token) {
        throw new AppError('授权令牌不能为空', 400, true, req.url);
      }

      const validation = await authorizationService.validateAuthToken(token);

      if (!validation.valid) {
        throw new AppError('授权令牌无效或已过期', 401, true, req.url);
      }

      res.json({
        valid: true,
        token: validation.authToken
      });

    } catch (error: any) {
      throw new AppError(error.message || '验证授权令牌失败', 500, true, req.url);
    }
  });

  // 使用授权令牌登录
  router.post('/external/login', async (req, res): Promise<void> => {
    try {
      const { token, userId } = req.body;

      if (!token) {
        throw new AppError('授权令牌不能为空', 400, true, req.url);
      }

      const result = await authorizationService.loginWithAuthToken(token, userId);

      res.json(result);

    } catch (error: any) {
      throw new AppError(error.message || '外部授权登录失败', 401, true, req.url);
    }
  });

  // 撤销授权令牌
  router.post('/external/revoke',
    authMiddleware.authenticate,
    async (req, res) => {
      try {
        const { token } = req.body;

        if (!token) {
          throw new AppError('授权令牌不能为空', 400, true, req.url);
        }

        await authorizationService.revokeAuthToken(token);

        res.json({ message: '撤销授权令牌成功' });

      } catch (error: any) {
        throw new AppError(error.message || '撤销授权令牌失败', 500, true, req.url);
      }
    }
  );

  // 获取用户的授权令牌列表
  router.get('/external/tokens',
    authMiddleware.authenticate,
    async (req, res) => {
      try {
        const tokens = await authorizationService.getUserAuthTokens(req.user!.id);
        res.json(tokens);
      } catch (error: any) {
        throw new AppError(error.message || '获取授权令牌列表失败', 500, true, req.url);
      }
    }
  );

  // 创建临时访问令牌
  router.post('/temporary',
    authMiddleware.authenticate,
    authMiddleware.requireRole(['admin', 'developer']),
    async (req, res) => {
      try {
        const { scope = ['read'], expiresIn = 3600 } = req.body;

        if (expiresIn > 86400) { // 最长24小时
          throw new AppError('临时令牌有效期不能超过24小时', 400, true, req.url);
        }

        const result = await authorizationService.createTempToken(scope, expiresIn);
        res.status(201).json(result);
      } catch (error: any) {
        throw new AppError(error.message || '创建临时访问令牌失败', 500, true, req.url);
      }
    }
  );

  // 获取授权统计信息（仅管理员）
  router.get('/stats',
    authMiddleware.authenticate,
    authMiddleware.requireRole(['admin']),
    async (req, res) => {
      try {
        const stats = await authorizationService.getAuthStats();
        res.json(stats);
      } catch (error: any) {
        throw new AppError(error.message || '获取授权统计信息失败', 500, true, req.url);
      }
    }
  );

  // 清理过期的授权令牌（仅管理员）
  router.post('/cleanup',
    authMiddleware.authenticate,
    authMiddleware.requireRole(['admin']),
    async (req, res) => {
      try {
        const cleanedCount = await authorizationService.cleanupExpiredTokens();
        res.json({ 
          cleanedCount,
          message: `清理了 ${cleanedCount} 个过期的授权令牌`
        });
      } catch (error: any) {
        throw new AppError(error.message || '清理过期授权令牌失败', 500, true, req.url);
      }
    }
  );

  return router;
}