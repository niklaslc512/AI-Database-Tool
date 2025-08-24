#!/bin/bash

# AI数据库管理系统 Docker 部署脚本

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

# 检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        log_info "项目要求: Node.js 22+ 和 Express 5"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi

    log_success "Docker 环境检查通过"
}

# 检查环境变量文件
check_env() {
    if [ ! -f ".env" ]; then
        log_warning ".env 文件不存在，从 .env.example 创建"
        if [ -f "backend/.env.example" ]; then
            cp backend/.env.example .env
            log_info "请编辑 .env 文件配置必要的环境变量"
        else
            log_error "未找到 .env.example 文件"
            exit 1
        fi
    fi
    log_success "环境变量文件检查通过"
}

# 创建必要的目录
create_directories() {
    log_info "创建必要的目录..."
    mkdir -p data logs uploads
    chmod 755 data logs uploads
    log_success "目录创建完成"
}

# 构建镜像
build_images() {
    log_info "开始构建 Docker 镜像..."
    
    # 构建后端镜像
    log_info "构建后端镜像..."
    docker build -f docker/backend/Dockerfile -t ai-database-backend:latest .
    
    # 构建前端镜像
    log_info "构建前端镜像..."
    docker build -f docker/frontend/Dockerfile -t ai-database-frontend:latest ./frontend
    
    log_success "Docker 镜像构建完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    if [ "$1" = "dev" ]; then
        docker-compose -f docker-compose.dev.yml up -d
        log_success "开发环境启动完成"
        log_info "前端访问地址: http://localhost:3000"
        log_info "后端API地址: http://localhost:3001"
    else
        docker-compose up -d
        log_success "生产环境启动完成"
        log_info "访问地址: http://localhost"
    fi
}

# 停止服务
stop_services() {
    log_info "停止服务..."
    
    if [ "$1" = "dev" ]; then
        docker-compose -f docker-compose.dev.yml down
    else
        docker-compose down
    fi
    
    log_success "服务已停止"
}

# 重启服务
restart_services() {
    log_info "重启服务..."
    stop_services $1
    start_services $1
}

# 查看日志
view_logs() {
    if [ "$1" = "dev" ]; then
        docker-compose -f docker-compose.dev.yml logs -f
    else
        docker-compose logs -f
    fi
}

# 清理
cleanup() {
    log_info "清理 Docker 资源..."
    
    # 停止并删除容器
    docker-compose down --remove-orphans
    docker-compose -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true
    
    # 删除镜像
    docker rmi ai-database-backend:latest 2>/dev/null || true
    docker rmi ai-database-frontend:latest 2>/dev/null || true
    
    # 清理未使用的资源
    docker system prune -f
    
    log_success "清理完成"
}

# 显示状态
show_status() {
    log_info "服务状态:"
    docker-compose ps
}

# 显示帮助信息
show_help() {
    echo "AI数据库管理系统 Docker 部署脚本"
    echo ""
    echo "用法: ./deploy.sh [命令] [选项]"
    echo ""
    echo "命令:"
    echo "  build          构建 Docker 镜像"
    echo "  start [dev]    启动服务 (dev: 开发模式)"
    echo "  stop [dev]     停止服务"
    echo "  restart [dev]  重启服务"
    echo "  logs [dev]     查看日志"
    echo "  status         显示服务状态"
    echo "  cleanup        清理 Docker 资源"
    echo "  help           显示帮助信息"
    echo ""
    echo "示例:"
    echo "  ./deploy.sh build          # 构建镜像"
    echo "  ./deploy.sh start          # 启动生产环境"
    echo "  ./deploy.sh start dev      # 启动开发环境"
    echo "  ./deploy.sh logs dev       # 查看开发环境日志"
}

# 主函数
main() {
    case "$1" in
        "build")
            check_docker
            build_images
            ;;
        "start")
            check_docker
            check_env
            create_directories
            start_services $2
            ;;
        "stop")
            stop_services $2
            ;;
        "restart")
            check_docker
            restart_services $2
            ;;
        "logs")
            view_logs $2
            ;;
        "status")
            show_status
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|"-h"|"--help"|"")
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"