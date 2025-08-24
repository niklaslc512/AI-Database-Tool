#!/bin/bash

# AI数据库管理系统开发环境启动脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Node.js版本
check_node_version() {
    log_info "检查Node.js版本..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js未安装，请先安装Node.js 22+"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 22 ]; then
        log_error "Node.js版本过低（当前: $(node -v)），需要v22.0.0或更高版本"
        exit 1
    fi
    
    log_success "Node.js版本检查通过: $(node -v)"
}

# 检查npm版本
check_npm_version() {
    log_info "检查npm版本..."
    
    if ! command -v npm &> /dev/null; then
        log_error "npm未安装"
        exit 1
    fi
    
    NPM_VERSION=$(npm -v | cut -d'.' -f1)
    if [ "$NPM_VERSION" -lt 10 ]; then
        log_error "npm版本过低（当前: $(npm -v)），需要v10.0.0或更高版本"
        exit 1
    fi
    
    log_success "npm版本检查通过: $(npm -v)"
}

# 创建必要的目录
create_directories() {
    log_info "创建必要的目录..."
    
    mkdir -p backend/data
    mkdir -p backend/logs
    mkdir -p backend/uploads
    mkdir -p frontend/dist
    
    log_success "目录创建完成"
}

# 复制环境变量文件
setup_env_files() {
    log_info "设置环境变量文件..."
    
    # 后端环境变量
    if [ ! -f "backend/.env" ]; then
        if [ -f "backend/.env.example" ]; then
            cp backend/.env.example backend/.env
            log_success "已创建后端.env文件，请根据需要修改配置"
        else
            log_warning "未找到backend/.env.example文件"
        fi
    else
        log_info "后端.env文件已存在"
    fi
    
    # 前端环境变量
    if [ ! -f "frontend/.env" ]; then
        if [ -f "frontend/.env.example" ]; then
            cp frontend/.env.example frontend/.env
            log_success "已创建前端.env文件，请根据需要修改配置"
        else
            log_warning "未找到frontend/.env.example文件"
        fi
    else
        log_info "前端.env文件已存在"
    fi
}

# 安装后端依赖
install_backend_deps() {
    log_info "安装后端依赖..."
    
    cd backend
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    cd ..
    log_success "后端依赖安装完成"
}

# 安装前端依赖
install_frontend_deps() {
    log_info "安装前端依赖..."
    
    cd frontend
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    cd ..
    log_success "前端依赖安装完成"
}

# 构建后端
build_backend() {
    log_info "构建后端..."
    
    cd backend
    npm run build
    cd ..
    
    log_success "后端构建完成"
}

# 启动开发服务器
start_dev_servers() {
    log_info "启动开发服务器..."
    
    # 启动后端开发服务器（后台运行）
    log_info "启动后端开发服务器..."
    cd backend
    npm run dev &
    BACKEND_PID=$!
    cd ..
    
    # 等待后端启动
    sleep 3
    
    # 启动前端开发服务器（后台运行）
    log_info "启动前端开发服务器..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    # 等待服务器启动
    sleep 5
    
    log_success "开发服务器启动完成！"
    log_info "后端服务: http://localhost:3000"
    log_info "前端服务: http://localhost:5173"
    log_info ""
    log_info "按 Ctrl+C 停止所有服务"
    
    # 等待用户中断
    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
    wait
}

# 检查服务状态
check_services() {
    log_info "检查服务状态..."
    
    # 检查后端服务
    if curl -s http://localhost:3000/health > /dev/null; then
        log_success "后端服务运行正常"
    else
        log_warning "后端服务可能未启动或有问题"
    fi
    
    # 检查前端服务
    if curl -s http://localhost:5173 > /dev/null; then
        log_success "前端服务运行正常"
    else
        log_warning "前端服务可能未启动或有问题"
    fi
}

# 主函数
main() {
    echo "======================================="
    echo "  AI数据库管理系统 - 开发环境启动"
    echo "======================================="
    echo ""
    
    case "$1" in
        "install")
            check_node_version
            check_npm_version
            create_directories
            setup_env_files
            install_backend_deps
            install_frontend_deps
            log_success "项目初始化完成！运行 './dev.sh start' 启动开发服务器"
            ;;
        "start")
            check_node_version
            check_npm_version
            start_dev_servers
            ;;
        "build")
            check_node_version
            check_npm_version
            build_backend
            log_success "项目构建完成"
            ;;
        "check")
            check_services
            ;;
        "clean")
            log_info "清理项目..."
            rm -rf backend/node_modules frontend/node_modules
            rm -rf backend/dist frontend/dist
            rm -rf backend/logs/*
            log_success "项目清理完成"
            ;;
        *)
            echo "用法: $0 {install|start|build|check|clean}"
            echo ""
            echo "命令说明:"
            echo "  install  - 初始化项目，安装依赖"
            echo "  start    - 启动开发服务器"
            echo "  build    - 构建项目"
            echo "  check    - 检查服务状态"
            echo "  clean    - 清理项目文件"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"