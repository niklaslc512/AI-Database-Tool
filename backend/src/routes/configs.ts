import { Router, Request, Response } from 'express';
import { ConfigService } from '../services/ConfigService';
import { createAuthMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';
import { 
  AppError,
  CreateConfigRequest, 
  UpdateConfigRequest, 
  ConfigCategory,
  PaginationParams
} from '../types';

/**
 * 🔧 系统配置路由
 * 
 * 提供系统配置的完整管理接口，包括：
 * - 获取配置列表（分页、筛选）
 * - 获取单个配置详情
 * - 创建新配置
 * - 更新配置
 * - 删除配置
 * - 重新加载配置
 * 
 * 🔒 权限要求：只有admin角色可以访问所有接口
 */
export function createConfigRoutes(): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware();
  const configService = ConfigService.getInstance();

  // 🔒 所有配置管理接口都需要admin权限
  router.use(authMiddleware.authenticate);
  router.use(authMiddleware.requireRole(['admin']));

  /**
   * 📋 获取配置列表
   * GET /configs
   * 
   * Query参数:
   * - page: 页码（默认1）
   * - limit: 每页数量（默认20）
   * - sortBy: 排序字段（默认category）
   * - sortOrder: 排序方向（asc|desc，默认asc）
   * - category: 配置分类筛选
   * - includeValues: 是否包含配置值（默认true）
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'category',
        sortOrder = 'asc',
        category,
        includeValues = 'true'
      } = req.query;

      // 📋 构建分页参数
      const pagination: PaginationParams = {
        page: parseInt(page as string, 10),
        limit: Math.min(parseInt(limit as string, 10), 100), // 限制最大100条
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      // 🔍 获取配置列表
      const result = await configService.getConfigs(
        pagination,
        category as ConfigCategory,
        includeValues === 'true'
      );

      logger.info(`📋 管理员 ${req.user?.username} 查看配置列表，页码: ${pagination.page}`);

      res.json({
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('💥 获取配置列表失败:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('获取配置列表失败', 500);
    }
  });

  /**
   * 🔍 获取单个配置详情
   * GET /configs/:id
   * 
   * Query参数:
   * - includeValue: 是否包含配置值（默认true）
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { includeValue = 'true' } = req.query;

      if (!id) {
        throw new AppError('配置ID不能为空', 400);
      }

      const config = await configService.getConfigById(
        id as string, 
        includeValue === 'true'
      );

      logger.info(`🔍 管理员 ${req.user?.username} 查看配置详情: ${config.config_key}`);

      res.json(config);
    } catch (error) {
      logger.error('💥 获取配置详情失败:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('获取配置详情失败', 500);
    }
  });

  /**
   * ➕ 创建新配置
   * POST /configs
   * 
   * Body参数:
   * - key: 配置键（必需）
   * - value: 配置值（必需）
   * - type: 配置类型（string|number|boolean|json，默认string）
   * - description: 配置描述
   * - category: 配置分类（默认general）
   * - isSensitive: 是否敏感配置（默认false）
   * - isReadonly: 是否只读配置（默认false）
   * - validationRule: 验证规则（JSON格式）
   * - defaultValue: 默认值
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const request: CreateConfigRequest = req.body;

      // ✅ 基本验证
      if (!request.config_key || !request.config_value) {
        throw new AppError('配置键和配置值不能为空', 400);
      }

      // 🔑 验证配置键格式
      if (!/^[a-zA-Z][a-zA-Z0-9._-]*$/.test(request.config_key)) {
        throw new AppError('配置键格式无效，只能包含字母、数字、点、下划线和连字符，且必须以字母开头', 400);
      }

      const config = await configService.createConfig(request, req.user?.id);

      logger.info(`✅ 管理员 ${req.user?.username} 创建配置: ${config.config_key}`);

      res.status(201).json(config);
    } catch (error) {
      logger.error('💥 创建配置失败:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('创建配置失败', 500);
    }
  });

  /**
   * ✏️ 更新配置
   * PUT /configs/:id
   * 
   * Body参数:
   * - value: 配置值
   * - description: 配置描述
   * - category: 配置分类
   * - isSensitive: 是否敏感配置
   * - isReadonly: 是否只读配置
   * - validationRule: 验证规则
   * - defaultValue: 默认值
   */
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const request: UpdateConfigRequest = req.body;

      if (!id) {
        throw new AppError('配置ID不能为空', 400);
      }

      const config = await configService.updateConfig(id as string, request, req.user?.id);

      logger.info(`✅ 管理员 ${req.user?.username} 更新配置: ${config.config_key}`);

      res.json(config);
    } catch (error) {
      logger.error('💥 更新配置失败:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('更新配置失败', 500);
    }
  });

  /**
   * 🗑️ 删除配置
   * DELETE /configs/:id
   */
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new AppError('配置ID不能为空', 400);
      }

      // 🔍 先获取配置信息用于日志
      const config = await configService.getConfigById(id as string, false);
      
      await configService.deleteConfig(id as string, req.user?.id);

      logger.info(`✅ 管理员 ${req.user?.username} 删除配置: ${config.config_key}`);

      res.json({ message: '配置删除成功' });
    } catch (error) {
      logger.error('💥 删除配置失败:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('删除配置失败', 500);
    }
  });

  /**
   * 🔄 重新加载所有配置
   * POST /configs/reload
   * 
   * 从数据库重新加载所有配置到缓存和环境变量
   */
  router.post('/reload', async (req: Request, res: Response) => {
    try {
      await configService.reloadConfigs();

      logger.info(`🔄 管理员 ${req.user?.username} 重新加载系统配置`);

      res.json({ message: '配置重新加载成功' });
    } catch (error) {
      logger.error('💥 重新加载配置失败:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('重新加载配置失败', 500);
    }
  });

  /**
   * 🔑 根据key获取配置值
   * GET /configs/value/:key
   * 
   * 用于程序内部获取配置值，返回解析后的实际类型值
   */
  router.get('/value/:key', async (req: Request, res: Response) => {
    try {
      const { key } = req.params;

      if (!key) {
        throw new AppError('配置键不能为空', 400);
      }

      const value = await configService.getConfigValue(key as string);

      if (value === null) {
        throw new AppError('配置不存在', 404);
      }

      logger.info(`🔑 管理员 ${req.user?.username} 获取配置值: ${key}`);

      res.json({ key, value });
    } catch (error) {
      logger.error('💥 获取配置值失败:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('获取配置值失败', 500);
    }
  });



  return router;
}