import { AppError } from '../types';

/**
 * 分页参数接口
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * 验证分页参数
 * @param params 分页参数
 * @returns 验证后的分页参数
 */
export function validatePagination(params: PaginationParams): PaginationParams {
  const { page, limit } = params;

  // 验证页码
  if (!Number.isInteger(page) || page < 1) {
    throw new AppError('页码必须是大于0的整数', 400);
  }

  // 验证每页数量
  if (!Number.isInteger(limit) || limit < 1) {
    throw new AppError('每页数量必须是大于0的整数', 400);
  }

  // 限制每页最大数量
  const maxLimit = 100;
  if (limit > maxLimit) {
    throw new AppError(`每页数量不能超过${maxLimit}`, 400);
  }

  return { page, limit };
}

/**
 * 验证邮箱格式
 * @param email 邮箱地址
 * @returns 是否有效
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证用户名格式
 * @param username 用户名
 * @returns 是否有效
 */
export function validateUsername(username: string): boolean {
  // 用户名：3-20个字符，只能包含字母、数字、下划线
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

/**
 * 验证密码强度
 * @param password 密码
 * @returns 验证结果
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 长度检查
  if (password.length < 8) {
    errors.push('密码长度至少8个字符');
  }

  if (password.length > 128) {
    errors.push('密码长度不能超过128个字符');
  }

  // 复杂度检查
  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母');
  }

  if (!/\d/.test(password)) {
    errors.push('密码必须包含数字');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密码必须包含特殊字符');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 验证API Key名称
 * @param name API Key名称
 * @returns 是否有效
 */
export function validateApiKeyName(name: string): boolean {
  // API Key名称：1-50个字符，不能只包含空格
  return !!(name && name.trim().length > 0 && name.trim().length <= 50);
}

/**
 * 验证数据库连接名称
 * @param name 连接名称
 * @returns 是否有效
 */
export function validateConnectionName(name: string): boolean {
  // 连接名称：1-100个字符，不能只包含空格
  return !!(name && name.trim().length > 0 && name.trim().length <= 100);
}

/**
 * 验证DSN连接字符串格式
 * @param dsn DSN字符串
 * @param type 数据库类型
 * @returns 验证结果
 */
export function validateDsn(dsn: string, type: string): {
  isValid: boolean;
  error?: string;
} {
  if (!dsn || !dsn.trim()) {
    return { isValid: false, error: 'DSN不能为空' };
  }

  const trimmedDsn = dsn.trim();

  switch (type) {
    case 'postgresql':
      // PostgreSQL DSN格式验证
      const pgRegex = /^postgresql:\/\/[^\s]+$/;
      if (!pgRegex.test(trimmedDsn)) {
        return {
          isValid: false,
          error: 'PostgreSQL DSN格式错误，应为: postgresql://username:password@host:port/database'
        };
      }
      break;

    case 'mongodb':
      // MongoDB DSN格式验证
      const mongoRegex = /^mongodb(\/\/|\+srv:\/\/)[^\s]+$/;
      if (!mongoRegex.test(trimmedDsn)) {
        return {
          isValid: false,
          error: 'MongoDB DSN格式错误，应为: mongodb://username:password@host:port/database 或 mongodb+srv://username:password@cluster/database'
        };
      }
      break;

    default:
      return {
        isValid: false,
        error: '不支持的数据库类型'
      };
  }

  return { isValid: true };
}

/**
 * 验证权限数组
 * @param permissions 权限数组
 * @returns 是否有效
 */
export function validatePermissions(permissions: string[]): boolean {
  if (!Array.isArray(permissions)) {
    return false;
  }

  const validPermissions = ['read', 'write', 'delete', 'admin'];
  return permissions.every(permission => 
    typeof permission === 'string' && validPermissions.includes(permission)
  );
}

/**
 * 验证UUID格式
 * @param uuid UUID字符串
 * @returns 是否有效
 */
export function validateUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * 验证日期格式
 * @param dateString 日期字符串
 * @returns 验证结果
 */
export function validateDate(dateString: string): {
  isValid: boolean;
  date?: Date;
  error?: string;
} {
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return { isValid: false, error: '无效的日期格式' };
    }

    // 检查日期是否在合理范围内（不能是过去的日期，不能超过10年后）
    const now = new Date();
    const maxDate = new Date(now.getFullYear() + 10, now.getMonth(), now.getDate());

    if (date < now) {
      return { isValid: false, error: '日期不能是过去的时间' };
    }

    if (date > maxDate) {
      return { isValid: false, error: '日期不能超过10年后' };
    }

    return { isValid: true, date };
  } catch (error) {
    return { isValid: false, error: '日期解析失败' };
  }
}

/**
 * 清理和验证搜索关键词
 * @param search 搜索关键词
 * @returns 清理后的搜索关键词
 */
export function sanitizeSearchTerm(search: string | undefined): string | undefined {
  if (!search || typeof search !== 'string') {
    return undefined;
  }

  const trimmed = search.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  // 限制搜索关键词长度
  if (trimmed.length > 100) {
    throw new AppError('搜索关键词长度不能超过100个字符', 400);
  }

  // 移除特殊字符，防止SQL注入
  const sanitized = trimmed.replace(/[<>"'%;()&+]/g, '');
  
  return sanitized.length > 0 ? sanitized : undefined;
}