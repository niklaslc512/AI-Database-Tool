# 脚本使用说明

本目录包含AI数据库管理系统的各种自动化脚本，用于开发、测试、部署和维护。

## 📁 脚本文件列表

### 开发环境脚本

#### `dev.sh` (Linux/macOS)
**功能**: 开发环境管理脚本
**用途**: 项目初始化、启动开发服务器、构建项目等

```bash
# 使用方法
./scripts/dev.sh <command>

# 可用命令:
./scripts/dev.sh install    # 初始化项目，安装依赖
./scripts/dev.sh start      # 启动开发服务器
./scripts/dev.sh build      # 构建项目
./scripts/dev.sh check      # 检查服务状态
./scripts/dev.sh clean      # 清理项目文件
```

**系统要求**:
- Node.js >= 22.0.0
- npm >= 10.0.0
- Linux/macOS 操作系统

#### `dev.bat` (Windows)
**功能**: Windows版本的开发环境管理脚本
**用途**: 与dev.sh功能相同，适用于Windows系统

```cmd
# 使用方法
scripts\dev.bat <command>

# 可用命令:
scripts\dev.bat install     # 初始化项目，安装依赖
scripts\dev.bat start       # 启动开发服务器
scripts\dev.bat build       # 构建项目
scripts\dev.bat check       # 检查服务状态
scripts\dev.bat clean       # 清理项目文件
```

**系统要求**:
- Node.js >= 22.0.0
- npm >= 10.0.0
- Windows 操作系统

### 运维脚本

#### `health-check.sh`
**功能**: 系统健康检查脚本
**用途**: 检查各个服务的运行状态和系统健康度

```bash
# 使用方法
./scripts/health-check.sh

# 检查项目包括:
# - 端口占用情况
# - 服务进程状态
# - 文件系统状态
# - 项目依赖检查
# - HTTP服务可用性
# - 后端API健康状态
# - 前端静态资源
```

**输出示例**:
```
======================================
  AI数据库管理系统 - 健康检查
======================================

[INFO] 检查端口占用情况...
[✓] 端口3001已被使用（后端服务）
[✓] 端口3000已被使用（前端服务）

[INFO] 检查相关进程...
[✓] 发现 2 个Node.js进程

=================== 健康检查报告 ===================
总检查项: 8
通过: 7
失败: 1
成功率: 87%
==================================================
```

#### `production-check.sh`
**功能**: 生产环境部署前检查脚本
**用途**: 在部署到生产环境前验证所有配置和代码质量

```bash
# 使用方法
./scripts/production-check.sh

# 检查项目包括:
# - Docker环境验证
# - 环境变量检查
# - 配置文件验证
# - 代码质量检查
# - 安全配置审核
# - 系统资源检查
# - Docker镜像构建测试
```

**系统要求**:
- Docker
- Docker Compose
- 完整的项目环境配置

## 🚀 快速开始

### 1. 首次使用（项目初始化）

**Linux/macOS:**
```bash
# 克隆项目后首次运行
chmod +x scripts/*.sh
./scripts/dev.sh install
```

**Windows:**
```cmd
# 在项目根目录下运行
scripts\dev.bat install
```

### 2. 启动开发环境

**Linux/macOS:**
```bash
./scripts/dev.sh start
```

**Windows:**
```cmd
scripts\dev.bat start
```

启动后可以访问：
- 前端：http://localhost:3000
- 后端API：http://localhost:3001
- 健康检查：http://localhost:3001/health

### 3. 检查系统状态

```bash
# 检查开发环境健康状态
./scripts/health-check.sh

# 检查生产环境准备情况
./scripts/production-check.sh
```

## 🛠️ 脚本功能详解

### 开发环境管理

#### 安装依赖 (`install`)
- 检查Node.js和npm版本
- 创建必要的目录结构
- 复制环境变量模板文件
- 安装前后端项目依赖
- 验证安装结果

#### 启动服务 (`start`)
- 并行启动后端和前端开发服务器
- 自动打开浏览器（前端）
- 实时显示服务状态
- 支持热重载

#### 构建项目 (`build`)
- 编译TypeScript代码
- 打包前端静态资源
- 生成生产环境文件
- 验证构建结果

#### 清理项目 (`clean`)
- 删除node_modules目录
- 清理构建文件
- 清除日志文件
- 重置项目到初始状态

### 健康检查功能

#### 服务状态检查
- HTTP服务可用性测试
- API端点响应验证
- 前端资源加载测试
- 数据库连接状态

#### 系统资源检查
- 端口占用情况
- 进程运行状态
- 磁盘空间使用
- 内存使用情况

#### 配置验证
- 环境变量配置
- 配置文件完整性
- 依赖安装状态
- 文件权限检查

### 生产环境检查

#### Docker环境验证
- Docker安装状态
- Docker Compose可用性
- Docker服务运行状态
- 容器镜像构建测试

#### 代码质量检查
- TypeScript编译验证
- ESLint代码规范检查
- 构建流程测试
- 依赖安全审计

#### 安全配置审核
- JWT密钥强度检查
- 默认密码检测
- HTTPS配置验证
- 环境变量安全性

## 🔧 故障排除

### 常见问题

#### 1. Node.js版本不兼容
```bash
# 错误: Node.js版本过低
# 解决: 升级到Node.js 22+
nvm install 22
nvm use 22
```

#### 2. 端口被占用
```bash
# 错误: 端口3000或3001被占用
# 解决: 杀死占用进程
lsof -ti :3000 | xargs kill -9
lsof -ti :3001 | xargs kill -9
```

#### 3. 依赖安装失败
```bash
# 错误: npm install失败
# 解决: 清理缓存重新安装
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### 4. Docker构建失败
```bash
# 错误: Docker镜像构建失败
# 解决: 检查Dockerfile和构建上下文
docker system prune -f
docker build --no-cache -f docker/backend/Dockerfile .
```

### 脚本权限问题

**Linux/macOS:**
```bash
# 如果脚本没有执行权限
chmod +x scripts/*.sh
```

**Windows:**
```cmd
# 如果PowerShell执行策略限制
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📋 环境要求

### 开发环境
- **Node.js**: >= 22.0.0
- **npm**: >= 10.0.0
- **操作系统**: Linux, macOS, Windows
- **内存**: >= 4GB
- **磁盘空间**: >= 2GB

### 生产环境
- **Docker**: >= 20.0.0
- **Docker Compose**: >= 2.0.0
- **内存**: >= 8GB
- **磁盘空间**: >= 10GB
- **网络**: 支持外网访问

## 🔄 CI/CD 集成

这些脚本可以集成到CI/CD流水线中：

```yaml
# GitHub Actions 示例
- name: Setup Environment
  run: ./scripts/dev.sh install

- name: Health Check
  run: ./scripts/health-check.sh

- name: Production Check
  run: ./scripts/production-check.sh

- name: Build Application
  run: ./scripts/dev.sh build
```

## 📞 技术支持

如果在使用脚本过程中遇到问题：

1. 查看脚本输出的错误信息
2. 检查系统要求是否满足
3. 参考故障排除部分
4. 查看项目日志文件（`backend/logs/`）
5. 提交Issue到项目仓库

---

**注意**: 
- 所有脚本都包含详细的日志输出和错误处理
- 建议在生产环境部署前运行完整的检查流程
- 定期执行健康检查脚本监控系统状态