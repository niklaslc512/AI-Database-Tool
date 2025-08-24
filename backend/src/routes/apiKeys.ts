import { Router } from 'express';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { ApiKeyService } from '../services/ApiKeyService';
import { createAuthMiddleware } from '../middleware/auth';
import { ApiResponse } from '../types';
import { logger } from '../utils/logger';

export function createApiKeyRoutes(db: Database<sqlite3.Database, sqlite3.Statement>): Router {
  const router = Router();
  const apiKeyService = new ApiKeyService(db);
  const authMiddleware = createAuthMiddleware(db);

  // 获取当前用户的API密钥列表
  router.get('/', authMiddleware.authenticate, async (req, res) => {
    try {
      const { includeInactive = false } = req.query;
      
      const apiKeys = await apiKeyService.getUserApiKeys(
        req.user!.id, 
        includeInactive === 'true'
      );

      res.json({
        success: true,
        data: apiKeys,
        message: '获取API密钥列表成功'
      } as ApiResponse);

    } catch (error: any) {
      logger.error('获取API密钥列表失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取API密钥列表失败'
      } as ApiResponse);
    }
  });

  // 创建新的API密钥
  router.post('/', authMiddleware.authenticate, async (req, res): Promise<void> => {
    try {
      const { name, permissions, expiresAt } = req.body;

      if (!name || !name.trim()) {
        res.status(400).json({
          success: false,
          message: 'API密钥名称不能为空'
        } as ApiResponse);
        return;
      }

      if (name.length > 50) {
        res.status(400).json({
          success: false,
          message: 'API密钥名称不能超过50个字符'
        } as ApiResponse);
        return;
      }

      const createData: { name: string; permissions?: string[]; expiresAt?: Date } = {
        name: name.trim(),
        permissions
      };
      
      if (expiresAt) {
        createData.expiresAt = new Date(expiresAt);
      }

      const result = await apiKeyService.createApiKey(req.user!.id, createData);

      res.status(201).json({
        success: true,
        data: result,
        message: '创建API密钥成功'
      } as ApiResponse);

    } catch (error: any) {
      logger.error('创建API密钥失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '创建API密钥失败'
      } as ApiResponse);
    }
  });

  // 获取指定API密钥详情
  router.get('/:keyId', authMiddleware.authenticate, async (req, res): Promise<void> => {
    try {
      const { keyId } = req.params;
      
      if (!keyId) {
        res.status(400).json({
          success: false,
          message: 'API密钥ID不能为空'
        } as ApiResponse);
        return;
      }
      
      const apiKey = await apiKeyService.getApiKeyById(keyId);

      // 检查权限：只能查看自己的API密钥
      if (apiKey.userId !== req.user!.id && req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: '权限不足'
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: apiKey,
        message: '获取API密钥详情成功'
      } as ApiResponse);

    } catch (error: any) {
      logger.error('获取API密钥详情失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取API密钥详情失败'
      } as ApiResponse);
    }
  });

  // 更新API密钥
  router.put('/:keyId', authMiddleware.authenticate, async (req, res): Promise<void> => {
    try {
      const { keyId } = req.params;
      const { name, permissions } = req.body;

      if (name && !name.trim()) {
        res.status(400).json({
          success: false,
          message: 'API密钥名称不能为空'
        } as ApiResponse);
        return;
      }

      if (name && name.length > 50) {
        res.status(400).json({
          success: false,
          message: 'API密钥名称不能超过50个字符'
        } as ApiResponse);
        return;
      }

      const updateData = {
        name: name?.trim(),
        permissions
      };

      const updatedApiKey = await apiKeyService.updateApiKey(keyId || '', req.user!.id, updateData);

      res.json({
        success: true,
        data: updatedApiKey,
        message: '更新API密钥成功'
      } as ApiResponse);

    } catch (error: any) {
      logger.error('更新API密钥失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '更新API密钥失败'
      } as ApiResponse);
    }
  });

  // 停用API密钥
  router.patch('/:keyId/deactivate', authMiddleware.authenticate, async (req, res) => {
    try {
      const { keyId } = req.params;
      
      await apiKeyService.deactivateApiKey(keyId || '', req.user!.id);

      res.json({
        success: true,
        message: '停用API密钥成功'
      } as ApiResponse);

    } catch (error: any) {
      logger.error('停用API密钥失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '停用API密钥失败'
      } as ApiResponse);
    }
  });

  // 删除API密钥
  router.delete('/:keyId', authMiddleware.authenticate, async (req, res) => {
    try {
      const { keyId } = req.params;
      
      await apiKeyService.deleteApiKey(keyId || '', req.user!.id);

      res.json({
        success: true,
        message: '删除API密钥成功'
      } as ApiResponse);

    } catch (error: any) {
      logger.error('删除API密钥失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '删除API密钥失败'
      } as ApiResponse);
    }
  });

  // 获取API密钥使用统计
  router.get('/stats/usage', authMiddleware.authenticate, async (req, res) => {
    try {
      const stats = await apiKeyService.getApiKeyStats(req.user!.id);

      res.json({
        success: true,
        data: stats,
        message: '获取API密钥统计成功'
      } as ApiResponse);

    } catch (error: any) {
      logger.error('获取API密钥统计失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取API密钥统计失败'
      } as ApiResponse);
    }
  });

  // 清理过期的API密钥（仅管理员）
  router.post('/admin/cleanup', 
    authMiddleware.authenticate,
    authMiddleware.requireRole(['admin']),
    async (req, res) => {
      try {
        const cleanedCount = await apiKeyService.cleanupExpiredKeys();

        res.json({
          success: true,
          data: { cleanedCount },
          message: `清理了 ${cleanedCount} 个过期的API密钥`
        } as ApiResponse);

      } catch (error: any) {
        logger.error('清理过期API密钥失败:', error);
        res.status(500).json({
          success: false,
          message: error.message || '清理过期API密钥失败'
        } as ApiResponse);
      }
    }
  );

  return router;
}