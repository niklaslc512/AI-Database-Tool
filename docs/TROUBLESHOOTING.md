# 故障排除指南

## 🔍 问题诊断流程

遇到问题时，请按以下顺序进行排查：

1. **检查服务状态** - 确认所有服务正常运行
2. **查看日志** - 分析错误日志找出根本原因
3. **验证配置** - 检查环境变量和配置文件
4. **测试连接** - 验证网络和数据库连接
5. **资源检查** - 确认系统资源充足

## 🚀 启动问题

### 服务无法启动

**症状**: Docker容器或服务启动失败

**排查步骤**:
```bash
# 1. 检查Docker服务状态
sudo systemctl status docker

# 2. 查看容器日志
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# 3. 检查端口占用
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :5432

# 4. 验证环境变量
docker-compose config
```

**常见解决方案**:
- 检查 `.env` 文件是否存在且配置正确
- 确认端口未被其他服务占用
- 验证Docker有足够权限访问文件
- 检查防火墙设置

### 数据库连接失败

**症状**: 后端服务无法连接到PostgreSQL

**错误信息**:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
Error: password authentication failed for user "postgres"
```

**排查步骤**:
```bash
# 1. 检查PostgreSQL容器状态
docker ps | grep postgres
docker logs ai-database-postgres

# 2. 测试数据库连接
docker exec -it ai-database-postgres psql -U postgres -d ai_database

# 3. 验证连接字符串
echo $DATABASE_URL

# 4. 检查网络连接
docker network ls
docker network inspect ai-database_default
```

**解决方案**:
```bash
# 重置数据库密码
docker-compose down
docker volume rm ai-database_postgres_data
docker-compose up -d postgres

# 手动创建数据库
docker exec -it ai-database-postgres createdb -U postgres ai_database

# 运行数据库迁移
docker exec -it ai-database-backend npm run db:migrate
```

### 前端无法访问

**症状**: 浏览器无法打开前端页面

**排查步骤**:
```bash
# 1. 检查前端容器状态
docker ps | grep frontend
docker logs ai-database-frontend

# 2. 测试端口访问
curl -I http://localhost:80
curl -I http://localhost:3000/health

# 3. 检查Nginx配置
docker exec -it ai-database-frontend nginx -t
```

**解决方案**:
- 确认前端构建成功
- 检查Nginx配置文件语法
- 验证API代理配置正确
- 检查SSL证书配置

## 🔌 连接问题

### API请求失败

**症状**: 前端无法调用后端API

**错误信息**:
```
CORS error: Access to fetch at 'http://localhost:3000/api/v1/users/me' 
from origin 'http://localhost:8080' has been blocked
```

**排查步骤**:
```bash
# 1. 检查CORS配置
curl -H "Origin: http://localhost:8080" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     http://localhost:3000/api/v1/users/me

# 2. 验证API端点
curl -X GET http://localhost:3000/api/v1/health

# 3. 检查网络连接
ping localhost
telnet localhost 3000
```

**解决方案**:
```typescript
// backend/src/app.ts - 更新CORS配置
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:3000',
    'https://your-domain.com'
  ],
  credentials: true
}));
```

### 数据库查询超时

**症状**: SQL查询执行时间过长或超时

**错误信息**:
```
Error: Query timeout after 30000ms
Error: Connection terminated unexpectedly
```

**排查步骤**:
```sql
-- 1. 检查活跃连接
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- 2. 查看慢查询
SELECT query, query_start, state, wait_event 
FROM pg_stat_activity 
WHERE query_start < NOW() - INTERVAL '1 minute';

-- 3. 检查锁等待
SELECT * FROM pg_locks WHERE NOT granted;

-- 4. 分析查询计划
EXPLAIN ANALYZE SELECT * FROM your_table WHERE condition;
```

**解决方案**:
```sql
-- 终止长时间运行的查询
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE query_start < NOW() - INTERVAL '5 minutes';

-- 添加索引优化查询
CREATE INDEX CONCURRENTLY idx_table_column ON table_name(column_name);

-- 调整连接池配置
-- backend/src/config/database.ts
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  query_timeout: 60000
});
```

## 🤖 AI服务问题

### OpenAI API调用失败

**症状**: AI查询功能无法正常工作

**错误信息**:
```
Error: Request failed with status code 401
Error: You exceeded your current quota
Error: Rate limit exceeded
```

**排查步骤**:
```bash
# 1. 验证API密钥
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models

# 2. 检查配额使用情况
# 登录OpenAI控制台查看使用情况

# 3. 测试API连接
node -e "console.log(process.env.OPENAI_API_KEY)"
```

**解决方案**:
```typescript
// backend/src/services/OpenAIService.ts - 添加重试机制
class OpenAIService {
  async generateSQL(query: string, retries = 3): Promise<any> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [/* ... */],
        timeout: 30000
      });
      return response;
    } catch (error) {
      if (retries > 0 && error.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.generateSQL(query, retries - 1);
      }
      throw error;
    }
  }
}
```

### AI响应解析错误

**症状**: AI返回的SQL无法正确解析

**错误信息**:
```
Error: Invalid JSON response from AI
Error: Generated SQL contains syntax errors
```

**排查步骤**:
```bash
# 1. 检查AI响应日志
docker logs ai-database-backend | grep "AI Response"

