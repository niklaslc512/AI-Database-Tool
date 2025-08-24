# 脚本索引

这是AI数据库管理系统的脚本目录索引。

## 🎯 主要入口

### `../run.sh` - 主入口脚本
交互式主菜单，提供所有功能的统一入口。

```bash
# 启动主菜单
./run.sh
```

## 📋 脚本列表

| 脚本名称 | 平台 | 功能描述 | 用法示例 |
|----------|------|----------|----------|
| `dev.sh` | Linux/macOS | 开发环境管理 | `./scripts/dev.sh install` |
| `dev.bat` | Windows | 开发环境管理 | `scripts\dev.bat install` |
| `health-check.sh` | Linux/macOS | 系统健康检查 | `./scripts/health-check.sh` |
| `production-check.sh` | Linux/macOS | 生产环境检查 | `./scripts/production-check.sh` |

## 🚀 快速命令

```bash
# 项目初始化
./scripts/dev.sh install

# 启动开发服务器
./scripts/dev.sh start

# 检查系统健康
./scripts/health-check.sh

# 生产环境检查
./scripts/production-check.sh
```

详细使用说明请查看 [README.md](README.md)。