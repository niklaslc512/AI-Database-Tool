# API使用示例

## 📚 API响应格式说明

### v1.1.0 - API响应标准化

我们在v1.1.0中对API响应格式进行了标准化改造，提升了系统的简洁性和性能：

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
  "path": "/api/v1/auth/login"
}
```

> ⚠️ **破坏性更新**: 此版本与旧版本不兼容，客户端需要同时更新。

## ✅ 成功响应示例

### 用户认证

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

### 数据库连接管理

**创建数据库连接**：
```bash
curl -X POST http://localhost:3000/api/v1/database-connections \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "生产环境数据库",
    "type": "postgresql",
    "host": "localhost",
    "port": 5432,
    "database": "production_db",
    "username": "admin",
    "password": "password123"
  }'
```

```json
{
  "id": "conn_123",
  "name": "生产环境数据库",
  "type": "postgresql",
  "host": "localhost",
  "port": 5432,
  "database": "production_db",
  "status": "connected",
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

**获取连接列表**：
```bash
curl -X GET http://localhost:3000/api/v1/database-connections \
  -H "Authorization: Bearer YOUR_TOKEN"
```

```json
[
  {
    "id": "conn_123",
    "name": "生产环境数据库",
    "type": "postgresql",
    "status": "connected",
    "lastUsed": "2025-01-15T10:30:00.000Z"
  },
  {
    "id": "conn_456",
    "name": "测试数据库",
    "type": "mysql",
    "status": "disconnected",
    "lastUsed": "2025-01-14T15:20:00.000Z"
  }
]
```

### AI语义化查询

**执行AI查询**：
```bash
curl -X POST http://localhost:3000/api/v1/ai-sql/execute \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "查询销售额最高的前10个产品",
    "connectionId": "conn_123"
  }'
```

```json
{
  "sql": "SELECT p.name, SUM(o.amount) as total_sales FROM products p JOIN orders o ON p.id = o.product_id GROUP BY p.id, p.name ORDER BY total_sales DESC LIMIT 10",
  "explanation": "查询产品表和订单表，按产品分组计算销售总额，并按销售额降序排列取前10名",
  "results": {
    "columns": [
      {"name": "name", "type": "varchar", "length": 255},
      {"name": "total_sales", "type": "decimal", "length": 10}
    ],
    "rows": [
      ["iPhone 15", 1250000.00],
      ["MacBook Pro", 980000.00],
      ["iPad Air", 750000.00]
    ],
    "rowCount": 10,
    "executionTime": 45
  },
  "tokenUsage": {
    "promptTokens": 150,
    "completionTokens": 80,
    "totalTokens": 230
  }
}
```

### 表结构管理

**获取表列表**：
```bash
curl -X GET http://localhost:3000/api/v1/database-connections/conn_123/tables \
  -H "Authorization: Bearer YOUR_TOKEN"
```

```json
[
  {
    "name": "users",
    "type": "table",
    "rowCount": 1250,
    "size": "2.5MB"
  },
  {
    "name": "products",
    "type": "table",
    "rowCount": 500,
    "size": "1.2MB"
  },
  {
    "name": "orders",
    "type": "table",
    "rowCount": 5000,
    "size": "8.7MB"
  }
]
```

**获取表结构**：
```bash
curl -X GET http://localhost:3000/api/v1/database-connections/conn_123/tables/users/schema \
  -H "Authorization: Bearer YOUR_TOKEN"
```

```json
{
  "tableName": "users",
  "columns": [
    {
      "name": "id",
      "type": "uuid",
      "nullable": false,
      "defaultValue": "gen_random_uuid()",
      "isPrimaryKey": true
    },
    {
      "name": "username",
      "type": "varchar",
      "length": 100,
      "nullable": false,
      "isUnique": true
    },
    {
      "name": "email",
      "type": "varchar",
      "length": 255,
      "nullable": false,
      "isUnique": true
    },
    {
      "name": "created_at",
      "type": "timestamp",
      "nullable": false,
      "defaultValue": "CURRENT_TIMESTAMP"
    }
  ],
  "indexes": [
    {
      "name": "users_pkey",
      "type": "primary",
      "columns": ["id"]
    },
    {
      "name": "users_username_key",
      "type": "unique",
      "columns": ["username"]
    }
  ]
}
```

## ❌ 错误响应示例

### 认证错误

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

**Token过期**：
```bash
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer EXPIRED_TOKEN"
```

```json
{
  "message": "Token已过期，请重新登录",
  "timestamp": "2025-08-24T06:45:30.123Z",
  "path": "/api/v1/users/me"
}
```

### 数据库连接错误

**连接失败**：
```bash
curl -X POST http://localhost:3000/api/v1/database-connections \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "错误的连接",
    "type": "postgresql",
    "host": "invalid-host",
    "port": 5432,
    "database": "nonexistent_db",
    "username": "admin",
    "password": "wrong_password"
  }'
```

```json
{
  "message": "数据库连接失败: connection to server at \"invalid-host\" (127.0.0.1), port 5432 failed",
  "timestamp": "2025-08-24T06:50:15.456Z",
  "path": "/api/v1/database-connections"
}
```

### AI查询错误

**查询解析失败**：
```bash
curl -X POST http://localhost:3000/api/v1/ai-sql/execute \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "这是一个无法理解的查询请求",
    "connectionId": "conn_123"
  }'
```

```json
{
  "message": "无法理解您的查询意图，请尝试更具体的描述",
  "timestamp": "2025-08-24T06:55:20.789Z",
  "path": "/api/v1/ai-sql/execute"
}
```

## 💡 API格式特点

> 💡 **新API格式特点**：
> - ✅ 成功响应直接返回数据，无冗余字段
> - ⚡ 响应体积更小，传输更高效  
> - 🛡️ 错误信息标准化，包含时间戳和路径
> - 🔢 使用HTTP状态码表示成功/失败状态

## 📖 相关文档

- [API迁移指南](API_MIGRATION_GUIDE.md) - 从旧版本迁移的详细说明
- [API标准化报告](API_STANDARDIZATION_REPORT.md) - 完整的改造报告
- [技术架构](ARCHITECTURE.md) - 系统架构和技术栈详情