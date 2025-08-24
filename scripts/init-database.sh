#!/bin/bash

# AI数据库管理系统 - 数据库初始化脚本
# 使用方法: bash scripts/init-database.sh

echo "=== AI数据库管理系统 - 数据库初始化 ==="
echo ""

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js 22"
    exit 1
fi

# 检查npm环境
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到npm，请确保npm已正确安装"
    exit 1
fi

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "📁 项目根目录: $PROJECT_ROOT"
echo ""

# 进入后端目录
BACKEND_DIR="$PROJECT_ROOT/backend"
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ 错误: 后端目录不存在: $BACKEND_DIR"
    exit 1
fi

cd "$BACKEND_DIR"
echo "🚀 切换到后端目录: $BACKEND_DIR"

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装后端依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 安装后端依赖失败"
        exit 1
    fi
    echo "✓ 后端依赖安装完成"
else
    echo "✓ 后端依赖已安装"
fi

# 编译TypeScript（如果需要）
echo "🔧 编译TypeScript代码..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
    echo "❌ TypeScript编译检查失败"
    exit 1
fi

# 运行数据库初始化脚本
echo "💾 运行数据库初始化..."
npx ts-node init-database.ts
if [ $? -ne 0 ]; then
    echo "❌ 数据库初始化失败"
    exit 1
fi

echo ""
echo "🎉 数据库初始化完成！"
echo ""
echo "📝 下一步操作:"
echo "  1. 使用 'npm run dev' 启动开发服务器"
echo "  2. 访问前端页面进行登录测试"
echo "  3. 及时修改默认用户密码"
echo ""