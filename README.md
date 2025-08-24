# AI驱动数据库管理系统

一个由大模型驱动的通用数据库管理系统，支持通过自然语言进行数据库查询和管理操作。

## 🆕 最新更新

### v1.1.0 - API响应标准化 🎆

我们刚刚完成了一次重大的API响应格式标准化改造，提升了系统的简洁性和性能：

**主要改进**:
- ✨ **简化响应格式**: 移除了冗余的`success`字段和外层`data`包装
- ⚡ **直接数据返回**: 成功响应直接返回数据对象/数组
- 🛡️ **标准化错误处理**: 统一的错误响应格式 `{message, timestamp, path}`
- 🚀 **性能优化**: 响应体积减少，处理速度提升
- 👨‍💻 **开发体验提升**: 代码更简洁，类型安全性更强

**响应格式示例**:
```json
// 成功响应（有数据）
{
  "id": "user123",
  "username": "admin",
  "email": "admin@example.com"
}

// 成功响应（操作确认）
{"message": "操作成功"}

// 错误响应
{
  "message": "用户名和密码不能为空",
  "timestamp": "2025-08-24T06:41:29.056Z",
  "path": "/api/v1/users/auth/login"
}
```

> ⚠️ **破坏性更新**: 此版本与旧版本不兼容，客户端需要同时更新。

## 🚀 项目概述

本项目旨在构建一个智能化的数据库管理平台，用户可以通过自然语言描述需求，AI自动生成相应的SQL语句并执行数据库操作。系统采用前后端分离架构，支持多种类型的数据库连接和管理。

### ✨ 核心特性

- **🤖 AI驱动查询**: 通过自然语言描述查询需求，AI自动生成SQL语句
- **🗄️ 多数据库支持**: 统一接口支持MySQL、PostgreSQL、SQLite、MongoDB等多种数据库
- **📊 智能数据分析**: 自动生成数据可视化图表和JSON Schema
- **🛠️ 表结构管理**: AI辅助的数据库表创建、修改和删除操作
- **🔒 安全审计**: 操作权限控制和完整的审计日志
- **📱 现代化界面**: 基于Vue3的响应式Web界面
- **⚡ 标准化API**: 简洁统一的RESTful API响应格式，更高效的数据传输
- **🛡️ 类型安全**: 完整的TypeScript类型定义，开发时错误检查

### 🏗️ 技术架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (Vue3)   │    │  后端 (Express) │    │   AI服务层      │
│                 │    │                 │    │                 │
│ • Vue3 + Vite   │◄──►│ • Express.js    │◄──►│ • 大模型API     │
│ • TailwindCSS   │    │ • TypeScript    │    │ • SQL生成器     │
│ • Pinia         │    │ • JWT认证       │    │ • 智能分析      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   数据存储层    │
                       │                 │
                       │ • SQLite (系统) │
                       │ • MySQL         │
                       │ • PostgreSQL    │
                       │ • MongoDB       │
                       └─────────────────┘
```

## 🛠️ 技术栈

### 前端技术
- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **样式**: TailwindCSS v4
- **状态管理**: Pinia
- **路由**: Vue Router
- **HTTP客户端**: Axios
- **组件库**: Element Plus

### 后端技术
- **运行时**: Node.js 22
- **框架**: Express.js 5 (beta)
- **语言**: TypeScript
- **数据库**: SQLite (项目数据存储)
- **认证**: JWT
- **日志**: Winston
- **文档**: Swagger
- **API规范**: RESTful API + 标准化响应格式

### AI集成
- **大模型**: 支持OpenAI GPT、Claude等主流大模型
- **自然语言处理**: 意图识别和SQL生成
- **智能优化**: 查询性能分析和优化建议

## 📋 实施进度

### ✅ Phase 0: API响应标准化 (Week 0) - 已完成
- [x] API响应格式标准化设计
- [x] 后端路由层改造（auth, users, apiKeys）
- [x] 后端错误处理中间件标准化
- [x] 前端API工具类和Store层适配
- [x] TypeScript类型定义重构
- [x] 全面测试验证和文档更新

### Phase 1: 基础架构搭建 (Week 1-2)
- [x] 项目初始化和目录结构
- [x] 后端Express框架搭建
- [x] 前端Vue3项目初始化
- [x] SQLite数据库设计
- [x] 基础API接口设计

### Phase 2: 核心功能开发 (Week 3-4)
- [ ] 数据库连接管理
- [ ] 统一数据库适配器实现
- [ ] AI服务集成
- [ ] 自然语言查询处理
- [ ] 基础前端界面开发

### Phase 3: 高级功能实现 (Week 5-6)
- [ ] 智能表管理功能
- [ ] 数据可视化组件
- [ ] JSON Schema生成
- [ ] 查询优化建议
- [ ] 用户权限管理

### Phase 4: 优化与部署 (Week 7-8)
- [ ] 性能优化
- [ ] 安全加固
- [ ] 单元测试和集成测试
- [ ] 部署配置
- [ ] 文档完善

## 🚀 快速开始

> ⚠️ **重要提示**: 如果您之前使用过本项目，请注意我们在v1.1.0中对API响应格式进行了标准化改造。这是一个**破坏性更新**，客户端代码需要相应调整。
> 
> 📚 **迁移指南**: [API_MIGRATION_GUIDE.md](API_MIGRATION_GUIDE.md)  
> 📊 **完整报告**: [API_STANDARDIZATION_REPORT.md](API_STANDARDIZATION_REPORT.md)

### 使用脚本（推荐）

我们提供了完整的脚本工具套件，支持一键式开发环境管理：

```bash
# 启动交互式主菜单
./run.sh

