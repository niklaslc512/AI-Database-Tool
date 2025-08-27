import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export interface DefaultUser {
  id: string;        // 🆔 UUID字符串格式
  username: string;
  email: string;
  password: string;
  roles: string;     // 🎭 多角色字符串，逗号分隔
  displayName: string;
  status: string;
}

/**
 * 🔧 生成UUID
 * @returns UUID字符串
 */
export function generateUUID(): string {
  return randomUUID();
}

/**
 * 🎭 默认用户数据
 * 包含三种不同角色的用户：admin（全功能）、developer（开发者功能）、guest（只读功能）
 * 使用固定的UUID以确保数据一致性
 */
export const defaultUsers: DefaultUser[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',  // 🆔 固定UUID
    username: 'admin',
    email: 'admin@ai-database.com',
    password: 'Admin@123456',
    roles: 'admin,developer,guest',  // 🔑 拥有所有角色权限
    displayName: '系统管理员',
    status: 'active'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',  // 🆔 固定UUID
    username: 'developer',
    email: 'developer@ai-database.com',
    password: 'Dev@123456',
    roles: 'developer,guest',  // 🛠️ 开发者权限 + 基础查询权限
    displayName: '开发工程师',
    status: 'active'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',  // 🆔 固定UUID
    username: 'guest',
    email: 'guest@ai-database.com',
    password: 'Guest@123456',
    roles: 'guest',  // 👤 仅访客权限
    displayName: '访客用户',
    status: 'active'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',  // 🆔 固定UUID
    username: 'demo_admin',
    email: 'demo.admin@ai-database.com',
    password: 'DemoAdmin@123',
    roles: 'admin',  // 🎯 仅管理员权限（用于演示）
    displayName: '演示管理员',
    status: 'active'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',  // 🆔 固定UUID
    username: 'demo_dev',
    email: 'demo.dev@ai-database.com',
    password: 'DemoDev@123',
    roles: 'developer',  // 🎯 仅开发者权限（用于演示）
    displayName: '演示开发者',
    status: 'active'
  }
];

/**
 * 🔧 获取默认用户设置
 * 为新用户提供统一的默认配置
 */
export function getDefaultUserSettings() {
  return {
    theme: 'auto',
    language: 'zh-CN',
    timezone: 'Asia/Shanghai',
    notifications: {
      email: true,
      browser: true,
      security: true
    },
    preferences: {
      showRoleInfo: true,  // 🎭 显示角色信息
      compactMode: false,
      autoSave: true
    }
  };
}

/**
 * 🔐 生成用户密码哈希
 * 使用bcrypt算法生成安全的密码哈希值
 * @param password 原始密码
 * @param saltRounds 盐值轮数，默认12轮
 * @returns 包含哈希值和盐值的对象
 */
export async function generatePasswordHash(password: string, saltRounds: number = 12): Promise<{ hash: string; salt: string }> {
  const salt = await bcrypt.genSalt(saltRounds);
  const hash = await bcrypt.hash(password, salt);
  return { hash, salt };
}

/**
 * 🎭 获取角色权限说明
 * 为前端提供角色权限的详细说明
 */
export function getRoleDescriptions() {
  return {
    admin: {
      name: '系统管理员',
      description: '拥有系统的完全控制权限',
      permissions: [
        '用户管理：创建、编辑、删除用户账户',
        '系统设置：修改系统配置和参数',
        'API密钥管理：创建和管理API密钥',
        '数据库管理：创建、修改数据库表结构',
        '数据查询：执行所有类型的数据查询操作'
      ],
      color: '#ef4444'  // 红色
    },
    developer: {
      name: '开发者',
      description: '拥有开发和数据库管理权限',
      permissions: [
        'API密钥管理：创建和管理API密钥',
        '数据库管理：创建、修改数据库表结构',
        '数据查询：执行所有类型的数据查询操作'
      ],
      color: '#3b82f6'  // 蓝色
    },
    guest: {
      name: '访客',
      description: '只能进行基础的数据查询操作',
      permissions: [
        '数据查询：执行基础的数据查询操作'
      ],
      color: '#6b7280'  // 灰色
    }
  };
}