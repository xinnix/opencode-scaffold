#!/bin/bash

# Docker 构建和测试脚本
# 用于验证 Dockerfile.api 的改进

set -e

echo "🔧 开始构建和测试 Docker 镜像..."

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. 清理旧镜像
echo -e "\n${YELLOW}📦 清理旧镜像...${NC}"
docker rmi xinnix2000/feedbackhub-api:v1-local 2>/dev/null || echo "没有旧镜像需要清理"

# 2. 构建新镜像
echo -e "\n${YELLOW}🏗️  构建 API 镜像...${NC}"
if docker-compose -f docker-compose.local.yml build api; then
    echo -e "${GREEN}✅ 镜像构建成功！${NC}"
else
    echo -e "${RED}❌ 镜像构建失败！${NC}"
    exit 1
fi

# 3. 检查镜像大小
echo -e "\n${YELLOW}📊 镜像信息：${NC}"
docker images xinnix2000/feedbackhub-api:v1-local

# 4. 验证镜像内容
echo -e "\n${YELLOW}🔍 验证镜像内容...${NC}"
echo "检查 node_modules 结构..."
docker run --rm xinnix2000/feedbackhub-api:v1-local ls -la node_modules/@opencode/ 2>/dev/null || echo "警告：无法检查 node_modules"

echo "检查 dist 目录..."
docker run --rm xinnix2000/feedbackhub-api:v1-local ls -la dist/ | head -10

echo "检查 shared 包..."
docker run --rm xinnix2000/feedbackhub-api:v1-local ls -la infra/shared/dist/ 2>/dev/null || echo "警告：shared 包可能不存在"

# 5. 询问是否启动容器
echo -e "\n${YELLOW}❓ 是否要启动容器进行测试？${NC}"
read -p "输入 'y' 启动，其他键跳过: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}🚀 启动容器...${NC}"
    docker-compose -f docker-compose.local.yml up api
fi

echo -e "\n${GREEN}✨ 测试完成！${NC}"
