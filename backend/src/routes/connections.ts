import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { AuthMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';
import { DatabaseType, AppError } from '../types';

/**
 * 🔗 数据库连接管理路由
 * 
 * 提供数据库连接的完整管理接口，包括：
 * - 连接列表查询
 * - 创建新连接
 * - 连接详情获取
 * - 连接配置更新
 * - 连接删除
 * - 连接测试
 */
export function createConnectionRoutes(): Router {
  const router = Router();

  // 创建认证中间件实例
  const authMiddleware = new AuthMiddleware();

  // 所有路由都需要认证
  router.use(authMiddleware.authenticate);

  /**
   * 📊 获取支持的数据库类型
   * GET /api/connections/types
   */
  router.get('/types', async (req: Request, res: Response) => {
    try {
      const supportedTypes = await DatabaseService.getSupportedDatabaseTypes();
      
      res.json({
        success: true,
        data: supportedTypes,
        message: '获取支持的数据库类型成功'
      });
    } catch (error) {
      logger.error('获取支持的数据库类型失败:', error);
      res.status(500).json({
        success: false,
        message: '获取支持的数据库类型失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  });

  /**
   * 📋 获取用户的数据库连接列表
   * GET /api/connections
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('用户未认证', 401);
      }

      const connections = await DatabaseService.getUserConnections(userId);
      res.json(connections);
    } catch (error) {
      logger.error('获取连接列表失败:', error);
      throw new AppError('获取连接列表失败', 500);
    }
  });

  /**
   * ➕ 创建新的数据库连接
   * POST /api/connections
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('用户未认证', 401);
      }

      const { name, type, dsn, metadata } = req.body;

      // 验证必填字段
      if (!name || !type || !dsn) {
        throw new AppError('缺少必填字段: name, type, dsn', 400);
      }

      // 验证数据库类型
      const validTypes: DatabaseType[] = ['postgresql', 'mongodb'];
      if (!validTypes.includes(type)) {
        throw new AppError(`不支持的数据库类型: ${type}。支持的类型: ${validTypes.join(', ')}`, 400);
      }

      const connectionData = {
        name,
        type: type as DatabaseType,
        dsn,
        status: 'inactive' as const,
        metadata
      };

      const connection = await DatabaseService.createConnection(userId, connectionData);
      res.status(201).json(connection);
    } catch (error) {
      logger.error('创建数据库连接失败:', error);
      throw new AppError('创建数据库连接失败', 500);
    }
  });

  /**
   * 🔍 获取指定数据库连接详情
   * GET /api/connections/:id
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const connectionId = req.params.id;

      if (!userId) {
        throw new AppError('用户未认证', 401);
      }

      if (!connectionId) {
        throw new AppError('连接ID不能为空', 400);
      }

      const connections = await DatabaseService.getUserConnections(userId);
      const connection = connections.find(conn => conn.id === connectionId);

      if (!connection) {
        throw new AppError('数据库连接不存在或无权访问', 404);
      }

      res.json(connection);
    } catch (error) {
      logger.error('获取连接详情失败:', error);
      throw new AppError('获取连接详情失败', 500);
    }
  });

  /**
   * ✏️ 更新数据库连接配置
   * PUT /api/connections/:id
   */
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const connectionId = req.params.id;
      const { name, dsn, metadata } = req.body;

      if (!userId) {
        throw new AppError('用户未认证', 401);
      }

      if (!connectionId) {
        throw new AppError('连接ID不能为空', 400);
      }

      // 验证连接是否存在且属于当前用户
      const connections = await DatabaseService.getUserConnections(userId);
      const existingConnection = connections.find(conn => conn.id === connectionId);

      if (!existingConnection) {
        throw new AppError('数据库连接不存在或无权访问', 404);
      }

      // 构建更新数据
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (dsn !== undefined) updateData.dsn = dsn;
      if (metadata !== undefined) updateData.metadata = metadata;

      if (Object.keys(updateData).length === 0) {
        throw new AppError('没有提供要更新的字段', 400);
      }

      // 如果更新了DSN，需要重新测试连接
      if (dsn) {
        const testConnection = {
          ...existingConnection,
          dsn
        };
        const testResult = await DatabaseService.testConnection(testConnection);
        updateData.status = testResult ? 'active' : 'error';
        updateData.last_tested_at = new Date().toISOString();
        updateData.test_result = testResult ? '连接测试成功' : '连接测试失败';
      }

      // 执行更新 - 使用静态方法
      await DatabaseService.updateConnection(connectionId, updateData);

      // 获取更新后的连接信息
      const updatedConnections = await DatabaseService.getUserConnections(userId);
      const updatedConnection = updatedConnections.find(conn => conn.id === connectionId);

      res.json(updatedConnection);
    } catch (error) {
      logger.error('更新数据库连接失败:', error);
      throw new AppError('更新数据库连接失败', 500);
    }
  });

  /**
   * 🗑️ 删除数据库连接
   * DELETE /api/connections/:id
   */
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const connectionId = req.params.id;

      if (!userId) {
        throw new AppError('用户未认证', 401);
      }

      if (!connectionId) {
        throw new AppError('连接ID不能为空', 400);
      }

      // 验证连接是否存在且属于当前用户
      const connections = await DatabaseService.getUserConnections(userId);
      const connection = connections.find(conn => conn.id === connectionId);

      if (!connection) {
        throw new AppError('数据库连接不存在或无权访问', 404);
      }

      await DatabaseService.deleteConnection(connectionId);

      res.json({ message: '数据库连接删除成功' });
    } catch (error) {
      logger.error('删除数据库连接失败:', error);
      throw new AppError('删除数据库连接失败', 500);
    }
  });

  /**
   * 🔧 测试数据库连接
   * POST /api/connections/:id/test
   */
  router.post('/:id/test', async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const connectionId = req.params.id;

      if (!userId) {
        throw new AppError('用户未认证', 401);
      }

      if (!connectionId) {
        throw new AppError('连接ID不能为空', 400);
      }

      // 验证连接是否存在且属于当前用户
      const connections = await DatabaseService.getUserConnections(userId);
      const connection = connections.find(conn => conn.id === connectionId);

      if (!connection) {
        throw new AppError('数据库连接不存在或无权访问', 404);
      }

      const testResult = await DatabaseService.testConnection(connection);
      const status = testResult ? 'active' : 'error';
      const message = testResult ? '连接测试成功' : '连接测试失败';

      // 更新连接状态 - 使用静态方法
      await DatabaseService.updateConnectionStatus(connectionId, status, message);

      res.json({
        status,
        testResult: message,
        lastTestedAt: new Date()
      });
    } catch (error) {
      logger.error('测试数据库连接失败:', error);
      throw new AppError('测试数据库连接失败', 500);
    }
  });

  return router;
}