import { Router } from 'express';
import { createUserRoutes } from './users';
import { createApiKeyRoutes } from './apiKeys';
import { createAuthRoutes } from './auth';
import { createConfigRoutes } from './configs';
import { createConnectionRoutes } from './connections';

export function createRoutes(): Router {
  const router = Router();

  console.log('🔍 创建路由器...');

  // 健康检查路由
  router.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'AI数据库管理系统API正常运行',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // 调试路由
  router.get('/debug', (req, res) => {
    res.json({
      success: true,
      message: '路由注册成功',
      timestamp: new Date().toISOString()
    });
  });

  // API信息路由
  router.get('/info', (req, res) => {
    res.json({
      success: true,
      data: {
        name: 'AI数据库管理系统',
        version: '1.0.0',
        description: '由大模型驱动的通用数据库管理系统',
        author: 'niklaslc',
        endpoints: {
          health: '/health',
          users: '/users',
          apiKeys: '/api-keys',
          auth: '/auth',
          configs: '/configs',
          connections: '/connections',
          query: '/query',
          ai: '/ai'
        }
      },
      timestamp: new Date().toISOString()
    });
  });

  console.log('🔗 注册用户路由...');
  // 用户管理路由
  router.use('/users', createUserRoutes());

  console.log('🔑 注册API密钥路由...');
  // API密钥管理路由
  router.use('/api-keys', createApiKeyRoutes());

  console.log('🔐 注册外部授权路由...');
  // 外部授权路由
  router.use('/auth', createAuthRoutes());

  console.log('🔧 注册系统配置路由...');
  // 系统配置路由（仅admin可访问）
  router.use('/configs', createConfigRoutes());

  console.log('🔗 注册数据库连接路由...');
  // 数据库连接管理路由
  router.use('/connections', createConnectionRoutes());

  // TODO: 在这里添加其他路由模块
  // router.use('/query', queryRoutes);
  // router.use('/ai', aiRoutes);

  console.log('✅ 路由注册完成');
  return router;
}