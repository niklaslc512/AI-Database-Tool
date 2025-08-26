import { Request, Response } from 'express';

/**
 * 404错误处理中间件
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    message: `请求的资源 ${req.method} ${req.url} 不存在`,
    timestamp: new Date().toISOString(),
    path: req.url
  });
};