# 2. 验证提示词模板
cat backend/src/prompts/sql-generation.ts

# 3. 测试SQL语法
psql -U postgres -d ai_database -c "EXPLAIN SELECT 1;"
```

**解决方案**:
```typescript
// 改进AI响应验证
class AISQLController {
  private validateSQL(sql: string): boolean {
    // 基本SQL语法检查
    const forbiddenKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER'];
    const upperSQL = sql.toUpperCase();
    
    return !forbiddenKeywords.some(keyword => 
      upperSQL.includes(keyword)
    );
  }
  
  private async testSQL(sql: string, connectionId: string): Promise<boolean> {
    try {
      // 使用EXPLAIN测试SQL语法
      await this.databaseService.executeQuery(
        connectionId, 
        `EXPLAIN ${sql}`
      );
      return true;
    } catch (error) {
      return false;
    }
  }
}
```

## 💾 数据问题

### 数据丢失或损坏

**症状**: 数据库数据异常或丢失

**排查步骤**:
```bash
# 1. 检查数据库完整性
docker exec -it ai-database-postgres pg_dump -U postgres ai_database > backup.sql

# 2. 验证表结构
psql -U postgres -d ai_database -c "\dt"
psql -U postgres -d ai_database -c "\d users"

# 3. 检查数据一致性
psql -U postgres -d ai_database -c "SELECT COUNT(*) FROM users;"
```

**解决方案**:
```bash
# 从备份恢复数据
docker exec -i ai-database-postgres psql -U postgres ai_database < backup.sql

# 重新运行迁移
docker exec -it ai-database-backend npm run db:migrate:reset
docker exec -it ai-database-backend npm run db:seed
```

### 迁移失败

**症状**: 数据库迁移脚本执行失败

**错误信息**:
```
Error: relation "users" already exists
Error: column "email" of relation "users" does not exist
```

**排查步骤**:
```bash
# 1. 检查迁移状态
psql -U postgres -d ai_database -c "SELECT * FROM schema_migrations;"

# 2. 查看表结构
psql -U postgres -d ai_database -c "\d+ users"

# 3. 检查迁移文件
ls -la backend/migrations/
```

**解决方案**:
```bash
# 手动回滚迁移
psql -U postgres -d ai_database -c "DELETE FROM schema_migrations WHERE version = '20250115120000';"

# 重新运行迁移
docker exec -it ai-database-backend npm run db:migrate

# 如果需要完全重置
docker-compose down
docker volume rm ai-database_postgres_data
docker-compose up -d
```

## 🔧 性能问题

### 响应速度慢

**症状**: API响应时间过长

**排查步骤**:
```bash
# 1. 检查系统资源
docker stats
top
df -h

# 2. 分析慢查询
psql -U postgres -d ai_database -c "
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;"

# 3. 检查网络延迟
ping your-database-host
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/api/v1/health
```

**解决方案**:
```sql
-- 启用查询统计
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 添加索引
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_logs_created_at ON sql_execute_logs(created_at);

-- 优化查询
ANALYZE users;
VACUUM ANALYZE sql_execute_logs;
```

```typescript
// 添加缓存机制
import Redis from 'ioredis';

class CacheService {
  private redis = new Redis(process.env.REDIS_URL);
  
  async get(key: string): Promise<any> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  async set(key: string, value: any, ttl = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
}
```

### 内存使用过高

**症状**: 容器内存使用率持续上升

**排查步骤**:
```bash
# 1. 监控内存使用
docker stats --no-stream

# 2. 检查Node.js内存
docker exec -it ai-database-backend node -e "console.log(process.memoryUsage())"

# 3. 分析内存泄漏
# 使用Node.js内存分析工具
npm install -g clinic
clinic doctor -- node dist/index.js
```

**解决方案**:
```typescript
// 优化内存使用
class DatabaseService {
  async executeQuery(sql: string) {
    const client = await this.pool.connect();
    try {
      // 使用流式查询处理大结果集
      const query = new QueryStream(sql);
      const stream = client.query(query);
      
      const results = [];
      for await (const row of stream) {
        results.push(row);
        // 限制结果集大小
        if (results.length > 10000) {
          break;
        }
      }
      
      return results;
    } finally {
      client.release();
    }
  }
}
```

```yaml
# docker-compose.yml - 设置内存限制
services:
  backend:
    mem_limit: 1g
    memswap_limit: 1g
  postgres:
    mem_limit: 2g
    memswap_limit: 2g
```

## 🔐 安全问题

### 认证失败

**症状**: 用户无法登录或Token验证失败

**错误信息**:
```
Error: Invalid credentials
Error: Token has expired
Error: JsonWebTokenError: invalid signature
```

**排查步骤**:
```bash
# 1. 验证JWT密钥
echo $JWT_SECRET | wc -c  # 应该至少32字符

# 2. 检查Token格式
node -e "console.log(require('jsonwebtoken').decode('your-token'))"

# 3. 验证用户密码
psql -U postgres -d ai_database -c "SELECT id, username, password_hash FROM users WHERE username = 'admin';"
```

**解决方案**:
```typescript
// 重置用户密码
import bcrypt from 'bcrypt';

const newPassword = 'new-secure-password';
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

// 更新数据库
psql -U postgres -d ai_database -c "
UPDATE users 
SET password_hash = '${hashedPassword}' 
WHERE username = 'admin';"
```

### SQL注入风险

**症状**: 发现潜在的SQL注入漏洞

**排查步骤**:
```bash
# 1. 检查查询日志
grep -i "drop\|delete\|update\|insert" /var/log/postgresql/postgresql.log

# 2. 分析用户输入
docker logs ai-database-backend | grep "User input:"

# 3. 审计代码
grep -r "query.*+" backend/src/
grep -r "\${.*}" backend/src/
```

**解决方案**:
```typescript
// 使用参数化查询
class DatabaseService {
  async executeQuery(sql: string, params: any[] = []) {
    // 错误方式 - 容易SQL注入
    // const query = `SELECT * FROM users WHERE id = ${userId}`;
    
    // 正确方式 - 参数化查询
    const query = 'SELECT * FROM users WHERE id = $1';
    return await this.pool.query(query, [userId]);
  }
  
