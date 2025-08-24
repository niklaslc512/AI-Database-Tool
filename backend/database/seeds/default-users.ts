import * as bcrypt from 'bcryptjs';

export interface DefaultUser {
  username: string;
  email: string;
  password: string;
  role: string;
  displayName: string;
  status: string;
}

export const defaultUsers: DefaultUser[] = [
  {
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123456',
    role: 'admin',
    displayName: '系统管理员',
    status: 'active'
  },
  {
    username: 'user',
    email: 'user@example.com',
    password: 'user123456',
    role: 'user',
    displayName: '普通用户',
    status: 'active'
  },
  {
    username: 'readonly',
    email: 'readonly@example.com',
    password: 'readonly123456',
    role: 'readonly',
    displayName: '只读用户',
    status: 'active'
  },
  {
    username: 'guest',
    email: 'guest@example.com',
    password: 'guest123456',
    role: 'guest',
    displayName: '访客用户',
    status: 'active'
  }
];

/**
 * 获取默认用户设置
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
    }
  };
}

/**
 * 生成用户密码哈希
 */
export async function generatePasswordHash(password: string, saltRounds: number = 12): Promise<{ hash: string; salt: string }> {
  const salt = await bcrypt.genSalt(saltRounds);
  const hash = await bcrypt.hash(password, salt);
  return { hash, salt };
}