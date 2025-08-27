-- 🔄 重新设计数据库结构，使用UUID作为用户ID
-- 优化为六个核心表：users、configs、database_connections、api_keys、api_key_logs、ai_conversations

-- 1. 🧑‍💼 用户表 - 使用UUID作为主键
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                      -- UUID字符串格式
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  roles TEXT NOT NULL DEFAULT 'guest',      -- 🎭 多角色支持，逗号分隔: admin,developer,guest
  status TEXT NOT NULL DEFAULT 'active',    -- active|inactive|locked
  display_name TEXT,
  avatar_url TEXT,
  last_login_at DATETIME,
  login_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. ⚙️ 配置表 - 存储用户个人配置和系统配置
CREATE TABLE IF NOT EXISTS configs (
  id TEXT PRIMARY KEY,                      -- UUID字符串格式
  user_id TEXT,                             -- NULL表示系统级配置
  config_key TEXT NOT NULL,                 -- 配置键名
  config_value TEXT,                        -- JSON格式配置值
  config_type TEXT NOT NULL DEFAULT 'user', -- user|system|global
  description TEXT,                         -- 配置描述
  category TEXT,                            -- 配置分类
  is_encrypted BOOLEAN DEFAULT FALSE,      -- 是否加密存储
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, config_key)               -- 同一用户的配置键唯一
);

-- 3. 🗄️ 数据库连接表 - 重命名为database_connections
CREATE TABLE IF NOT EXISTS database_connections (
  id TEXT PRIMARY KEY,                      -- UUID字符串格式
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,                       -- 连接名称
  type TEXT NOT NULL,                       -- postgresql|mysql|mongodb|sqlite
  dsn TEXT NOT NULL,                        -- 数据源名称/连接字符串
  metadata TEXT,                            -- JSON格式元数据
  status TEXT DEFAULT 'active',             -- active|inactive|error
  last_tested_at DATETIME,
  test_result TEXT,                         -- JSON格式测试结果
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. 🔑 API密钥表
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,                      -- UUID字符串格式
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,                       -- 密钥名称
  api_key TEXT UNIQUE NOT NULL,             -- API密钥 (ak_xxx格式)
  permissions TEXT,                         -- JSON格式权限列表
  database_ids TEXT,                        -- JSON格式关联的数据库连接ID列表
  last_used_at DATETIME,
  usage_count INTEGER DEFAULT 0,
  expires_at DATETIME,                      -- 过期时间
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. 📊 API密钥使用日志表
CREATE TABLE IF NOT EXISTS api_key_logs (
  id TEXT PRIMARY KEY,                      -- UUID字符串格式
  api_key_id TEXT NOT NULL,
  user_id TEXT,                             -- 冗余字段，便于查询
  database_connection_id TEXT,
  operation TEXT NOT NULL,                  -- query|insert|update|delete|connect|login
  request_path TEXT,
  request_method TEXT,
  ip_address TEXT,
  user_agent TEXT,
  response_status INTEGER,
  execution_time INTEGER,                   -- 毫秒
  error_message TEXT,                       -- 错误信息
  request_data TEXT,                        -- JSON格式请求数据
  response_data TEXT,                       -- JSON格式响应数据
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (database_connection_id) REFERENCES database_connections(id) ON DELETE SET NULL
);

-- 6. 🤖 AI对话记录表
CREATE TABLE IF NOT EXISTS ai_conversations (
  id TEXT PRIMARY KEY,                      -- UUID字符串格式
  conversation_id TEXT NOT NULL,            -- 对话会话ID
  user_id TEXT,                             -- 用户ID，可为空（匿名对话）
  database_connection_id TEXT,              -- 关联的数据库连接ID
  role TEXT NOT NULL,                       -- user|assistant|system
  content TEXT NOT NULL,                    -- 对话内容
  token_cost TEXT,                          -- token消耗信息(JSON格式)
  model TEXT,                               -- 使用的AI模型
  response_time INTEGER,                    -- 响应时间（毫秒）
  status TEXT DEFAULT 'completed',         -- completed|failed|pending
  error_message TEXT,                       -- 错误信息
  metadata TEXT,                            -- JSON格式元数据
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (database_connection_id) REFERENCES database_connections(id) ON DELETE SET NULL
);

-- 📇 创建索引
-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_roles ON users(roles);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 配置表索引
CREATE INDEX IF NOT EXISTS idx_configs_user_id ON configs(user_id);
CREATE INDEX IF NOT EXISTS idx_configs_config_key ON configs(config_key);
CREATE INDEX IF NOT EXISTS idx_configs_config_type ON configs(config_type);
CREATE INDEX IF NOT EXISTS idx_configs_created_at ON configs(created_at);

-- 数据库连接表索引
CREATE INDEX IF NOT EXISTS idx_database_connections_user_id ON database_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_database_connections_type ON database_connections(type);
CREATE INDEX IF NOT EXISTS idx_database_connections_status ON database_connections(status);
CREATE INDEX IF NOT EXISTS idx_database_connections_created_at ON database_connections(created_at);

-- API密钥表索引
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_api_key ON api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON api_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_at ON api_keys(created_at);

-- API密钥日志表索引
CREATE INDEX IF NOT EXISTS idx_api_key_logs_api_key_id ON api_key_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_key_logs_user_id ON api_key_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_key_logs_operation ON api_key_logs(operation);
CREATE INDEX IF NOT EXISTS idx_api_key_logs_created_at ON api_key_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_key_logs_response_status ON api_key_logs(response_status);

-- AI对话记录表索引
CREATE INDEX IF NOT EXISTS idx_ai_conversations_conversation_id ON ai_conversations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_role ON ai_conversations(role);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_status ON ai_conversations(status);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON ai_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_model ON ai_conversations(model);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_database_connection_id ON ai_conversations(database_connection_id);

-- SQL执行日志表
CREATE TABLE IF NOT EXISTS sql_execute_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  database_connection_id TEXT NOT NULL,
  conversation_id TEXT,                     -- 关联的对话ID（可选）
  sql_query TEXT NOT NULL,                 -- 执行的SQL语句
  execution_time INTEGER,                   -- 执行时间（毫秒）
  rows_affected INTEGER,                    -- 影响的行数
  status TEXT DEFAULT 'success',           -- success|error
  error_message TEXT,                       -- 错误信息
  result_preview TEXT,                      -- 结果预览（JSON格式）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (database_connection_id) REFERENCES database_connections(id) ON DELETE CASCADE,
  FOREIGN KEY (conversation_id) REFERENCES ai_conversations(conversation_id) ON DELETE SET NULL
);

