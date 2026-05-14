# 生产环境部署排查指南

## 🔍 问题现象

从日志分析，启动脚本卡在数据库迁移步骤，长时间等待后才启动：

```
🚀 Starting Production Environment...
📡 Running Database Migrations...
✅ Created .env file with DATABASE_URL
⚠️  Could not find Prisma CLI, falling back to npx...
Loaded Prisma config from prisma.config.ts.
Terminated
⚠️  Migration failed or timeout, continuing...
✅ Cleaned up .env file
[等待很长时间后启动]
```

**根本原因：**

- Prisma CLI 不在预期位置，fallback 到 npx
- npx 需要解析包路径，耗时 5-30 秒
- 数据库连接慢或首次迁移耗时长

## ✅ 已完成的优化

### 1. Dockerfile.api 改进

**修复点：**

- ✅ 拷贝完整的 Prisma CLI 到 `/app/node_modules/prisma-standalone`
- ✅ 创建 `node_modules/.bin/prisma` 软链接
- ✅ 使用终极优化启动脚本

**变更：**

```dockerfile
# 新增：拷贝 Prisma CLI 并创建软链接
COPY --from=builder /app/node_modules/.pnpm/prisma@*/node_modules/prisma ./node_modules/prisma-standalone
RUN ln -sf /app/node_modules/prisma-standalone/build/index.js /app/node_modules/.bin/prisma

# 使用终极优化启动脚本
COPY apps/api/entrypoint-final.sh ./entrypoint.sh
```

### 2. 启动脚本优化（entrypoint-final.sh）

**特性：**

- ✅ **数据库连接预检查**（5秒快速失败）
- ✅ **多级 Prisma CLI 查找**（4种方案，从快到慢）：
  1. `node_modules/.bin/prisma`（最快，<1s）
  2. 动态查找 `prisma/build/index.js`（中等，1-3s）
  3. 使用 `prisma-standalone`（保底）
  4. fallback 到 `npx`（最慢，5-30s）
- ✅ **超时机制**：每个方案都有 45-60 秒超时
- ✅ **SKIP_MIGRATION 支持**：可跳过迁移直接启动
- ✅ **详细日志**：每步都有明确状态输出

## 🚀 部署步骤

### 步骤 1：重新构建镜像

```bash
# 在本地或生产服务器上重新构建 API 镜像
docker build -f Dockerfile.api -t couponhub-api:latest .

# 或使用完整路径（如果有 registry）
docker build -f Dockerfile.api -t ${REGISTRY}/couponhub-api:${TAG} .
```

### 步骤 2：更新并重启容器

```bash
# 更新 docker-compose 配置（如果镜像 tag 变化）
docker-compose -f docker-compose.prod.yml --env-file 1panel.env up -d api

# 或强制重建并重启
docker-compose -f docker-compose.prod.yml --env-file 1panel.env up -d --force-recreate api
```

### 步骤 3：查看启动日志

```bash
# 实时查看日志
docker logs -f couponHub-api-prod

# 或查看最近 100 行
docker logs couponHub-api-prod --tail 100
```

**预期输出：**

```
🚀 Starting Production Environment...
✅ DATABASE_URL configured

🔍 Pre-check: Database connectivity...
✅ Database port reachable (your-db-host:5432)

📡 Running Database Migrations...
✅ Method 1: Using node_modules/.bin/prisma (fast)
✅ Migration completed via .bin/prisma

✅ Database migrations completed successfully

🌟 Starting API Server...
   tRPC endpoint: http://localhost:3000/trpc
   REST API: http://localhost:3000/api
   API docs: http://localhost:3000/api/docs

[Nest] LOG Nest application successfully started
✅ PrismaClient connected to database
✅ 微信支付 V3 初始化成功
```

**启动时间预期：**

- 数据库连接预检查：5 秒
- 迁移执行：5-30 秒（取决于迁移数量）
- 服务启动：5 秒
- **总计：15-40 秒**（相比之前的长时间等待）

## 🛠️ 高级配置

### 选项 1：跳过迁移（如果表已存在）

如果你的数据库已经执行过迁移，可以跳过迁移步骤：

```bash
# 在 1panel.env 中添加
SKIP_MIGRATION=true

# 重启容器
docker-compose -f docker-compose.prod.yml restart api
```

**适用场景：**

- 数据库表已存在，仅更新应用代码
- 数据库迁移失败但表结构完整
- 快速重启服务不等待迁移

### 选项 2：手动执行迁移

如果自动迁移有问题，可以手动执行：

```bash
# 进入容器
docker exec -it couponHub-api-prod sh

# 手动执行迁移
cd /app/infra/database
echo "DATABASE_URL=$DATABASE_URL" > .env
npx prisma migrate deploy --schema=prisma/schema.prisma --verbose

# 查看迁移状态
npx prisma migrate status --schema=prisma/schema.prisma

# 或手动执行 SQL（如果 Prisma CLI 完全不可用）
psql $DATABASE_URL -f prisma/migrations/xxx/migration.sql
```

