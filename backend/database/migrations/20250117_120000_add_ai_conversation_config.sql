-- 🤖 添加AI对话历史消息配置项
-- 为AI对话功能添加历史消息条数限制等配置

-- 插入AI对话相关的系统配置
INSERT OR IGNORE INTO configs (
  id,
  user_id,
  config_key,
  config_value,
  config_type,
  description,
  category,
  is_encrypted,
  created_at,
  updated_at
) VALUES (
  lower(hex(randomblob(16))),
  NULL,
  'ai_conversation_max_history_messages',
  '10',
  'system',
  'AI对话历史消息最大条数限制',
  'ai_conversation',
  FALSE,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- 插入AI对话默认模型配置
INSERT OR IGNORE INTO configs (
  id,
  user_id,
  config_key,
  config_value,
  config_type,
  description,
  category,
  is_encrypted,
  created_at,
  updated_at
) VALUES (
  lower(hex(randomblob(16))),
  NULL,
  'ai_conversation_default_model',
  '"gpt-3.5-turbo"',
  'system',
  'AI对话默认使用的模型',
  'ai_conversation',
  FALSE,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);


-- 插入AI对话历史消息保留天数配置
INSERT OR IGNORE INTO configs (
  id,
  user_id,
  config_key,
  config_value,
  config_type,
  description,
  category,
  is_encrypted,
  created_at,
  updated_at
) VALUES (
  lower(hex(randomblob(16))),
  NULL,
  'ai_conversation_history_retention_days',
  '30',
  'system',
  'AI对话历史消息保留天数',
  'ai_conversation',
  FALSE,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);