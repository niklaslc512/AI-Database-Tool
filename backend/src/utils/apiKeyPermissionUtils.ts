import {
  ApiKeyPermission,
  ApiKeyPermissionPreset,
  API_KEY_PERMISSION_PRESETS
} from '../types';
import { logger } from './logger';

/**
 * API密钥权限工具函数实现类
 */
export class ApiKeyPermissionUtilsImpl {
  /**
   * 检查是否拥有指定权限
   */
  hasPermission(permissions: ApiKeyPermission[], permission: ApiKeyPermission): boolean {
    return permissions.includes(permission) || permissions.includes('admin');
  }

  /**
   * 检查权限列表是否为只读模式
   */
  isReadOnly(permissions: ApiKeyPermission[]): boolean {
    return permissions.length === 1 && permissions[0] === 'read';
  }

  /**
   * 验证权限配置
   */
  validatePermissions(permissions: ApiKeyPermission[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // 检查权限列表
    if (!permissions || permissions.length === 0) {
      errors.push('权限列表不能为空');
    } else {
      const validPermissions: ApiKeyPermission[] = ['read', 'write', 'delete', 'admin'];
      const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
      if (invalidPermissions.length > 0) {
        errors.push(`无效的权限: ${invalidPermissions.join(', ')}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 合并多个权限列表
   */
  mergePermissions(permissionLists: ApiKeyPermission[][]): ApiKeyPermission[] {
    if (permissionLists.length === 0) {
      return ['read'];
    }
    
    // 合并权限（去重）
    const allPermissions = permissionLists.flat();
    return Array.from(new Set(allPermissions));
  }

  /**
   * 从预设创建权限列表
   */
  static createFromPreset(preset: ApiKeyPermissionPreset): ApiKeyPermission[] {
    return [...API_KEY_PERMISSION_PRESETS[preset]];
  }

  /**
   * 检查是否可以执行指定的SQL语句
   */
  canExecuteSQL(permissions: ApiKeyPermission[], sql: string): { allowed: boolean; reason?: string | undefined } {
    const sqlUpper = sql.trim().toUpperCase();
    
    // 检查具体的SQL操作权限
    if (sqlUpper.startsWith('SELECT')) {
      const hasPermission = permissions.includes('read');
      return { 
        allowed: hasPermission, 
        reason: hasPermission ? undefined : '缺少读取权限' 
      };
    } else if (sqlUpper.startsWith('INSERT')) {
      const hasPermission = permissions.includes('write');
      return { 
        allowed: hasPermission, 
        reason: hasPermission ? undefined : '缺少写入权限' 
      };
    } else if (sqlUpper.startsWith('UPDATE')) {
      const hasPermission = permissions.includes('write');
      return { 
        allowed: hasPermission, 
        reason: hasPermission ? undefined : '缺少更新权限' 
      };
    } else if (sqlUpper.startsWith('DELETE')) {
      const hasPermission = permissions.includes('delete');
      return { 
        allowed: hasPermission, 
        reason: hasPermission ? undefined : '缺少删除权限' 
      };
    } else {
      // 其他SQL语句（如DDL）需要管理员权限
      const hasPermission = permissions.includes('admin');
      return { 
        allowed: hasPermission, 
        reason: hasPermission ? undefined : 'DDL操作需要管理员权限' 
      };
    }
  }
}

/**
 * 导出API密钥权限工具函数实例
 */
export const apiKeyPermissionUtils = new ApiKeyPermissionUtilsImpl();