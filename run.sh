#!/bin/bash

# AI数据库管理系统 - 主入口脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 脚本路径
SCRIPT_DIR="scripts"

# 显示Logo
show_logo() {
    echo -e "${CYAN}"
    echo "    ___    ____   ____        __        __                   "
    echo "   /   |  /  _/  / __ \____ _/ /_____ _/ /_  ____ __________ "
    echo "  / /| |  / /   / / / / __ \`/ __/ __ \`/ __ \/ __ \`/ ___/ _ \\"
    echo " / ___ |_/ /   / /_/ / /_/ / /_/ /_/ / /_/ / /_/ (__  )  __/"
    echo "/_/  |_/___/  /_____/\__,_/\__/\__,_/_.___/\__,_/____/\___/ "
    echo ""
    echo "        AI驱动的数据库管理系统 - 开发工具套件"
    echo -e "${NC}"
}

# 显示主菜单
show_menu() {
    echo -e "${BLUE}==================== 主菜单 ====================${NC}"
    echo ""
    echo -e "${GREEN}开发环境:${NC}"
    echo "  1) install     - 初始化项目，安装依赖"
    echo "  2) start       - 启动开发服务器"
    echo "  3) build       - 构建项目"
    echo "  4) clean       - 清理项目文件"
    echo ""
    echo -e "${GREEN}系统监控:${NC}"
    echo "  5) health      - 系统健康检查"
    echo "  6) status      - 服务状态检查"
    echo ""
    echo -e "${GREEN}部署相关:${NC}"
    echo "  7) prod-check  - 生产环境检查"
    echo "  8) docker      - Docker相关操作"
    echo ""
    echo -e "${GREEN}工具:${NC}"
    echo "  9) help        - 显示帮助信息"
    echo " 10) scripts     - 显示所有可用脚本"
    echo ""
    echo -e "${GREEN}其他:${NC}"
    echo "  0) exit        - 退出"
    echo ""
    echo -e "${BLUE}=================================================${NC}"
}

# 显示Docker子菜单
show_docker_menu() {
    echo -e "${BLUE}================== Docker操作 ==================${NC}"
    echo ""
    echo "  1) build       - 构建Docker镜像"
    echo "  2) start       - 启动Docker服务"
    echo "  3) stop        - 停止Docker服务"
    echo "  4) restart     - 重启Docker服务"
    echo "  5) logs        - 查看Docker日志"
    echo "  6) status      - Docker服务状态"
    echo "  0) back        - 返回主菜单"
    echo ""
    echo -e "${BLUE}=================================================${NC}"
}

# 执行开发脚本
run_dev_script() {
    local command=$1
    local script_path=""
    
    # 检测操作系统
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        script_path="$SCRIPT_DIR/dev.bat"
        cmd //c "$script_path $command"
    else
        script_path="$SCRIPT_DIR/dev.sh"
        if [ ! -x "$script_path" ]; then
            chmod +x "$script_path"
        fi
        "$script_path" "$command"
    fi
}

# 执行健康检查
run_health_check() {
    local script_path="$SCRIPT_DIR/health-check.sh"
    
    if [ ! -x "$script_path" ]; then
        chmod +x "$script_path"
    fi
    
    "$script_path"
}

# 执行生产环境检查
run_production_check() {
    local script_path="$SCRIPT_DIR/production-check.sh"
    
    if [ ! -x "$script_path" ]; then
        chmod +x "$script_path"
    fi
    
    "$script_path"
}

# Docker操作
handle_docker() {
    while true; do
        show_docker_menu
        echo -n "请选择操作 (0-6): "
        read -r docker_choice
        
        case $docker_choice in
            1)
                echo -e "${YELLOW}构建Docker镜像...${NC}"
                docker/deploy.sh build
                ;;
            2)
                echo -e "${YELLOW}启动Docker服务...${NC}"
                docker/deploy.sh start
                ;;
            3)
                echo -e "${YELLOW}停止Docker服务...${NC}"
                docker/deploy.sh stop
                ;;
            4)
                echo -e "${YELLOW}重启Docker服务...${NC}"
                docker/deploy.sh restart
                ;;
            5)
                echo -e "${YELLOW}查看Docker日志...${NC}"
                docker/deploy.sh logs
                ;;
            6)
                echo -e "${YELLOW}检查Docker服务状态...${NC}"
                docker/deploy.sh status
                ;;
            0)
                break
                ;;
            *)
                echo -e "${RED}无效选择，请重新输入${NC}"
                ;;
        esac
        
        echo ""
        echo -e "${CYAN}按Enter键继续...${NC}"
        read
    done
}

