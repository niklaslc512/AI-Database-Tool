# AI驱动数据库管理系统

一个由大模型驱动的通用数据库管理系统，支持通过自然语言进行数据库查询和管理操作。

## 🚀 项目概述

本项目旨在构建一个智能化的数据库管理平台，用户可以通过自然语言描述需求，AI自动生成相应的SQL语句并执行数据库操作。系统采用前后端分离架构，支持多种类型的数据库连接和管理。

### ✨ 核心特性

- **🤖 AI驱动查询**: 通过自然语言描述查询需求，AI自动生成SQL语句
- **🗄️ 多数据库支持**: 统一接口支持MySQL、PostgreSQL、SQLite、MongoDB等多种数据库
- **📊 智能数据分析**: 自动生成数据可视化图表和JSON Schema
- **🛠️ 表结构管理**: AI辅助的数据库表创建、修改和删除操作
- **🔒 安全审计**: 操作权限控制和完整的审计日志
- **📱 现代化界面**: 基于Vue3的响应式Web界面

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

### AI集成
- **大模型**: 支持OpenAI GPT、Claude等主流大模型
- **自然语言处理**: 意图识别和SQL生成
- **智能优化**: 查询性能分析和优化建议

## 📋 实施计划

### Phase 1: 基础架构搭建 (Week 1-2)
- [x] 项目初始化和目录结构
- [ ] 后端Express框架搭建
- [ ] 前端Vue3项目初始化
- [ ] SQLite数据库设计
- [ ] 基础API接口设计

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