-- SQL执行日志表索引
CREATE INDEX IF NOT EXISTS idx_sql_execute_logs_user_id ON sql_execute_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sql_execute_logs_database_connection_id ON sql_execute_logs(database_connection_id);
CREATE INDEX IF NOT EXISTS idx_sql_execute_logs_conversation_id ON sql_execute_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_sql_execute_logs_created_at ON sql_execute_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sql_execute_logs_status ON sql_execute_logs(status);

-- 🔄 创建触发器：自动更新 updated_at 字段
-- 先删除可能存在的触发器
DROP TRIGGER IF EXISTS update_users_updated_at;
CREATE TRIGGER update_users_updated_at 
    AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

DROP TRIGGER IF EXISTS update_configs_updated_at;
CREATE TRIGGER update_configs_updated_at 
    AFTER UPDATE ON configs
BEGIN
    UPDATE configs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

DROP TRIGGER IF EXISTS update_database_connections_updated_at;
CREATE TRIGGER update_database_connections_updated_at 
    AFTER UPDATE ON database_connections
BEGIN
    UPDATE database_connections SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

DROP TRIGGER IF EXISTS update_api_keys_updated_at;
CREATE TRIGGER update_api_keys_updated_at 
    AFTER UPDATE ON api_keys
BEGIN
    UPDATE api_keys SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 🔄 创建触发器：API密钥使用统计
DROP TRIGGER IF EXISTS update_api_key_usage;
CREATE TRIGGER update_api_key_usage
    AFTER UPDATE OF last_used_at ON api_keys
BEGIN
    UPDATE api_keys SET usage_count = usage_count + 1 WHERE id = NEW.id;
END;

-- 📝 表结构说明：
-- 1. users: 用户基础信息，使用UUID作为主键
-- 2. configs: 用户配置和系统配置，支持加密存储
-- 3. database_connections: 数据库连接信息，使用DSN格式
-- 4. api_keys: API密钥管理，支持权限控制和过期时间
-- 5. api_key_logs: API使用日志，详细记录所有操作
-- 6. ai_conversations: AI对话记录，包含token使用和成本统计