  // 验证和清理用户输入
  private sanitizeInput(input: string): string {
    return input.replace(/[;'"\-\-]/g, '');
  }
}
```

## 📊 监控和日志

### 日志分析

**查看应用日志**:
```bash
# 实时查看日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 过滤错误日志
docker-compose logs backend | grep ERROR
docker-compose logs backend | grep -i "error\|exception\|failed"

# 查看特定时间段日志
docker-compose logs --since="2025-01-15T10:00:00" backend
```

**日志级别配置**:
```typescript
// backend/src/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});
```

### 性能监控

**系统指标监控**:
```bash
# CPU和内存使用
watch -n 1 'docker stats --no-stream'

# 磁盘使用
df -h
du -sh /var/lib/docker/volumes/

# 网络连接
netstat -an | grep :3000
ss -tuln | grep :5432
```

**数据库性能监控**:
```sql
-- 连接数监控
SELECT count(*) as connections, state 
FROM pg_stat_activity 
GROUP BY state;

-- 慢查询监控
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements 
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC;

-- 锁等待监控
SELECT blocked_locks.pid AS blocked_pid,
       blocked_activity.usename AS blocked_user,
       blocking_locks.pid AS blocking_pid,
       blocking_activity.usename AS blocking_user,
       blocked_activity.query AS blocked_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity 
  ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks 
  ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity 
  ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

## 🆘 紧急恢复

### 服务快速恢复

```bash
# 1. 停止所有服务
docker-compose down

# 2. 清理容器和网络
docker system prune -f
docker network prune -f

# 3. 重新构建和启动
docker-compose build --no-cache
docker-compose up -d

# 4. 验证服务状态
docker-compose ps
curl http://localhost:3000/health
```

### 数据备份和恢复

```bash
# 创建数据备份
docker exec ai-database-postgres pg_dump -U postgres ai_database > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复数据
docker exec -i ai-database-postgres psql -U postgres ai_database < backup_20250115_120000.sql

# 备份Docker卷
docker run --rm -v ai-database_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .

# 恢复Docker卷
docker run --rm -v ai-database_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /data
```

## 📞 获取帮助

### 收集诊断信息

运行以下脚本收集系统信息：

```bash
#!/bin/bash
# collect-diagnostics.sh

echo "=== System Information ==="
uname -a
docker --version
docker-compose --version

echo "\n=== Container Status ==="
docker-compose ps

echo "\n=== Resource Usage ==="
docker stats --no-stream

echo "\n=== Recent Logs ==="
docker-compose logs --tail=50 backend
docker-compose logs --tail=50 postgres

echo "\n=== Network Configuration ==="
docker network ls
netstat -tlnp | grep -E ':(3000|5432|80|443)'

echo "\n=== Disk Usage ==="
df -h
docker system df
```

### 联系支持

在寻求帮助时，请提供：

1. **错误描述** - 详细描述问题现象
2. **错误日志** - 相关的错误日志信息
3. **环境信息** - 操作系统、Docker版本等
4. **配置文件** - 相关配置文件（隐藏敏感信息）
5. **重现步骤** - 问题重现的具体步骤

**支持渠道**:
- 📧 **邮件**: support@your-domain.com
- 🐛 **GitHub Issues**: [项目Issues页面](https://github.com/your-repo/issues)
- 💬 **讨论区**: [GitHub Discussions](https://github.com/your-repo/discussions)
- 📖 **文档**: [在线文档](https://docs.your-domain.com)

---

> 💡 **提示**: 大多数问题都可以通过重启服务、检查配置和查看日志来解决。遇到问题时保持冷静，按步骤排查！