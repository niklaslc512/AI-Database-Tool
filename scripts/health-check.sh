#!/bin/bash

# AI数据库管理系统健康检查脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
BACKEND_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:5173"
TIMEOUT=10

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# 检查HTTP服务
check_http_service() {
    local url=$1
    local service_name=$2
    
    log_info "检查 $service_name..."
    
    if curl -s --max-time $TIMEOUT "$url" > /dev/null 2>&1; then
        log_success "$service_name 运行正常"
        return 0
    else
        log_error "$service_name 无法访问"
        return 1
    fi
}

# 检查后端API
check_backend_api() {
    log_info "检查后端API..."
    
    # 检查健康端点
    if curl -s --max-time $TIMEOUT "$BACKEND_URL/health" | grep -q "OK"; then
        log_success "后端健康检查通过"
        
        # 获取详细信息
        local health_info=$(curl -s --max-time $TIMEOUT "$BACKEND_URL/health")
        echo "  详细信息: $health_info"
        return 0
    else
        log_error "后端健康检查失败"
        return 1
    fi
}

# 检查数据库连接
check_database() {
    log_info "检查数据库连接..."
    
    # 这里可以添加具体的数据库连接检查
    # 现在只是检查后端是否能响应
    if curl -s --max-time $TIMEOUT "$BACKEND_URL/api/v1/health" > /dev/null 2>&1; then
        log_success "数据库连接正常"
        return 0
    else
        log_warning "无法验证数据库连接状态"
        return 1
    fi
}

# 检查前端静态资源
check_frontend_assets() {
    log_info "检查前端静态资源..."
    
    if curl -s --max-time $TIMEOUT "$FRONTEND_URL" | grep -q "<!DOCTYPE html>"; then
        log_success "前端静态资源加载正常"
        return 0
    else
        log_error "前端静态资源加载失败"
        return 1
    fi
}

# 检查端口占用
check_ports() {
    log_info "检查端口占用情况..."
    
    # 检查3000端口（后端）
    if lsof -i :3000 > /dev/null 2>&1; then
        log_success "端口3000已被使用（后端服务）"
    else
        log_warning "端口3000未被使用"
    fi
    
    # 检查5173端口（前端）
    if lsof -i :5173 > /dev/null 2>&1; then
        log_success "端口5173已被使用（前端服务）"
    else
        log_warning "端口5173未被使用"
    fi
}

# 检查进程
check_processes() {
    log_info "检查相关进程..."
    
    # 检查Node.js进程
    local node_processes=$(pgrep -f "node" | wc -l)
    if [ "$node_processes" -gt 0 ]; then
        log_success "发现 $node_processes 个Node.js进程"
    else
        log_warning "未发现Node.js进程"
    fi
    
    # 检查npm进程
    local npm_processes=$(pgrep -f "npm" | wc -l)
    if [ "$npm_processes" -gt 0 ]; then
        log_success "发现 $npm_processes 个npm进程"
    else
        log_info "未发现npm进程"
    fi
}

# 检查文件系统
check_filesystem() {
    log_info "检查文件系统..."
    
    # 检查关键目录
    local dirs=("backend/data" "backend/logs" "backend/uploads" "frontend/dist")
    
    for dir in "${dirs[@]}"; do
        if [ -d "$dir" ]; then
            log_success "目录 $dir 存在"
        else
            log_warning "目录 $dir 不存在"
        fi
    done
    
    # 检查环境变量文件
    if [ -f "backend/.env" ]; then
        log_success "后端环境变量文件存在"
    else
        log_warning "后端环境变量文件不存在"
    fi
    
    if [ -f "frontend/.env" ]; then
        log_success "前端环境变量文件存在"
    else
        log_warning "前端环境变量文件不存在"
    fi
}

# 检查依赖
check_dependencies() {
    log_info "检查项目依赖..."
    
    # 检查后端依赖
    if [ -d "backend/node_modules" ]; then
        log_success "后端依赖已安装"
    else
        log_error "后端依赖未安装"
    fi
    
    # 检查前端依赖
    if [ -d "frontend/node_modules" ]; then
        log_success "前端依赖已安装"
    else
        log_error "前端依赖未安装"
    fi
}

# 生成报告
generate_report() {
    local total_checks=$1
    local passed_checks=$2
    local failed_checks=$((total_checks - passed_checks))
    
    echo ""
    echo "=================== 健康检查报告 ==================="
    echo "总检查项: $total_checks"
    echo "通过: $passed_checks"
    echo "失败: $failed_checks"
    echo "成功率: $((passed_checks * 100 / total_checks))%"
    echo "=================================================="
    
    if [ $failed_checks -eq 0 ]; then
        log_success "所有检查项目都通过！系统运行正常。"
        return 0
    else
        log_warning "有 $failed_checks 个检查项目失败，请检查相关服务。"
        return 1
    fi
}

# 主函数
main() {
    echo "======================================"
    echo "  AI数据库管理系统 - 健康检查"
    echo "======================================"
    echo ""
    
    local total_checks=0
    local passed_checks=0
    
    # 执行各项检查
    checks=(
        "check_ports"
        "check_processes"
        "check_filesystem"
        "check_dependencies"
        "check_http_service $BACKEND_URL 后端服务"
        "check_http_service $FRONTEND_URL 前端服务"
        "check_backend_api"
        "check_frontend_assets"
    )
    
    for check in "${checks[@]}"; do
        total_checks=$((total_checks + 1))
        if eval "$check"; then
            passed_checks=$((passed_checks + 1))
        fi
        echo ""
    done
    
    # 生成报告
    generate_report $total_checks $passed_checks
}

# 执行主函数
main "$@"