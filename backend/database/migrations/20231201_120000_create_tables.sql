-- 🏗️ 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  roles TEXT NOT NULL DEFAULT 'guest',      -- 🎭 多角色支持，逗号分隔: admin,developer,guest
  status TEXT NOT NULL DEFAULT 'active',    -- active|inactive|locked
  display_name TEXT,
  avatar_url TEXT,
  settings TEXT,                            -- JSON格式用户设置
  last_login_at DATETIME,
  login_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建数据库连接表
CREATE TABLE IF NOT EXISTS database_connections (
  id VARCHAR(50) PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL,
  host VARCHAR(255),
  port INTEGER,
  database_name VARCHAR(100),
  username VARCHAR(100),
  password VARCHAR(255),
  ssl BOOLEAN DEFAULT FALSE,
  connection_string TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 创建API密钥表
CREATE TABLE IF NOT EXISTS api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,                       -- 密钥名称
  key_id TEXT UNIQUE NOT NULL,              -- 公开的密钥ID (ak_xxx)
  key_secret TEXT NOT NULL,                 -- 加密存储的密钥
  permissions TEXT,                         -- JSON格式权限列表
  last_used_at DATETIME,
  usage_count INTEGER DEFAULT 0,
  expires_at DATETIME,                      -- 过期时间
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建授权令牌表
CREATE TABLE IF NOT EXISTS auth_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  token TEXT UNIQUE NOT NULL,
  token_type TEXT NOT NULL,                 -- jwt|oauth|temporary
  scope TEXT,                               -- JSON格式授权范围
  client_info TEXT,                         -- JSON格式客户端信息
  expires_at DATETIME NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建登录日志表
CREATE TABLE IF NOT EXISTS login_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  username TEXT,
  ip_address TEXT,
  user_agent TEXT,
  login_method TEXT,                        -- password|api_key|oauth
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 创建索引
-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_roles ON users(roles);

-- 数据库连接表索引
CREATE INDEX IF NOT EXISTS idx_database_connections_user_id ON database_connections (user_id);

-- API密钥表索引
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_id ON api_keys(key_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires ON api_keys(expires_at);

-- 授权令牌表索引
CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires ON auth_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_revoked ON auth_tokens(is_revoked);

-- 登录日志表索引
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_username ON login_logs(username);
CREATE INDEX IF NOT EXISTS idx_login_logs_created_at ON login_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_login_logs_success ON login_logs(success);

-- 触发器：更新 updated_at 字段
CREATE TRIGGER IF NOT EXISTS update_users_updated_at 
    AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 触发器：API密钥使用次数统计
CREATE TRIGGER IF NOT EXISTS update_api_key_usage
    AFTER UPDATE OF last_used_at ON api_keys
BEGIN
    UPDATE api_keys SET usage_count = usage_count + 1 WHERE id = NEW.id;
END;