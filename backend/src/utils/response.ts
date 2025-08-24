/**
 * 响应工具类
 * 提供标准化的API响应格式处理
 */

/**
 * 成功响应 - 有数据返回
 * @param data 要返回的数据
 * @returns 直接返回数据
 */
export function success<T>(data: T): T {
  return data;
}

/**
 * 成功响应 - 无数据返回，仅确认操作
 * @param msg 操作确认消息
 * @returns 包含消息的对象
 */
export function message(msg: string): { message: string } {
  return { message: msg };
}

/**
 * 错误响应接口
 */
export interface ErrorResponse {
  message: string;
  timestamp: string;
  path: string;
  error?: string;
  stack?: string;
}

/**
 * 创建标准错误响应
 * @param message 错误消息
 * @param path 请求路径
 * @param error 错误详情（开发环境）
 * @param stack 错误堆栈（开发环境）
 * @returns 标准化错误响应对象
 */
export function createErrorResponse(
  message: string,
  path: string,
  error?: string,
  stack?: string
): ErrorResponse {
  const response: ErrorResponse = {
    message,
    timestamp: new Date().toISOString(),
    path
  };

  // 开发环境返回详细错误信息
  if (process.env.NODE_ENV === 'development') {
    if (error) response.error = error;
    if (stack) response.stack = stack;
  }

  return response;
}

/**
 * 响应工具类
 */
export class ResponseUtils {
  /**
   * 成功响应 - 有数据
   */
  static success<T>(data: T): T {
    return success(data);
  }

  /**
   * 成功响应 - 无数据
   */
  static message(msg: string): { message: string } {
    return message(msg);
  }

  /**
   * 创建错误响应
   */
  static createErrorResponse(
    message: string,
    path: string,
    error?: string,
    stack?: string
  ): ErrorResponse {
    return createErrorResponse(message, path, error, stack);
  }
}