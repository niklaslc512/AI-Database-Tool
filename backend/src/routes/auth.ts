import { Router } from 'express';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { AuthorizationService } from '../services/AuthorizationService';
import { createAuthMiddleware } from '../middleware/auth';
import { ApiResponse } from '../types';
import { logger } from '../utils/logger';

export function createAuthRoutes(db: Database<sqlite3.Database, sqlite3.Statement>): Router {
  const router = Router();
  const authorizationService = new AuthorizationService(db);
  const authMiddleware = createAuthMiddleware(db);

  // 创建外部授权令牌
  router.post('/external/create', 
    authMiddleware.authenticate,
    authMiddleware.requireRole(['admin', 'user']),
    async (req, res) => {
      try {
        const { provider = 'temporary', scope, clientInfo, expiresIn = 3600 } = req.body;

        if (!['oauth', 'temporary'].includes(provider)) {
          res.status(400).json({
            success: false,
            message: '不支持的授权类型'
          } as ApiResponse);
          return;
        }

        if (expiresIn > 86400) { // 最长24小时
          res.status(400).json({
            success: false,
            message: '授权令牌有效期不能超过24小时'
          } as ApiResponse);
          return;
        }

        const result = await authorizationService.createExternalAuth({
          provider,
          scope,
          clientInfo,
          expiresIn
        });

        res.status(201).json({
          success: true,
          data: result,
          message: '创建授权令牌成功'
        } as ApiResponse);

      } catch (error: any) {
        logger.error('创建外部授权令牌失败:', error);
        res.status(500).json({
          success: false,
          message: error.message || '创建授权令牌失败'
        } as ApiResponse);
      }
    }
  );

  // 验证授权令牌
  router.post('/external/validate', async (req, res): Promise<void> => {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          message: '授权令牌不能为空'
        } as ApiResponse);
        return;
      }

      const validation = await authorizationService.validateAuthToken(token);

      if (!validation.valid) {
        res.status(401).json({
          success: false,
          message: '授权令牌无效或已过期'
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: {
          valid: true,
          token: validation.authToken
        },
        message: '授权令牌验证成功'
      } as ApiResponse);

    } catch (error: any) {
      logger.error('验证授权令牌失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '验证授权令牌失败'
      } as ApiResponse);
    }
  });

  // 使用授权令牌登录
  router.post('/external/login', async (req, res): Promise<void> => {
    try {
      const { token, userId } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          message: '授权令牌不能为空'
        } as ApiResponse);
        return;
      }

      const result = await authorizationService.loginWithAuthToken(token, userId);

      res.json({
        success: true,
        data: result,
        message: '外部授权登录成功'
      } as ApiResponse);

    } catch (error: any) {
      logger.error('外部授权登录失败:', error);
      res.status(401).json({
        success: false,
        message: error.message || '外部授权登录失败'
      } as ApiResponse);
    }
  });

  // 撤销授权令牌
  router.post('/external/revoke',
    authMiddleware.authenticate,
    async (req, res) => {
      try {
        const { token } = req.body;

        if (!token) {
          res.status(400).json({
            success: false,
            message: '授权令牌不能为空'
          } as ApiResponse);
          return;
        }

        await authorizationService.revokeAuthToken(token);

        res.json({
          success: true,
          message: '撤销授权令牌成功'
        } as ApiResponse);

      } catch (error: any) {
        logger.error('撤销授权令牌失败:', error);
        res.status(500).json({
          success: false,
          message: error.message || '撤销授权令牌失败'
        } as ApiResponse);
      }
    }
  );

  // 获取用户的授权令牌列表
  router.get('/external/tokens',
    authMiddleware.authenticate,
    async (req, res) => {
      try {
        const tokens = await authorizationService.getUserAuthTokens(req.user!.id);

        res.json({
          success: true,
          data: tokens,
          message: '获取授权令牌列表成功'
        } as ApiResponse);

      } catch (error: any) {
        logger.error('获取授权令牌列表失败:', error);
        res.status(500).json({
          success: false,
          message: error.message || '获取授权令牌列表失败'
        } as ApiResponse);
      }
    }
  );

  // 创建临时访问令牌
  router.post('/temporary',
    authMiddleware.authenticate,
    authMiddleware.requireRole(['admin', 'user']),
    async (req, res) => {
      try {
        const { scope = ['read'], expiresIn = 3600 } = req.body;

        if (expiresIn > 86400) { // 最长24小时
          res.status(400).json({
            success: false,
            message: '临时令牌有效期不能超过24小时'
          } as ApiResponse);
          return;
        }

        const result = await authorizationService.createTempToken(scope, expiresIn);

        res.status(201).json({
          success: true,
          data: result,
          message: '创建临时访问令牌成功'
        } as ApiResponse);

      } catch (error: any) {
        logger.error('创建临时访问令牌失败:', error);
        res.status(500).json({
          success: false,
          message: error.message || '创建临时访问令牌失败'
        } as ApiResponse);
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

        res.json({
          success: true,
          data: stats,
          message: '获取授权统计信息成功'
        } as ApiResponse);

      } catch (error: any) {
        logger.error('获取授权统计信息失败:', error);
        res.status(500).json({
          success: false,
          message: error.message || '获取授权统计信息失败'
        } as ApiResponse);
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
          success: true,
          data: { cleanedCount },
          message: `清理了 ${cleanedCount} 个过期的授权令牌`
        } as ApiResponse);

      } catch (error: any) {
        logger.error('清理过期授权令牌失败:', error);
        res.status(500).json({
          success: false,
          message: error.message || '清理过期授权令牌失败'
        } as ApiResponse);
      }
    }
  );

  return router;
}