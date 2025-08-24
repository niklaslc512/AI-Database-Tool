# 数据库初始化说明

## 概述

`init-database.ts` 是用于初始化AI数据库管理系统的脚本，它会：

1. 创建或连接到SQLite数据库
2. 执行数据库迁移（如果存在）
3. 创建默认用户账户

## 使用方法

### 开发环境

```bash
# 使用 ts-node 直接运行
npm run db:init
```

### 生产环境

```bash
# 先构建项目，然后运行编译后的JS文件
npm run build
npm run db:init:prod
```

## 默认用户账户

脚本会创建以下默认用户：

| 用户名 | 密码 | 角色 | 显示名称 |
|--------|------|------|----------|
| admin | admin123456 | admin | 系统管理员 |
| user | user123456 | user | 普通用户 |
| readonly | readonly123456 | readonly | 只读用户 |
| guest | guest123456 | guest | 访客用户 |

⚠️ **安全提醒**: 请在生产环境中及时修改这些默认密码！

## 环境变量

可以通过以下环境变量配置：

- `DATABASE_URL`: 数据库文件路径（默认: `./data/ai-database.db`）
- `BCRYPT_ROUNDS`: bcrypt加密轮数（默认: `12`）

## 数据库迁移

如果 `database/migrations/` 目录存在，脚本会按文件名顺序执行所有 `.sql` 文件。

迁移文件命名规范：`YYYYMMDD_HHMMSS_description.sql`

例如：`20231201_120000_create_users_table.sql`

## 注意事项

1. 脚本会检查用户是否已存在，避免重复创建
2. 如果数据库文件不存在，会自动创建
3. 所有密码都使用 bcrypt 进行安全哈希处理
4. 脚本执行失败时会自动退出并显示错误信息

## 故障排除

### 常见问题

1. **权限错误**: 确保对数据库目录有写权限
2. **模块找不到**: 确保已安装所有依赖 `npm install`
3. **数据库锁定**: 确保没有其他进程在使用数据库文件

### 重新初始化

如果需要重新初始化数据库：

```bash
# 删除现有数据库文件
rm data/ai-database.db

# 重新运行初始化
npm run db:init
```