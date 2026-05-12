#!/bin/bash

# Docker 开发环境快速启动脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# 检查 Docker 是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi

    print_success "Docker 已安装"
}

# 检查 .env 文件
check_env_file() {
    if [ ! -f .env ]; then
        print_warning ".env 文件不存在"

        # 检查是否有示例文件
        if [ -f .env.example ]; then
            print_info "从 .env.example 创建 .env 文件"
            cp .env.example .env
            print_warning "请编辑 .env 文件，配置必要的环境变量（特别是 DATABASE_URL）"
            print_info "编辑后重新运行此脚本"
            exit 1
        else
            print_error "请创建 .env 文件并配置环境变量"
            exit 1
        fi
    fi

    # 检查必需的环境变量
    source .env
    if [ -z "$DATABASE_URL" ]; then
        print_warning "DATABASE_URL 未设置"
        print_info "请在 .env 文件中设置 DATABASE_URL"
        exit 1
    fi

    print_success "环境变量已配置"
}

# 检查数据库连接
check_database() {
    print_info "检查数据库连接..."

    # 从 DATABASE_URL 提取主机和端口
    if [[ $DATABASE_URL =~ @([^:]+):([0-9]+) ]]; then
        DB_HOST="${BASH_REMATCH[1]}"
        DB_PORT="${BASH_REMATCH[2]}"

        # 检查端口是否开放
        if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
            print_success "数据库连接正常 ($DB_HOST:$DB_PORT)"
        else
            print_warning "无法连接到数据库 ($DB_HOST:$DB_PORT)"
            print_info "请确保数据库正在运行"
        fi
    else
        print_warning "无法解析 DATABASE_URL"
    fi
}

# 停止现有容器
stop_existing_containers() {
    print_info "停止现有容器..."
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
    print_success "现有容器已停止"
}

# 构建镜像
build_images() {
    print_info "构建 Docker 镜像..."
    docker-compose -f docker-compose.dev.yml build
    print_success "镜像构建完成"
}

# 启动服务
start_services() {
    print_info "启动服务..."

    # 检查是否在后台运行
    if [ "$1" == "--detach" ] || [ "$1" == "-d" ]; then
        docker-compose -f docker-compose.dev.yml up -d
        print_success "服务已在后台启动"
    else
        docker-compose -f docker-compose.dev.yml up
    fi
}

# 显示服务信息
show_service_info() {
    echo ""
    echo "=================================="
    echo "  服务已启动"
    echo "=================================="
    echo ""
    echo "后端 API:"
    echo "  - tRPC:     http://localhost:3000/trpc"
    echo "  - REST API: http://localhost:3000/api"
    echo "  - Swagger:  http://localhost:3000/api/docs"
    echo ""
    echo "前端 Admin:"
    echo "  - 地址:     http://localhost:5173"
    echo ""
    echo "常用命令:"
    echo "  - 查看日志: docker-compose -f docker-compose.dev.yml logs -f"
    echo "  - 停止服务: docker-compose -f docker-compose.dev.yml down"
    echo "  - 重新构建: docker-compose -f docker-compose.dev.yml build"
    echo ""
    echo "详细文档: docs/deploy/DOCKER_DEV.md"
    echo ""
}

# 主函数
main() {
    echo ""
    echo "=================================="
    echo "  Docker 开发环境启动脚本"
    echo "=================================="
    echo ""

    # 检查 Docker
    check_docker

    # 检查 .env 文件
    check_env_file

    # 检查数据库连接
    check_database

    # 询问是否重新构建
    echo ""
    read -p "是否重新构建镜像？(y/N): " rebuild
    if [[ $rebuild =~ ^[Yy]$ ]]; then
        stop_existing_containers
        build_images
    fi

    # 启动服务
    echo ""
    read -p "在后台运行？(Y/n): " detach
    if [[ $detach =~ ^[Nn]$ ]]; then
        start_services --foreground
    else
        start_services --detach
        show_service_info
    fi
}

# 运行主函数
main "$@"
