-- 🗄️ PostgreSQL 初始化脚本
-- 创建用户和启用向量扩展

-- 创建向量扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 验证扩展安装
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';

-- 创建示例向量表
CREATE TABLE IF NOT EXISTS embeddings (
    id SERIAL PRIMARY KEY,
    content TEXT,
    embedding vector(1536),  -- OpenAI embedding 维度
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建向量索引以提高查询性能
CREATE INDEX IF NOT EXISTS embeddings_embedding_idx ON embeddings 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 授权给用户
GRANT ALL PRIVILEGES ON TABLE embeddings TO aidb_user;
GRANT USAGE, SELECT ON SEQUENCE embeddings_id_seq TO aidb_user;