# 或者直接使用具体脚本
./scripts/dev.sh install    # 初始化项目
./scripts/dev.sh start      # 启动开发服务器
./scripts/health-check.sh   # 检查系统状态
```

**Windows用户**：
```cmd
scripts\dev.bat install
scripts\dev.bat start
```

### 手动安装

如果您喜欢手动操作：

### 环境要求
- Node.js >= 22.0.0
- npm >= 10.0.0

### 安装运行

1. **克隆项目**
```bash
git clone https://github.com/niklaslc/ai-database.git
cd ai-database
```

2. **安装依赖**
```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

3. **配置环境变量**
```bash
# 后端环境配置
cp backend/.env.example backend/.env
# 配置数据库连接和AI API密钥

# 前端环境配置
cp frontend/.env.example frontend/.env
```

4. **启动服务**
```bash
# 启动后端服务
cd backend
npm run dev

# 启动前端服务
cd ../frontend
npm run dev
```

访问 `http://localhost:3000` 即可使用系统。

### 🛠️ 开发工具

我们提供了完整的开发工具链：

- **交互式主菜单**: `./run.sh` - 一键启动所有功能
- **开发脚本**: `scripts/dev.sh` - 项目初始化和服务管理
- **健康检查**: `scripts/health-check.sh` - 系统状态监控
- **部署检查**: `scripts/production-check.sh` - 生产环境验证

详细使用说明请查看：[scripts/README.md](scripts/README.md)

## 📚 API使用示例

### ✅ 成功响应示例

**用户登录**（数据响应）：
```bash
curl -X POST http://localhost:3000/api/v1/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123456"}'
```

```json
{
  "user": {
    "id": "1",
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresAt": "2025-08-25T06:41:10.724Z"
}
```

**密码修改**（操作确认）：
```bash
curl -X PUT http://localhost:3000/api/v1/users/me/password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"oldPassword":"old123","newPassword":"new123"}'
```

```json
{"message": "密码修改成功"}
```

### ❌ 错误响应示例

**登录失败**：
```bash
curl -X POST http://localhost:3000/api/v1/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrongpassword"}'
```

```json
{
  "message": "用户名或密码错误",
  "timestamp": "2025-08-24T06:40:19.757Z",
  "path": "/api/v1/users/auth/login"
}
```

> 💡 **新API格式特点**：
> - ✅ 成功响应直接返回数据，无冗余字段
> - ⚡ 响应体积更小，传输更高效  
> - 🛡️ 错误信息标准化，包含时间戳和路径
> - 🔢 使用HTTP状态码表示成功/失败状态

## 📖 使用示例

### 自然语言查询示例

```
用户输入: "查询3年级2班所有学生的信息"

AI处理流程:
1. 意图识别: 查询学生信息
2. 表关联分析: students表 JOIN classes表
3. SQL生成: 
   SELECT s.* FROM students s 
   JOIN classes c ON s.class_id = c.id 
   WHERE c.grade = 3 AND c.name = '2班'
4. 结果展示: 表格 + JSON Schema
```

### 表管理示例

```
用户输入: "创建一个用户表，包含姓名、邮箱、密码和创建时间"

AI处理流程:
1. 解析需求: 创建用户表
2. 字段分析: name, email, password, created_at
3. SQL生成:
   CREATE TABLE users (
     id INT PRIMARY KEY AUTO_INCREMENT,
     name VARCHAR(100) NOT NULL,
     email VARCHAR(255) UNIQUE NOT NULL,
     password VARCHAR(255) NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   )
```

## 🔧 配置说明

### 数据库连接配置

支持多种数据库类型的连接：

```typescript
{
  "name": "MySQL生产环境",
  "type": "mysql",
  "host": "localhost",
  "port": 3306,
  "database": "production_db",
  "username": "admin",
  "password": "***",
  "ssl": true
}
```

### AI模型配置

```typescript
{
  "provider": "openai", // openai, claude, custom
  "apiKey": "sk-***",
  "model": "gpt-4",
  "maxTokens": 2048,
  "temperature": 0.1
}
```

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 📄 许可证

本项目使用 MIT 许可证。详情请见 [LICENSE](LICENSE) 文件。

## 🔮 未来规划

### 短期目标 (1-3个月)
- 支持更多数据库类型 (Oracle, SQL Server)
- 增强AI查询准确性
- 添加数据导入导出功能
- 实现查询结果缓存

### 中期目标 (3-6个月)
- 支持分布式数据库
- 添加实时数据监控
- 实现协作功能
- 移动端适配

### 长期目标 (6-12个月)
- 支持数据仓库和大数据平台
- AI驱动的数据库优化建议
- 企业级权限管理
- 云原生部署方案

## 📞 联系我们

- 项目维护者: [Your Name]
- 邮箱: your.email@example.com
- GitHub: [@niklaslc](https://github.com/niklaslc)

---

⭐ 如果这个项目对您有帮助，请给我们一个Star！