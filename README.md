# AI语义化数据库管理系统

![AI Database System](docs/intro.jpeg)

一个由大模型驱动的智能化数据库管理系统，通过AI语义理解实现自然语言到数据库操作的智能转换。用户可以用自然语言描述需求，系统自动生成并执行相应的SQL语句，大幅降低数据库操作门槛。

## ✨ 核心价值

**🧠 智能化操作** - 告别复杂的SQL语法，用自然语言即可完成数据库操作  
**🔗 统一管理** - 支持多种数据库类型的统一连接和管理  
**🚀 高效开发** - AI辅助的表结构设计和查询优化，提升开发效率  
**📊 智能分析** - 自动生成数据统计和可视化图表  
**🛡️ 安全可靠** - 企业级安全控制和操作审计

## 🎯 设计理念

### 核心思想

**降低门槛** - 让非技术人员也能轻松操作数据库  
**提升效率** - 通过AI辅助减少重复性工作  
**智能化** - 从简单的查询到复杂的数据分析，全程AI驱动  
**统一体验** - 不同数据库类型提供一致的操作体验  

### 技术架构

```
用户自然语言 → AI语义理解 → SQL生成 → 数据库执行 → 结果展示
      ↓              ↓           ↓          ↓         ↓
   意图识别      上下文分析    安全检查    连接管理   智能可视化
```

## 🚀 核心功能

### 已实现功能

- **🧠 AI语义化查询**: 自然语言转SQL，支持复杂查询逻辑
- **🔗 多数据库连接**: 统一管理PostgreSQL、MySQL、SQLite等
- **📊 智能数据分析**: 自动生成统计图表和数据洞察
- **🛠️ 表结构管理**: AI辅助的表设计和索引优化
- **📈 查询历史**: 完整的操作记录和性能监控
- **🔒 安全控制**: 用户权限管理和API密钥管理
- **📱 现代化界面**: 响应式设计，支持多标签操作

### 即将开发功能

- **🔍 向量搜索**: 基于pgvector的语义搜索能力
- **🤝 智能连表**: AI自动推断表关系，生成复杂JOIN查询
- **📊 高级分析**: 数据趋势预测和异常检测
- **🌐 多数据库支持**: MongoDB、Oracle、SQL Server等
- **📱 移动端适配**: 响应式设计优化
- **🔄 实时同步**: 数据变更实时监控和通知
- **🎨 可视化增强**: 更丰富的图表类型和交互功能

## 🛠️ 技术栈

**前端**: Vue 3 + TypeScript + TailwindCSS + Vite  
**后端**: Node.js + Express + TypeScript  
**数据库**: SQLite (开发) / PostgreSQL (生产)  
**AI模型**: OpenAI GPT-4 / Claude-3  
**部署**: Docker + Nginx

## 📈 开发进度

### ✅ 已完成 (v1.0)
- 基础架构搭建和项目初始化
- AI语义化查询核心功能
- 数据库连接管理系统
- 用户认证和权限控制
- 现代化前端界面
- API响应标准化
- 查询历史和日志记录

### 🚧 开发中 (v1.1)
- 查询结果可视化优化
- 表结构管理增强
- 性能监控和优化
- 错误处理改进

### 📋 计划中 (v1.2+)
- 向量搜索和语义分析
- 多数据库类型支持
- 高级数据分析功能
- 移动端适配
- 企业级部署方案

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 8.0.0

### 一键启动（推荐）

```bash
# 克隆项目
git clone https://github.com/niklaslc/ai-database.git
cd ai-database

# 使用脚本一键启动
./run.sh
```

### 手动安装

```bash
# 1. 安装依赖
cd backend && npm install
cd ../frontend && npm install

# 2. 配置环境变量
cp backend/.env.example backend/.env
# 编辑 .env 文件，配置 OpenAI API Key

# 3. 初始化数据库
cd backend && npm run db:init

# 4. 启动服务
npm run dev  # 后端
cd ../frontend && npm run dev  # 前端
```

访问 `http://localhost:3000` 开始使用。

> 💡 **提示**: 详细的安装和配置说明请查看 [docs/](docs/) 目录

## 💡 使用示例

### AI语义化查询

```
用户输入: "查询销售额最高的前10个产品"

AI处理:
1. 理解意图: 查询产品销售数据
2. 分析表结构: products, orders表
3. 生成SQL: SELECT p.name, SUM(o.amount) as sales 
            FROM products p JOIN orders o ON p.id = o.product_id 
            GROUP BY p.id ORDER BY sales DESC LIMIT 10
4. 执行并展示结果
```

### 表结构管理

```
用户输入: "创建一个用户表，包含姓名、邮箱、密码"

AI生成:
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```





## 📚 文档

- [API文档](docs/API_MIGRATION_GUIDE.md) - 详细的API使用说明
- [部署指南](docs/project.md) - 生产环境部署配置
- [开发文档](docs/) - 开发相关的技术文档
- [更新日志](docs/VERSIONS.md) - 版本更新记录

## 📄 许可证

本项目使用 MIT 许可证。详情请见 [LICENSE](LICENSE) 文件。

## 🔮 未来规划

### 近期目标 (Q1 2025)
- **🔍 向量搜索**: 集成pgvector，支持语义搜索
- **📊 可视化增强**: 更丰富的图表类型和交互
- **🌐 多数据库**: 支持MongoDB、Oracle、SQL Server
- **📱 移动优化**: 响应式设计改进

### 中期目标 (Q2-Q3 2025)
- **🤖 AI增强**: 更智能的查询优化和建议
- **🔄 实时功能**: 数据变更监控和通知
- **👥 协作功能**: 多用户协作和分享
- **🛡️ 企业级**: 高级权限控制和审计

### 长期愿景 (2025+)
- **☁️ 云原生**: 支持云数据库和容器化部署
- **🧠 智能运维**: AI驱动的性能优化和故障诊断
- **🌍 生态系统**: 插件市场和第三方集成
- **📈 大数据**: 支持数据仓库和分析平台

## 🤝 贡献

欢迎提交Issue和Pull Request！

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目使用 MIT 许可证。详情请见 [LICENSE](LICENSE) 文件。

---

⭐ 如果这个项目对您有帮助，请给我们一个Star！