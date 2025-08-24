import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';
import { logger } from '../utils/logger';

/**
 * 全局错误处理中间件
 */
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = '服务器内部错误';
  let isOperational = false;

  // 处理自定义错误
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    isOperational = error.isOperational;
  }

  // 处理JWT错误
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = '无效的访问令牌';
    isOperational = true;
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = '访问令牌已过期';
    isOperational = true;
  }

  // 处理验证错误
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = '请求参数验证失败';
    isOperational = true;
  }

  // 处理数据库错误
  if (error.message.includes('UNIQUE constraint failed')) {
    statusCode = 409;
    message = '数据已存在';
    isOperational = true;
  }

  // 记录错误日志
  if (!isOperational || statusCode >= 500) {
    logger.error('未处理的错误:', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  } else {
    logger.warn('操作错误:', {
      error: error.message,
      url: req.url,
      method: req.method,
      ip: req.ip
    });
  }

  // 开发环境返回详细错误信息
  const errorResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
    path: req.url,
    ...(process.env.NODE_ENV === 'development' && {
      error: error.message,
      stack: error.stack
    })
  };

  res.status(statusCode).json(errorResponse);
};