# 显示帮助信息
show_help() {
    echo -e "${GREEN}AI数据库管理系统 - 帮助信息${NC}"
    echo ""
    echo "这是一个AI驱动的数据库管理系统开发工具套件。"
    echo ""
    echo -e "${YELLOW}主要功能:${NC}"
    echo "• 支持多种数据库: MySQL, PostgreSQL, SQLite, MongoDB"
    echo "• AI驱动的自然语言查询"
    echo "• 统一的数据库管理界面"
    echo "• Docker容器化部署"
    echo "• 完整的开发工具链"
    echo ""
    echo -e "${YELLOW}技术栈:${NC}"
    echo "• 后端: Express 5 + TypeScript + Node.js 22"
    echo "• 前端: Vue 3 + Vite + TailwindCSS 4"
    echo "• 数据库: SQLite (系统数据)"
    echo "• 部署: Docker + Docker Compose"
    echo ""
    echo -e "${YELLOW}快速开始:${NC}"
    echo "1. 选择 'install' 初始化项目"
    echo "2. 选择 'start' 启动开发服务器"
    echo "3. 访问 http://localhost:3000"
    echo ""
    echo "详细文档请查看: $SCRIPT_DIR/README.md"
}

# 显示所有可用脚本
show_scripts() {
    echo -e "${GREEN}可用脚本列表:${NC}"
    echo ""
    
    if [ -d "$SCRIPT_DIR" ]; then
        for script in "$SCRIPT_DIR"/*; do
            if [ -f "$script" ]; then
                local filename=$(basename "$script")
                local extension="${filename##*.}"
                
                case $extension in
                    "sh")
                        echo -e "${CYAN}📄 $filename${NC} - Shell脚本 (Linux/macOS)"
                        ;;
                    "bat")
                        echo -e "${CYAN}📄 $filename${NC} - 批处理脚本 (Windows)"
                        ;;
                    "md")
                        echo -e "${CYAN}📚 $filename${NC} - 文档文件"
                        ;;
                    *)
                        echo -e "${CYAN}📄 $filename${NC} - 其他文件"
                        ;;
                esac
            fi
        done
    else
        echo -e "${RED}scripts目录不存在${NC}"
    fi
    
    echo ""
    echo "详细使用说明请查看: $SCRIPT_DIR/README.md"
}

# 主循环
main() {
    # 检查是否在项目根目录
    if [ ! -f "package.json" ] && [ ! -f "README.md" ]; then
        echo -e "${RED}错误: 请在项目根目录下运行此脚本${NC}"
        exit 1
    fi
    
    show_logo
    
    while true; do
        show_menu
        echo -n "请选择操作 (0-10): "
        read -r choice
        
        case $choice in
            1)
                echo -e "${YELLOW}初始化项目...${NC}"
                run_dev_script "install"
                ;;
            2)
                echo -e "${YELLOW}启动开发服务器...${NC}"
                run_dev_script "start"
                ;;
            3)
                echo -e "${YELLOW}构建项目...${NC}"
                run_dev_script "build"
                ;;
            4)
                echo -e "${YELLOW}清理项目...${NC}"
                run_dev_script "clean"
                ;;
            5)
                echo -e "${YELLOW}执行健康检查...${NC}"
                run_health_check
                ;;
            6)
                echo -e "${YELLOW}检查服务状态...${NC}"
                run_dev_script "check"
                ;;
            7)
                echo -e "${YELLOW}生产环境检查...${NC}"
                run_production_check
                ;;
            8)
                handle_docker
                ;;
            9)
                show_help
                ;;
            10)
                show_scripts
                ;;
            0)
                echo -e "${GREEN}感谢使用AI数据库管理系统！${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}无效选择，请重新输入 (0-10)${NC}"
                ;;
        esac
        
        echo ""
        echo -e "${CYAN}按Enter键继续...${NC}"
        read
    done
}

# 如果直接运行脚本，显示交互菜单
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi