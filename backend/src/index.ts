import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';

import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { requestLogger } from './utils/logger';
import { connectDatabase, getDatabase } from './config/database';
import { createRoutes } from './routes';

// 加载环境变量
dotenv.config();

class App {
  public app: express.Application;
  public port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000', 10);
    
    this.initializeMiddleware();
    // 错误处理将在路由注册后进行
  }

  /**
   * 初始化中间件
   */
  private initializeMiddleware(): void {
    // 安全中间件
    this.app.use(helmet());
    
    // CORS配置
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // 压缩响应
    this.app.use(compression());

    // 请求日志
    this.app.use(morgan('combined', { stream: requestLogger.stream }));

    // 简单的限流配置
    const limiter = {
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 100 // 限制每个IP每15分钟最多100个请求
    };
    // 这里暂时注释掉限流，后续可以添加express-rate-limit包
    // this.app.use(rateLimiter);

    // 解析请求体
    this.app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: process.env.MAX_FILE_SIZE || '10mb' }));

    // 静态文件服务
    this.app.use('/uploads', express.static('uploads'));
  }

  /**
   * 初始化路由
   */
  private async initializeRoutes(): Promise<void> {
    // 健康检查
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
      });
    });

    console.log('🔄 初始化API路由...');
    // 获取数据库连接并创建API路由
    const db = await getDatabase();
    const routes = createRoutes(db);
    const apiPrefix = process.env.API_PREFIX || '/api/v1';
    this.app.use(apiPrefix, routes);
    console.log(`✅ API路由注册成功: ${apiPrefix}`);
  }

  /**
   * 初始化错误处理
   */
  private initializeErrorHandling(): void {
    // 404处理
    this.app.use(notFoundHandler);
    
    // 错误处理
    this.app.use(errorHandler);
  }

  /**
   * 启动服务器
   */
  public async start(): Promise<void> {
    try {
      // 初始化数据库
      await connectDatabase();

      // 初始化路由（需要在数据库连接后）
      await this.initializeRoutes();

      // 初始化错误处理（必须在路由注册后）
      this.initializeErrorHandling();

      // 创建HTTP服务器
      const server = createServer(this.app);

      // 启动服务器
      server.listen(this.port, () => {
        console.log(`🚀 AI数据库管理系统后端启动成功！`);
        console.log(`📡 服务器地址: http://localhost:${this.port}`);
        console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📋 API文档: http://localhost:${this.port}/api/docs`);
      });

      // 优雅关闭处理
      this.setupGracefulShutdown(server);

    } catch (error) {
      console.error('❌ 服务器启动失败:', error);
      process.exit(1);
    }
  }

  /**
   * 设置优雅关闭
   */
  private setupGracefulShutdown(server: any): void {
    const gracefulShutdown = (signal: string) => {
      console.log(`\n收到 ${signal} 信号，正在优雅关闭服务器...`);
      
      server.close(() => {
        console.log('HTTP服务器已关闭');
        process.exit(0);
      });

      // 强制关闭超时
      setTimeout(() => {
        console.error('强制关闭服务器');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }
}

// 启动应用
const app = new App();
app.start().catch(error => {
  console.error('应用启动失败:', error);
  process.exit(1);
});

export default app;