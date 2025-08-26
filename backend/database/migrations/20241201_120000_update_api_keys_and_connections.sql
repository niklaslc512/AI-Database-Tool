-- 🔄 更新API Key和数据库连接表结构以符合新的需求规范

-- 1. 更新API Key表结构 - 简化为单一ak-开头字符串格式
-- 重建api_keys表以移除key_secret列并重命名key_id为api_key
CREATE TABLE api_keys_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,              -- 重命名自key_id
  permissions TEXT,                          -- JSON格式权限列表
  database_ids TEXT,                         -- JSON格式存储关联的数据库连接ID列表
  last_used_at DATETIME,
  usage_count INTEGER DEFAULT 0,
  expires_at DATETIME,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 复制数据（排除key_secret列）
INSERT INTO api_keys_new (id, user_id, name, api_key, permissions, last_used_at, usage_count, expires_at, is_active, created_at)
SELECT id, user_id, name, key_id, permissions, last_used_at, usage_count, expires_at, is_active, created_at
FROM api_keys;

-- 删除旧表
DROP TABLE api_keys;

-- 重命名新表
ALTER TABLE api_keys_new RENAME TO api_keys;

-- 更新API Key表的索引
DROP INDEX IF EXISTS idx_api_keys_key_id;
CREATE INDEX IF NOT EXISTS idx_api_keys_api_key ON api_keys(api_key);

-- 2. 更新数据库连接表结构 - 简化为DSN连接字符串格式
ALTER TABLE database_connections DROP COLUMN host;
ALTER TABLE database_connections DROP COLUMN port;
ALTER TABLE database_connections DROP COLUMN database_name;
ALTER TABLE database_connections DROP COLUMN username;
ALTER TABLE database_connections DROP COLUMN password;
ALTER TABLE database_connections DROP COLUMN ssl;
ALTER TABLE database_connections RENAME COLUMN connection_string TO dsn;
ALTER TABLE database_connections ADD COLUMN status TEXT DEFAULT 'active'; -- active|inactive|error
ALTER TABLE database_connections ADD COLUMN last_tested_at DATETIME;
ALTER TABLE database_connections ADD COLUMN test_result TEXT; -- JSON格式存储测试结果

-- 3. 确保API Key表的permissions字段存在且格式正确
-- 如果permissions字段不存在，则添加它
ALTER TABLE api_keys ADD COLUMN permissions_temp TEXT;
UPDATE api_keys SET permissions_temp = permissions WHERE permissions IS NOT NULL;
ALTER TABLE api_keys DROP COLUMN permissions;
ALTER TABLE api_keys RENAME COLUMN permissions_temp TO permissions;

-- 更新现有数据，确保permissions字段有默认值
UPDATE api_keys SET permissions = '["read"]' WHERE permissions IS NULL OR permissions = '';

-- 4. 创建API Key使用日志表
CREATE TABLE IF NOT EXISTS api_key_usage_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  api_key_id INTEGER NOT NULL,
  database_connection_id VARCHAR(50),
  operation TEXT NOT NULL, -- query|insert|update|delete|connect
  request_path TEXT,
  request_method TEXT,
  ip_address TEXT,
  user_agent TEXT,
  response_status INTEGER,
  execution_time INTEGER, -- 毫秒
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE,
  FOREIGN KEY (database_connection_id) REFERENCES database_connections(id) ON DELETE SET NULL
);

-- 5. 创建相关索引
CREATE INDEX IF NOT EXISTS idx_api_keys_permissions ON api_keys(permissions);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_logs_api_key_id ON api_key_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_logs_created_at ON api_key_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_database_connections_status ON database_connections(status);
CREATE INDEX IF NOT EXISTS idx_database_connections_type ON database_connections(type);

-- 6. 更新触发器
CREATE TRIGGER IF NOT EXISTS update_database_connections_updated_at 
    AFTER UPDATE ON database_connections
BEGIN
    UPDATE database_connections SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 7. 注释：
-- API密钥权限管理通过api_keys表的permissions字段实现
-- permissions字段存储JSON格式的权限数组，如：["read", "write", "delete", "admin"]
-- 这样简化了权限系统，减少了表之间的关联复杂度