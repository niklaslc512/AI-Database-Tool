# MongoDB连接配置示例

## MongoDB适配器特性

本项目的MongoDB适配器提供了统一的数据库接口，支持以下特性：

### 支持的操作类型
- ✅ 连接管理和测试
- ✅ 集合（表）列表获取
- ✅ 文档模式推断
- ✅ 索引信息查询
- ✅ 基本CRUD操作
- ✅ 事务支持
- ✅ 统计信息获取

### 连接配置示例

#### 标准连接
```json
{
  "name": "MongoDB本地环境",
  "type": "mongodb",
  "host": "localhost",
  "port": 27017,
  "database": "myapp_db",
  "username": "admin",
  "password": "password123",
  "ssl": false
}
```

#### 使用连接字符串
```json
{
  "name": "MongoDB Atlas",
  "type": "mongodb",
  "connectionString": "mongodb+srv://username:password@cluster0.mongodb.net/myapp_db?retryWrites=true&w=majority",
  "database": "myapp_db"
}
```

#### MongoDB副本集
```json
{
  "name": "MongoDB副本集",
  "type": "mongodb",
  "connectionString": "mongodb://user:pass@mongo1.example.com:27017,mongo2.example.com:27017,mongo3.example.com:27017/myapp_db?replicaSet=myReplicaSet",
  "database": "myapp_db"
}
```

### 特殊功能说明

#### 1. 模式推断
由于MongoDB是无模式数据库，适配器会：
- 自动采样集合中的文档
- 推断字段类型和结构
- 识别混合类型字段
- 提供字段使用统计

#### 2. SQL转换
适配器提供基础的SQL到MongoDB查询转换：
- SELECT -> find()
- INSERT -> insertOne()
- UPDATE -> updateMany()
- DELETE -> deleteMany()

*注意：复杂的SQL查询可能需要重写为MongoDB聚合管道*

#### 3. 类型映射
| SQL类型 | MongoDB BSON类型 | 说明 |
|---------|------------------|------|
| VARCHAR | String | 字符串类型 |
| INT | Number | 32位整数 |
| BIGINT | Long | 64位整数 |
| DECIMAL | Decimal128 | 高精度小数 |
| BOOLEAN | Boolean | 布尔值 |
| DATE | Date | 日期时间 |
| JSON | Object | 嵌套对象 |
| BLOB | BinData | 二进制数据 |

### 使用建议

#### 1. 性能优化
- 为常用查询字段创建索引
- 使用投影减少数据传输
- 合理使用分页查询

#### 2. 数据建模
- 考虑嵌入式文档 vs 引用
- 避免过深的嵌套结构
- 合理设计集合分片键

#### 3. 事务使用
- 仅在必要时使用事务
- 保持事务简短
- 注意副本集要求

### 限制说明

1. **SQL兼容性**：仅支持基础SQL操作，复杂查询需要使用MongoDB原生语法
2. **连接数限制**：默认连接池大小为10，可根据需要调整
3. **事务范围**：单文档事务无限制，多文档事务需要副本集或分片集群

### 错误处理

常见错误及解决方案：

- **连接超时**：检查网络连接和防火墙设置
- **认证失败**：验证用户名、密码和数据库权限
- **集合不存在**：MongoDB会自动创建集合，确保有写入权限
- **事务失败**：检查副本集配置和网络稳定性

### 监控和调试

可通过以下方式监控MongoDB连接：
1. 数据库统计信息API
2. 连接池状态检查
3. 查询执行计划分析
4. 性能指标收集