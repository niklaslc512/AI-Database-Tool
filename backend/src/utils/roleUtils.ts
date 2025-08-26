import { UserRole, Permission, ROLE_PERMISSIONS } from '../types';

/**
 * 🛠️ 角色工具函数
 * 提供多角色系统的核心操作功能
 */
export class RoleUtils {
  /**
   * 🔄 解析角色字符串为角色数组
   * @param rolesString 逗号分隔的角色字符串，如: "admin,developer"
   * @returns 角色数组
   */
  static parseRoles(rolesString: string): UserRole[] {
    if (!rolesString || rolesString.trim() === '') {
      return ['guest']; // 默认角色
    }
    
    return rolesString
      .split(',')
      .map(role => role.trim())
      .filter(role => role !== '')
      .filter(role => ['admin', 'developer', 'guest'].includes(role)) as UserRole[];
  }

  /**
   * 📝 将角色数组转换为字符串
   * @param roles 角色数组
   * @returns 逗号分隔的角色字符串
   */
  static stringifyRoles(roles: UserRole[]): string {
    if (!roles || roles.length === 0) {
      return 'guest';
    }
    
    // 去重并排序
    const uniqueRoles = [...new Set(roles)];
    const sortedRoles = uniqueRoles.sort((a, b) => {
      const order = { admin: 0, developer: 1, guest: 2 };
      return order[a] - order[b];
    });
    
    return sortedRoles.join(',');
  }

  /**
   * 🔍 检查用户是否拥有指定角色
   * @param userRoles 用户角色字符串
   * @param targetRole 目标角色
   * @returns 是否拥有该角色
   */
  static hasRole(userRoles: string, targetRole: UserRole): boolean {
    const roles = this.parseRoles(userRoles);
    return roles.includes(targetRole);
  }

  /**
   * 🔍 检查用户是否拥有任意一个指定角色
   * @param userRoles 用户角色字符串
   * @param targetRoles 目标角色数组
   * @returns 是否拥有任意一个角色
   */
  static hasAnyRole(userRoles: string, targetRoles: UserRole[]): boolean {
    const roles = this.parseRoles(userRoles);
    return targetRoles.some(targetRole => roles.includes(targetRole));
  }

  /**
   * 🔐 检查用户是否拥有指定权限
   * @param userRoles 用户角色字符串
   * @param permission 目标权限
   * @returns 是否拥有该权限
   */
  static hasPermission(userRoles: string, permission: Permission): boolean {
    const roles = this.parseRoles(userRoles);
    
    return roles.some(role => {
      const rolePermissions = ROLE_PERMISSIONS[role];
      return rolePermissions && rolePermissions.includes(permission as any);
    });
  }

  /**
   * ➕ 添加角色
   * @param userRoles 当前用户角色字符串
   * @param newRole 要添加的新角色
   * @returns 更新后的角色字符串
   */
  static addRole(userRoles: string, newRole: UserRole): string {
    const roles = this.parseRoles(userRoles);
    
    if (!roles.includes(newRole)) {
      roles.push(newRole);
    }
    
    return this.stringifyRoles(roles);
  }

  /**
   * ➖ 移除角色
   * @param userRoles 当前用户角色字符串
   * @param roleToRemove 要移除的角色
   * @returns 更新后的角色字符串
   */
  static removeRole(userRoles: string, roleToRemove: UserRole): string {
    const roles = this.parseRoles(userRoles);
    const filteredRoles = roles.filter(role => role !== roleToRemove);
    
    // 如果移除后没有角色，默认为guest
    if (filteredRoles.length === 0) {
      return 'guest';
    }
    
    return this.stringifyRoles(filteredRoles);
  }

  /**
   * 📋 获取角色的所有权限
   * @param userRoles 用户角色字符串
   * @returns 权限数组
   */
  static getUserPermissions(userRoles: string): Permission[] {
    const roles = this.parseRoles(userRoles);
    const permissions = new Set<Permission>();
    
    roles.forEach(role => {
      const rolePermissions = ROLE_PERMISSIONS[role];
      if (rolePermissions) {
        rolePermissions.forEach(permission => permissions.add(permission));
      }
    });
    
    return Array.from(permissions);
  }

  /**
   * 🔍 验证角色字符串格式
   * @param rolesString 角色字符串
   * @returns 是否为有效格式
   */
  static isValidRolesString(rolesString: string): boolean {
    if (!rolesString || typeof rolesString !== 'string') {
      return false;
    }
    
    const roles = rolesString.split(',').map(role => role.trim());
    return roles.every(role => ['admin', 'developer', 'guest'].includes(role));
  }

  /**
   * 🎭 获取角色显示名称
   * @param role 角色
   * @returns 角色显示名称
   */
  static getRoleDisplayName(role: UserRole): string {
    const displayNames = {
      admin: '系统管理员',
      developer: '开发者',
      guest: '访客'
    };
    
    return displayNames[role] || role;
  }

  /**
   * 📊 获取角色统计信息
   * @param userRoles 用户角色字符串
   * @returns 角色统计信息
   */
  static getRoleStats(userRoles: string) {
    const roles = this.parseRoles(userRoles);
    const permissions = this.getUserPermissions(userRoles);
    
    return {
      roles,
      roleCount: roles.length,
      permissions,
      permissionCount: permissions.length,
      displayNames: roles.map(role => this.getRoleDisplayName(role)),
      isAdmin: roles.includes('admin'),
      isDeveloper: roles.includes('developer'),
      isGuest: roles.includes('guest')
    };
  }
}