### 选项 3：本地测试数据库连接

在生产服务器上运行测试脚本：

```bash
# 上传测试脚本到服务器
scp scripts/test-db-connection.sh your-server:/tmp/

# 在服务器上执行
bash /tmp/test-db-connection.sh
```

**检查项：**

- ✅ DATABASE_URL 配置正确
- ✅ 数据库端口可达（5秒超时）
- ✅ PostgreSQL 认证成功
- ✅ DNS 解析正常

## 🔧 排查步骤

### 1. 检查容器内 Prisma CLI 位置

```bash
docker exec couponHub-api-prod find /app/node_modules -name "prisma" -type d
docker exec couponHub-api-prod ls -la /app/node_modules/.bin/
```

**预期：**

- `/app/node_modules/.bin/prisma` 软链接存在
- `/app/node_modules/prisma-standalone/` 目录存在

### 2. 检查数据库连接

```bash
# 方法1: 使用 nc 测试端口
docker exec couponHub-api-prod nc -zv your-db-host 5432 -w 5

# 方法2: 使用 psql（如果可用）
docker exec couponHub-api-prod psql "$DATABASE_URL" -c "SELECT version();"

# 方法3: 使用 Prisma CLI
docker exec couponHub-api-prod sh -c "cd /app/infra/database && echo 'DATABASE_URL=$DATABASE_URL' > .env && npx prisma db execute --stdin <<< 'SELECT 1;'"
```

### 3. 查看迁移历史

```bash
# 在数据库中查看迁移记录
psql "$DATABASE_URL" -c "SELECT migration_name, started_at, finished_at, logs FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 10;"
```

### 4. 检查是否有锁定的迁移

```bash
# 查看是否有正在运行或失败的迁移
psql "$DATABASE_URL" -c "SELECT migration_name, logs FROM _prisma_migrations WHERE finished_at IS NULL;"
```

**如果有失败的迁移，手动清理：**

```bash
psql "$DATABASE_URL" -c "DELETE FROM _prisma_migrations WHERE finished_at IS NULL;"
```

## 📊 性能对比

### 之前（使用旧脚本）

- 启动时间：**60-120+ 秒**（npx 慢 + 无超时）
- 可能卡住不启动
- 无诊断信息

### 现在（使用终极优化脚本）

- 数据库预检查：**5 秒**（快速失败）
- Prisma CLI 查找：**1 秒**（使用 .bin/prisma）
- 迁移执行：**5-30 秒**（有超时）
- 服务启动：**5 秒**
- **总计：15-40 秒**

## 💡 最佳实践

### 1. 预热数据库连接

确保数据库连接池已建立，避免首次连接慢：

```typescript
// 在 main.ts 中增加启动预热
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 预热数据库连接
  const prisma = app.get(PrismaService);
  await prisma.$connect();
  console.log('✅ Database connection warmed up');

  await app.listen(3000);
}
```

### 2. 分离迁移和启动

如果迁移耗时很长，可以分离执行：

```bash
# 单独运行迁移容器（一次性任务）
docker run --rm \
  --env-file 1panel.env \
  couponhub-api:latest \
  sh -c "cd /app/infra/database && npx prisma migrate deploy"

# 然后启动应用容器（使用 SKIP_MIGRATION=true）
docker-compose -f docker-compose.prod.yml up -d
```

### 3. 监控启动时间

在容器日志中记录启动时间：

```bash
# 查看容器启动时间
docker inspect couponHub-api-prod | grep "StartedAt"

# 查看应用启动日志
docker logs couponHub-api-prod | grep "Nest application successfully started"
```

## 🎯 快速解决清单

| 问题现象            | 解决方案                      | 预期效果          |
| ------------------- | ----------------------------- | ----------------- |
| 启动时间长（60+秒） | 重新构建镜像使用新 Dockerfile | 15-40秒启动       |
| 找不到 Prisma CLI   | Dockerfile 已修复             | 自动找到 CLI      |
| npx 解析慢          | 已添加多级查找                | 避免 npx fallback |
| 数据库不可用时卡住  | 已添加预检查                  | 5秒快速失败       |
| 表已存在无需迁移    | 设置 SKIP_MIGRATION=true      | 直接启动服务      |

## 📝 下一步

1. **重新构建镜像**（应用所有优化）
2. **重启容器并查看日志**（验证优化效果）
3. **如果还有问题**：
   - 检查数据库连接
   - 查看迁移历史
   - 使用诊断脚本排查

---

**预期改进：**

- ✅ 启动时间从 60-120+ 秒降至 15-40 秒
- ✅ 避免 npx 慢的问题
- ✅ 数据库不可用时快速失败（不卡住）
- ✅ 详细日志输出便于排查
