"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
exports.initializeUsers = initializeUsers;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const sqlite_1 = require("sqlite");
const sqlite3 = __importStar(require("sqlite3"));
const default_users_1 = require("./seeds/default-users");
async function initializeDatabase() {
    console.log('=== AI数据库管理系统 - 数据库初始化 ===\n');
    try {
        const dbPath = process.env.DATABASE_URL?.replace('sqlite:', '') || path.join(__dirname, '..', 'data', 'ai-database.db');
        const dbDir = path.dirname(dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        const db = await (0, sqlite_1.open)({
            filename: dbPath,
            driver: sqlite3.Database
        });
        console.log(`✓ 连接到数据库: ${dbPath}`);
        await runMigrations(db);
        await initializeUsers(db);
        await db.close();
        console.log('\n🎉 数据库初始化完成！');
    }
    catch (error) {
        console.error('❌ 数据库初始化失败:', error);
        process.exit(1);
    }
}
async function runMigrations(db) {
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
            try {
                await db.exec(sql);
            }
            catch (error) {
                console.error(`执行SQL文件失败:`, error);
                throw error;
            }
            console.log(`  ✓ ${file}`);
        }
        catch (error) {
            console.error(`  ❌ ${file} 执行失败:`, error);
            throw error;
        }
    }
    console.log('✓ 数据库迁移完成');
}
async function initializeUsers(db) {
    console.log('\n👥 初始化默认用户...');
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    for (const userData of default_users_1.defaultUsers) {
        try {
            const existingUser = await db.get('SELECT id FROM users WHERE username = ?', userData.username);
            if (existingUser) {
                console.log(`  ⏭️  用户 ${userData.username} 已存在，跳过创建`);
                continue;
            }
            const { hash: passwordHash, salt } = await (0, default_users_1.generatePasswordHash)(userData.password, saltRounds);
            const defaultSettings = (0, default_users_1.getDefaultUserSettings)();
            await db.run(`
        INSERT INTO users (
          username, email, password_hash, salt, role, display_name, status, settings
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, userData.username, userData.email, passwordHash, salt, userData.role, userData.displayName, userData.status, JSON.stringify(defaultSettings));
            console.log(`  ✓ 创建用户: ${userData.username} (${userData.role})`);
        }
        catch (error) {
            console.error(`  ❌ 创建用户 ${userData.username} 失败:`, error);
            throw error;
        }
    }
    console.log('\n📋 默认账号信息:');
    console.log('┌─────────────┬──────────────┬────────────┐');
    console.log('│ 用户名      │ 密码         │ 角色       │');
    console.log('├─────────────┼──────────────┼────────────┤');
    default_users_1.defaultUsers.forEach(user => {
        console.log(`│ ${user.username.padEnd(11)} │ ${user.password.padEnd(12)} │ ${user.displayName.padEnd(10)} │`);
    });
    console.log('└─────────────┴──────────────┴────────────┘');
    console.log('\n⚠️  安全提醒: 请及时修改默认密码！');
}
if (require.main === module) {
    initializeDatabase();
}
//# sourceMappingURL=init-database.js.map