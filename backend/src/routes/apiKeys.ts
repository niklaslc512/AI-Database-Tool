import { Router } from 'express';
import { ApiKeyService } from '../services/ApiKeyService';
import { createAuthMiddleware } from '../middleware/auth';
import { AppError } from '../types';
import { RoleUtils } from '../utils/roleUtils';
import { logger } from '../utils/logger';

export function createApiKeyRoutes(): Router {
  const router = Router();
  const apiKeyService = ApiKeyService.getInstance();
  const authMiddleware = createAuthMiddleware();

  // 获取当前用户的API密钥列表
  router.get('/', authMiddleware.authenticate, async (req, res) => {
    try {
      const { includeInactive = false } = req.query;
      
      const apiKeys = await apiKeyService.getUserApiKeys(
        req.user!.id, 
        includeInactive === 'true'
      );

      res.json(apiKeys);
    } catch (error: any) {
      throw new AppError(error.message || '获取API密钥列表失败', 500, true, req.url);
    }
  });

  // 创建新的API密钥
  router.post('/', authMiddleware.authenticate, async (req, res): Promise<void> => {
    try {
      const { name, permissions, expiresAt } = req.body;

      if (!name || !name.trim()) {
        throw new AppError('API密钥名称不能为空', 400, true, req.url);
      }

      if (name.length > 50) {
        throw new AppError('API密钥名称不能超过50个字符', 400, true, req.url);
      }

      const createData: { name: string; permissions?: string[]; expiresAt?: Date } = {
        name: name.trim(),
        permissions
      };
      
      if (expiresAt) {
        createData.expiresAt = new Date(expiresAt);
      }

      const result = await apiKeyService.createApiKey(req.user!.id, createData);

      res.status(201).json(result);
    } catch (error: any) {
      throw new AppError(error.message || '创建API密钥失败', 500, true, req.url);
    }
  });

  // 获取指定API密钥详情
  router.get('/:keyId', authMiddleware.authenticate, async (req, res): Promise<void> => {
    try {
      const { keyId } = req.params;
      
      if (!keyId) {
        throw new AppError('API密钥ID不能为空', 400, true, req.url);
      }
      
      const apiKey = await apiKeyService.getApiKeyById(keyId);

      // 🔍 检查权限：只能查看自己的API密钥或管理员
      if (apiKey.userId !== req.user!.id && !RoleUtils.hasRole(req.user!.roles, 'admin')) {
        throw new AppError('权限不足', 403, true, req.url);
      }

      res.json(apiKey);
    } catch (error: any) {
      throw new AppError(error.message || '获取API密钥详情失败', 500, true, req.url);
    }
  });

  // 更新API密钥
  router.put('/:keyId', authMiddleware.authenticate, async (req, res): Promise<void> => {
    try {
      const { keyId } = req.params;
      const { name, permissions } = req.body;

      if (name && !name.trim()) {
        throw new AppError('API密钥名称不能为空', 400, true, req.url);
      }

      if (name && name.length > 50) {
        throw new AppError('API密钥名称不能超过50个字符', 400, true, req.url);
      }

      const updateData = {
        name: name?.trim(),
        permissions
      };

      const updatedApiKey = await apiKeyService.updateApiKey(keyId || '', req.user!.id, updateData);

      res.json(updatedApiKey);
    } catch (error: any) {
      throw new AppError(error.message || '更新API密钥失败', 500, true, req.url);
    }
  });

  // 停用API密钥
  router.patch('/:keyId/deactivate', authMiddleware.authenticate, async (req, res) => {
    try {
      const { keyId } = req.params;
      
      await apiKeyService.deactivateApiKey(keyId || '', req.user!.id);

      res.json({ message: '停用API密钥成功' });
    } catch (error: any) {
      throw new AppError(error.message || '停用API密钥失败', 500, true, req.url);
    }
  });

  // 删除API密钥
  router.delete('/:keyId', authMiddleware.authenticate, async (req, res) => {
    try {
      const { keyId } = req.params;
      
      await apiKeyService.deleteApiKey(keyId || '', req.user!.id);

      res.json({ message: '删除API密钥成功' });
    } catch (error: any) {
      throw new AppError(error.message || '删除API密钥失败', 500, true, req.url);
    }
  });

  // 获取API密钥使用统计
  router.get('/stats/usage', authMiddleware.authenticate, async (req, res) => {
    try {
      const stats = await apiKeyService.getApiKeyStats(req.user!.id);
      res.json(stats);
    } catch (error: any) {
      throw new AppError(error.message || '获取API密钥统计失败', 500, true, req.url);
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
          cleanedCount,
          message: `清理了 ${cleanedCount} 个过期的API密钥`
        });
      } catch (error: any) {
        throw new AppError(error.message || '清理过期API密钥失败', 500, true, req.url);
      }
    }
  );

  return router;
}