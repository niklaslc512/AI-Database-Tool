#!/bin/bash

# 生产环境部署前检查脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 检查Docker环境
check_docker() {
    log_info "检查Docker环境..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装"
        return 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装"
        return 1
    fi
    
    # 检查Docker服务状态
    if ! docker info &> /dev/null; then
        log_error "Docker服务未运行"
        return 1
    fi
    
    log_success "Docker环境检查通过"
    echo "  Docker版本: $(docker --version)"
    echo "  Docker Compose版本: $(docker-compose --version)"
    return 0
}

# 检查环境变量
check_environment_variables() {
    log_info "检查生产环境变量..."
    
    local required_vars=(
        "JWT_SECRET"
        "OPENAI_API_KEY"
        "NODE_ENV"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_error "缺少必要的环境变量: ${missing_vars[*]}"
        log_info "请在.env文件中设置这些变量或通过环境变量传递"
        return 1
    fi
    
    # 检查NODE_ENV是否为production
    if [ "$NODE_ENV" != "production" ]; then
        log_warning "NODE_ENV不是production (当前: $NODE_ENV)"
    fi
    
    log_success "环境变量检查通过"
    return 0
}

# 检查配置文件
check_config_files() {
    log_info "检查配置文件..."
    
    local required_files=(
        "docker-compose.yml"
        "docker/backend/Dockerfile"
        "docker/frontend/Dockerfile"
        "docker/nginx/nginx.conf"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "缺少配置文件: $file"
            return 1
        fi
    done
    
    log_success "配置文件检查通过"
    return 0
}

# 检查代码质量
check_code_quality() {
    log_info "检查代码质量..."
    
    # 检查后端代码
    log_info "检查后端TypeScript代码..."
    cd backend
    
    if [ -f "package.json" ]; then
        # 运行TypeScript编译检查
        if npm run build &> /dev/null; then
            log_success "后端代码编译通过"
        else
            log_error "后端代码编译失败"
            cd ..
            return 1
        fi
        
        # 运行ESLint检查
        if npm run lint &> /dev/null; then
            log_success "后端代码规范检查通过"
        else
            log_warning "后端代码存在规范问题，建议修复"
        fi
    fi
    
    cd ..
    
    # 检查前端代码
    log_info "检查前端Vue代码..."
    cd frontend
    
    if [ -f "package.json" ]; then
        # 运行TypeScript检查
        if npm run type-check &> /dev/null; then
            log_success "前端类型检查通过"
        else
            log_warning "前端存在类型错误"
        fi
        
        # 运行ESLint检查
        if npm run lint &> /dev/null; then
            log_success "前端代码规范检查通过"
        else
            log_warning "前端代码存在规范问题，建议修复"
        fi
    fi
    
    cd ..
    return 0
}

# 检查安全配置
check_security() {
    log_info "检查安全配置..."
    
    local issues=0
    
    # 检查JWT密钥强度
    if [ ${#JWT_SECRET} -lt 32 ]; then
        log_warning "JWT_SECRET长度过短，建议至少32个字符"
        issues=$((issues + 1))
    fi
    
    # 检查是否使用默认密码
    if [[ "$JWT_SECRET" == *"your-super-secret"* ]]; then
        log_error "使用了默认的JWT_SECRET，必须修改"
        issues=$((issues + 1))
    fi
    
    # 检查HTTPS配置
    if [ ! -f "docker/nginx/ssl.conf" ]; then
        log_warning "未配置HTTPS，生产环境建议启用"
        issues=$((issues + 1))
    fi
    
    if [ $issues -eq 0 ]; then
        log_success "安全配置检查通过"
        return 0
    else
        log_warning "发现 $issues 个安全配置问题"
        return 1
    fi
}

# 检查资源配置
check_resources() {
    log_info "检查系统资源..."
    
    # 检查磁盘空间
    local available_space=$(df -h . | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "${available_space%.*}" -lt 5 ]; then
        log_warning "可用磁盘空间不足5GB"
    else
        log_success "磁盘空间充足"
    fi
    
    # 检查内存
    local available_memory=$(free -m | awk 'NR==2{printf "%.0f", $7/1024}')
    if [ "$available_memory" -lt 2 ]; then
        log_warning "可用内存不足2GB"
    else
        log_success "内存充足"
    fi
    
    return 0
}

# 测试Docker构建
test_docker_build() {
    log_info "测试Docker镜像构建..."
    
    # 测试后端镜像构建
    log_info "测试后端镜像构建..."
    if docker build -f docker/backend/Dockerfile -t ai-database-backend:test . &> /dev/null; then
        log_success "后端镜像构建成功"
        docker rmi ai-database-backend:test &> /dev/null
    else
        log_error "后端镜像构建失败"
        return 1
    fi
    
    # 测试前端镜像构建
    log_info "测试前端镜像构建..."
    if docker build -f docker/frontend/Dockerfile -t ai-database-frontend:test ./frontend &> /dev/null; then
        log_success "前端镜像构建成功"
        docker rmi ai-database-frontend:test &> /dev/null
    else
        log_error "前端镜像构建失败"
        return 1
    fi
    
    return 0
}

# 生成部署报告
generate_deployment_report() {
    local total_checks=$1
    local passed_checks=$2
    local warnings=$3
    
    echo ""
    echo "================= 部署检查报告 =================="
    echo "检查项目: $total_checks"
    echo "通过: $passed_checks"
    echo "警告: $warnings"
    echo "失败: $((total_checks - passed_checks))"
    echo "=============================================="
    
    if [ $((total_checks - passed_checks)) -eq 0 ]; then
        log_success "所有检查项目都通过！可以进行生产部署。"
        echo ""
        echo "部署命令:"
        echo "  docker-compose up -d"
        echo ""
        echo "部署后验证:"
        echo "  ./health-check.sh"
        return 0
    else
        log_error "存在检查失败项，请修复后再部署。"
        return 1
    fi
}

# 主函数
main() {
    echo "========================================="
    echo "  AI数据库管理系统 - 生产环境检查"
    echo "========================================="
    echo ""
    
    # 加载环境变量
    if [ -f ".env" ]; then
        source .env
        log_info "已加载.env文件"
    else
        log_warning ".env文件不存在"
    fi
    
    local total_checks=0
    local passed_checks=0
    local warnings=0
    
    # 执行检查
    checks=(
        "check_docker"
        "check_config_files"
        "check_environment_variables"
        "check_code_quality"
        "check_security"
        "check_resources"
        "test_docker_build"
    )
    
    for check in "${checks[@]}"; do
        total_checks=$((total_checks + 1))
        echo ""
        if $check; then
            passed_checks=$((passed_checks + 1))
        fi
    done
    
    # 生成报告
    generate_deployment_report $total_checks $passed_checks $warnings
}

# 执行主函数
main "$@"