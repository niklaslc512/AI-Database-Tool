import * as path from 'path';
import * as fs from 'fs';
import { open, Database } from 'sqlite';
import * as sqlite3 from 'sqlite3';
import { logger } from '../src/utils/logger';
import { defaultUsers, getDefaultUserSettings, generatePasswordHash } from './seeds/default-users';

async function initializeDatabase() {
  console.log('=== AI数据库管理系统 - 数据库初始化 ===\n');

  try {
    // 创建数据库连接
    const dbPath = process.env.DATABASE_URL?.replace('sqlite:', '') || path.join(__dirname, '..', 'data', 'ai-database.db');
    const dbDir = path.dirname(dbPath);
    
    // 确保数据库目录存在
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    console.log(`✓ 连接到数据库: ${dbPath}`);

    // 执行数据库迁移
    await runMigrations(db);

    // 初始化默认用户
    await initializeUsers(db);

    await db.close();
    console.log('\n🎉 数据库初始化完成！');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

async function runMigrations(db: Database<sqlite3.Database, sqlite3.Statement>) {
  console.log('\n📁 执行数据库迁移...');

  const migrationsDir = path.join(__dirname, 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('⚠️  迁移目录不存在，跳过迁移');
    return;
  }

  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    try {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // 执行SQL文件
      try {
        await db.exec(sql);
      } catch (error) {
        console.error(`执行SQL文件失败:`, error);
        throw error;
      }
      
      console.log(`  ✓ ${file}`);
    } catch (error) {
      console.error(`  ❌ ${file} 执行失败:`, error);
      throw error;
    }
  }

  console.log('✓ 数据库迁移完成');
}

async function initializeUsers(db: Database<sqlite3.Database, sqlite3.Statement>) {
  console.log('\n👥 初始化默认用户...');

  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');

  for (const userData of defaultUsers) {
    try {
      // 检查用户是否已存在
      const existingUser = await db.get('SELECT id FROM users WHERE username = ?', userData.username);
      
      if (existingUser) {
        console.log(`  ⏭️  用户 ${userData.username} 已存在，跳过创建`);
        continue;
      }

      // 生成密码哈希
      const { hash: passwordHash, salt } = await generatePasswordHash(userData.password, saltRounds);

      // 默认用户设置
      const defaultSettings = getDefaultUserSettings();

      // 🎭 插入用户数据（使用多角色字段）
      console.log(`  🔍 准备插入用户数据:`, {
        username: userData.username,
        email: userData.email,
        roles: userData.roles,
        displayName: userData.displayName,
        status: userData.status
      });
      
      await db.run(`
        INSERT INTO users (
          username, email, password_hash, salt, roles, display_name, status, settings
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userData.username,
        userData.email,
        passwordHash,
        salt,
        userData.roles,  // 🎭 使用多角色字段
        userData.displayName,
        userData.status,
        JSON.stringify(defaultSettings)
      ]);

      console.log(`  ✓ 创建用户: ${userData.username} (${userData.roles})`);
    } catch (error) {
      console.error(`  ❌ 创建用户 ${userData.username} 失败:`, error);
      throw error;
    }
  }

  console.log('\n📋 默认账号信息:');
  console.log('┌─────────────┬──────────────┬──────────────────┬────────────┐');
  console.log('│ 用户名      │ 密码         │ 角色             │ 显示名称   │');
  console.log('├─────────────┼──────────────┼──────────────────┼────────────┤');
  defaultUsers.forEach(user => {
    console.log(`│ ${user.username.padEnd(11)} │ ${user.password.padEnd(12)} │ ${user.roles.padEnd(16)} │ ${user.displayName.padEnd(10)} │`);
  });
  console.log('└─────────────┴──────────────┴──────────────────┴────────────┘');
  
  console.log('\n⚠️  安全提醒: 请及时修改默认密码！');
}

// 如果直接运行此脚本
if (require.main === module) {
  initializeDatabase();
}

export { initializeDatabase, initializeUsers };