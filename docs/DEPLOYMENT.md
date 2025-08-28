# 部署指南

## 🚀 部署概览

本指南提供了AI语义化数据库管理系统的完整部署方案，支持多种部署方式：

- **Docker Compose** (推荐) - 快速部署，适合开发和小型生产环境
- **Kubernetes** - 企业级部署，支持高可用和自动扩缩容
- **传统部署** - 直接在服务器上部署，适合简单场景

## 📋 系统要求

### 最低配置
- **CPU**: 2核心
- **内存**: 4GB RAM
- **存储**: 20GB SSD
- **网络**: 100Mbps

### 推荐配置
- **CPU**: 4核心
- **内存**: 8GB RAM
- **存储**: 50GB SSD
- **网络**: 1Gbps

### 软件依赖
- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / macOS 12+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Node.js**: 18.0+ (传统部署)
- **PostgreSQL**: 13.0+ (传统部署)

## 🐳 Docker Compose 部署 (推荐)

### 1. 准备部署文件

创建 `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  # PostgreSQL 数据库
  postgres:
    image: postgres:15-alpine
    container_name: ai-database-postgres
    environment:
      POSTGRES_DB: ai_database
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    networks:
      - ai-database-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis 缓存
  redis:
    image: redis:7-alpine
    container_name: ai-database-redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - ai-database-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 后端服务
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: ai-database-backend
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/ai_database
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      CORS_ORIGIN: ${FRONTEND_URL}
    ports:
      - "3000:3000"
    networks:
      - ai-database-network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 前端服务
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        VITE_API_BASE_URL: ${BACKEND_URL}
    container_name: ai-database-frontend
    ports:
      - "80:80"
      - "443:443"
    networks:
      - ai-database-network
    depends_on:
      - backend
    restart: unless-stopped
    volumes:
      - ./ssl:/etc/nginx/ssl:ro  # SSL证书挂载
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Nginx 反向代理 (可选)
  nginx:
    image: nginx:alpine
    container_name: ai-database-nginx
    ports:
      - "8080:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    networks:
      - ai-database-network
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

networks:
  ai-database-network:
    driver: bridge
```

### 2. 环境配置

创建 `.env.prod`:

```bash
# 数据库配置
POSTGRES_PASSWORD=your-secure-postgres-password

# Redis配置
REDIS_PASSWORD=your-secure-redis-password

# JWT密钥
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters

# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key

# 服务URL
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://api.your-domain.com

# SSL证书路径 (如果使用HTTPS)
SSL_CERT_PATH=/path/to/your/cert.pem
SSL_KEY_PATH=/path/to/your/private.key
```

### 3. 构建和部署

```bash
# 1. 克隆项目
git clone <repository-url>
cd ai-database

# 2. 配置环境变量
cp .env.example .env.prod
vim .env.prod  # 编辑配置

# 3. 构建并启动服务
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# 4. 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 5. 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

### 4. 数据库初始化

```bash
# 进入后端容器
docker exec -it ai-database-backend bash

# 运行数据库迁移
npm run db:migrate

# 初始化数据
npm run db:seed
```

## ☸️ Kubernetes 部署

### 1. 命名空间配置

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ai-database
```

### 2. ConfigMap 配置

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ai-database-config
  namespace: ai-database
data:
  NODE_ENV: "production"
  PORT: "3000"
  DATABASE_HOST: "postgres-service"
  DATABASE_PORT: "5432"
  DATABASE_NAME: "ai_database"
  REDIS_HOST: "redis-service"
  REDIS_PORT: "6379"
```

### 3. Secret 配置

```yaml
# secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: ai-database-secrets
  namespace: ai-database
type: Opaque
data:
  postgres-password: <base64-encoded-password>
  redis-password: <base64-encoded-password>
  jwt-secret: <base64-encoded-jwt-secret>
  openai-api-key: <base64-encoded-openai-key>
```

### 4. PostgreSQL 部署

```yaml
# postgres.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: ai-database
spec:
  serviceName: postgres-service
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_DB
          value: ai_database
        - name: POSTGRES_USER
          value: postgres
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: ai-database-secrets
              key: postgres-password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: ai-database
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
```

### 5. 后端服务部署

```yaml
# backend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: ai-database
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: ai-database/backend:latest
        envFrom:
        - configMapRef:
            name: ai-database-config
        env:
        - name: DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: ai-database-secrets
              key: postgres-password
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: ai-database-secrets
              key: jwt-secret
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-database-secrets
              key: openai-api-key
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: ai-database
spec:
  selector:
    app: backend
  ports:
  - port: 3000
    targetPort: 3000
  type: ClusterIP
```

### 6. Ingress 配置

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ai-database-ingress
  namespace: ai-database
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - your-domain.com
    - api.your-domain.com
    secretName: ai-database-tls
  rules:
  - host: your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
  - host: api.your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 3000
```

