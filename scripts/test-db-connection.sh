#!/bin/bash
# 本地数据库连接测试脚本
# 在生产服务器上运行此脚本来测试数据库连通性

echo "🔍 Testing database connectivity..."
echo ""

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set"
  echo "Please set DATABASE_URL in your environment"
  exit 1
fi

echo "✅ DATABASE_URL found"
echo ""

# 解析数据库连接信息（安全显示，不显示密码）
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')

echo "Database connection details:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# 测试端口连通性
echo "Testing TCP connection to $DB_HOST:$DB_PORT..."
if timeout 10 nc -zv $DB_HOST $DB_PORT 2>&1; then
  echo "✅ Port is reachable"
else
  echo "❌ Port connection failed or timeout"
  echo ""
  echo "Possible issues:"
  echo "  1. Database server is not running"
  echo "  2. Firewall blocking the port"
  echo "  3. Wrong host/port in DATABASE_URL"
  echo "  4. Database server DNS resolution failed"
  exit 1
fi

echo ""

# 测试 PostgreSQL 连接（需要 pg_isready）
echo "Testing PostgreSQL connection..."
if command -v pg_isready &> /dev/null; then
  pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t 10
  if [ $? -eq 0 ]; then
    echo "✅ PostgreSQL is accepting connections"
  else
    echo "❌ PostgreSQL not ready or authentication failed"
  fi
else
  echo "⚠️  pg_isready not available, skipping PostgreSQL check"
fi

echo ""
echo "Testing actual connection with psql..."
if command -v psql &> /dev/null; then
  timeout 10 psql $DATABASE_URL -c "SELECT version();" 2>&1
  if [ $? -eq 0 ]; then
    echo "✅ Successfully connected to PostgreSQL"
  else
    echo "❌ Connection failed"
    exit 1
  fi
else
  echo "⚠️  psql not available, skipping connection test"
fi

echo ""
echo "✅ All connectivity tests passed"
echo "Database should be reachable from this server"