### 7. 部署到Kubernetes

```bash
# 1. 创建命名空间
kubectl apply -f namespace.yaml

# 2. 创建配置和密钥
kubectl apply -f configmap.yaml
kubectl apply -f secrets.yaml

# 3. 部署数据库
kubectl apply -f postgres.yaml
kubectl apply -f redis.yaml

# 4. 部署应用服务
kubectl apply -f backend.yaml
kubectl apply -f frontend.yaml

# 5. 配置Ingress
kubectl apply -f ingress.yaml

# 6. 查看部署状态
kubectl get pods -n ai-database
kubectl get services -n ai-database
kubectl get ingress -n ai-database
```

## 🖥️ 传统部署

### 1. 服务器准备

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y nodejs npm postgresql postgresql-contrib nginx

# CentOS/RHEL
sudo yum update
sudo yum install -y nodejs npm postgresql postgresql-server nginx
```

### 2. 数据库设置

```bash
# 启动PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库和用户
sudo -u postgres psql
CREATE DATABASE ai_database;
CREATE USER ai_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE ai_database TO ai_user;
\q
```

### 3. 应用部署

```bash
# 1. 克隆项目
git clone <repository-url>
cd ai-database

# 2. 安装依赖
cd backend
npm ci --production
cd ../frontend
npm ci

# 3. 构建前端
npm run build

# 4. 配置环境变量
cp backend/.env.example backend/.env.production
vim backend/.env.production

# 5. 运行数据库迁移
cd backend
npm run db:migrate

# 6. 启动后端服务
npm run start:prod
```

### 4. Nginx 配置

```nginx
# /etc/nginx/sites-available/ai-database
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # 前端静态文件
    location / {
        root /path/to/ai-database/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. 系统服务配置

```bash
# 创建systemd服务文件
sudo vim /etc/systemd/system/ai-database.service
```

```ini
[Unit]
Description=AI Database Backend Service
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/ai-database/backend
Environment=NODE_ENV=production
EnvironmentFile=/path/to/ai-database/backend/.env.production
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# 启动服务
sudo systemctl daemon-reload
sudo systemctl enable ai-database
sudo systemctl start ai-database
```

## 🔧 配置优化

### 性能调优

**PostgreSQL 优化**:
```sql
-- postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
max_connections = 100
```

**Node.js 优化**:
```bash
# 设置环境变量
export NODE_OPTIONS="--max-old-space-size=2048"
export UV_THREADPOOL_SIZE=16
```

### 监控配置

**健康检查端点**:
```typescript
// backend/src/routes/health.ts
app.get('/health', async (req, res) => {
  try {
    // 检查数据库连接
    await pool.query('SELECT 1');
    
    // 检查Redis连接
    await redis.ping();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

## 🔒 安全配置

### SSL/TLS 配置

```bash
# 使用Let's Encrypt获取免费SSL证书
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 防火墙配置

```bash
# UFW配置
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 环境变量安全

```bash
# 设置文件权限
chmod 600 .env.production
chown root:root .env.production
```

## 📊 监控和日志

### 日志配置

```yaml
# docker-compose.logging.yml
version: '3.8'
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 监控指标

- **系统指标**: CPU、内存、磁盘使用率
- **应用指标**: 响应时间、错误率、吞吐量
- **数据库指标**: 连接数、查询性能、锁等待

## 🚨 故障排除

### 常见问题

**数据库连接失败**:
```bash
# 检查数据库状态
docker-compose logs postgres

# 测试连接
psql -h localhost -U postgres -d ai_database
```

**内存不足**:
```bash
# 检查内存使用
docker stats

# 调整容器内存限制
docker-compose up -d --scale backend=2
```

**SSL证书问题**:
```bash
# 检查证书有效期
openssl x509 -in cert.pem -text -noout

# 续期证书
sudo certbot renew
```

## 📈 扩展部署

### 负载均衡

```yaml
# docker-compose.scale.yml
services:
  backend:
    deploy:
      replicas: 3
  
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx/load-balancer.conf:/etc/nginx/nginx.conf
```

### 数据库集群

```yaml
# PostgreSQL主从复制配置
services:
  postgres-master:
    image: postgres:15-alpine
    environment:
      POSTGRES_REPLICATION_USER: replicator
      POSTGRES_REPLICATION_PASSWORD: repl_password
  
  postgres-slave:
    image: postgres:15-alpine
    environment:
      PGUSER: postgres
      POSTGRES_MASTER_SERVICE: postgres-master
```

---

> 🎯 **部署成功后**，访问 `https://your-domain.com` 即可使用AI语义化数据库管理系统！

> 📞 **需要帮助？** 查看 [故障排除指南](TROUBLESHOOTING.md) 或提交 [Issue](https://github.com/your-repo/issues)。