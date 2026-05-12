# 时区修复快速指南

## 🎯 问题现象

所有时间字段（createdAt, updatedAt 等）显示的时间比实际时间慢 8 小时：
- 实际时间：2026-04-10 13:20
- 数据库记录：2026-04-10 05:20

**原因：** 数据库和容器使用 UTC 时区（UTC+0），未设置北京时间（UTC+8）。

---

## ✅ 已完成修复（自动）

Claude 已自动修复以下配置：

### 1. Dockerfile.api
```dockerfile
# 添加时区配置
ENV TZ=Asia/Shanghai
RUN apk add --no-cache tzdata && \
    ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
```

### 2. Dockerfile.admin
```dockerfile
# 添加时区配置
ENV TZ=Asia/Shanghai
RUN apk add --no-cache tzdata && \
    ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
```

### 3. docker-compose.prod.yml
```yaml
services:
  api:
    environment:
      - TZ=Asia/Shanghai
  admin:
    environment:
      - TZ=Asia/Shanghai
```

### 4. .env
```bash
TZ=Asia/Shanghai
```

---

## 🚀 立即部署修复

### 开发环境
```bash
# 重启开发服务（时区立即生效）
pkill -f 'nest start'
pnpm --filter @opencode/api dev
```

### 生产环境
```bash
# 1. 重新构建镜像（包含时区修复）
docker build -f Dockerfile.api -t couponhub-api:latest .
docker build -f Dockerfile.admin -t couponhub-admin:latest .

# 2. 创建生产环境配置（如果尚未创建）
cp 1panel.env.example 1panel.env
vi 1panel.env  # 填写实际配置

# 3. 重启容器
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml --env-file 1panel.env up -d

# 4. 查看日志确认启动
docker logs -f couponHub-api-prod
```

---

## ✅ 验证修复效果

### 快速验证
```bash
# 运行验证脚本（自动检查所有配置）
bash scripts/verify-timezone.sh
```

### 手动验证
```bash
# 1. 检查容器时区
docker exec couponHub-api-prod date
# 预期输出包含：CST 或 Asia/Shanghai

docker exec couponHub-api-prod sh -c 'echo $TZ'
# 预期输出：Asia/Shanghai

# 2. 检查数据库时区
docker exec postgres psql -U xinnix -d couponHub -c "SHOW timezone;"
# 预期输出：UTC 或 Asia/Shanghai（都可接受）

# 3. 测试应用时间记录
# 创建一条测试记录，查看 createdAt 是否为当前北京时间
```

---

## 📊 影响范围

所有 DateTime 字段都将使用北京时间（修复后）：

### 订单相关
- `paidAt` - 支付时间
- `redeemedAt` - 核销时间
- `refundedAt` - 退款时间
- `expireAt` - 过期时间

### 管理相关
- `createdAt` - 创建时间
- `updatedAt` - 更新时间
- `lastLoginAt` - 最后登录时间

### 券模板相关
- `validFrom` - 有效期开始
- `validUntil` - 有效期结束

---

## ⚠️ 数据迁移（可选）

如果数据库已有 UTC 时间数据，可选择转换：

### 方案 A：保持历史数据（推荐）
- ✅ 无需操作，风险最低
- ✅ 新数据使用北京时间
- ⚠️ 前端需分别处理新旧数据

### 方案 B：批量转换历史数据
- ✅ 所有数据统一为北京时间
- ⚠️ 需要执行迁移脚本
- ⚠️ **必须先备份数据库**

```bash
# 1. 备份数据库（重要！）
docker exec postgres pg_dump -U xinnix couponHub > backup_before_timezone_fix.sql

# 2. 执行迁移
psql $DATABASE_URL < scripts/migrate-timezone-data.sql

# 或使用 Docker
docker exec -i postgres psql -U xinnix -d couponHub < scripts/migrate-timezone-data.sql
```

**迁移脚本位置：** `scripts/migrate-timezone-data.sql`

---

## 🔍 常见问题

### Q1: 为什么数据库仍显示 UTC？
**A:** 这没关系。应用层设置 `TZ=Asia/Shanghai` 后，Node.js 会自动处理时区转换：
- 数据库存储：可以是 UTC 或北京时间
- 应用读取：自动转换为北京时间
- 前端显示：直接显示北京时间

### Q2: 需要修改 PostgreSQL 时区吗？
**A:** 不需要。保持数据库 UTC 是标准做法：
- ✅ 应用层处理时区（推荐）
- ❌ 修改数据库时区（不推荐，可能引起其他问题）

### Q3: 已有数据怎么办？
**A:** 有两种选择：
1. **保持不变**（推荐）：新数据使用北京时间，前端根据时间判断
2. **批量转换**：执行 `scripts/migrate-timezone-data.sql`（需备份）

### Q4: 修复后时间仍不对？
**A:** 检查以下几点：
1. 镜像是否重新构建？（Dockerfile 修改需要重建）
2. 容器是否重启？（环境变量需要重启生效）
3. 运行验证脚本检查：`bash scripts/verify-timezone.sh`

### Q5: 前端显示时间需要改吗？
**A:** 取决于之前的实现：
- 如果前端之前有手动 +8 小时：需要移除
- 如果前端直接显示后端时间：无需修改

---

## 📝 验证清单

部署修复后，请验证：

- [ ] 重新构建 API 镜像
- [ ] 重新构建 Admin 镜像
- [ ] 创建/更新 1panel.env 配置
- [ ] 重启所有容器
- [ ] 检查容器时区（date 命令）
- [ ] 创建测试订单，验证 createdAt 时间
- [ ] 检查已有订单时间显示正确
- [ ] 验证微信支付回调时间正确

---

## 📚 相关文档

- 详细诊断报告：`docs/timezone-diagnosis.md`
- 修复摘要：`docs/timezone-fix-summary.md`
- 数据迁移脚本：`scripts/migrate-timezone-data.sql`
- 验证脚本：`scripts/verify-timezone.sh`
- 一键修复脚本：`scripts/fix-timezone.sh`

---

## 🆘 需要帮助？

如果遇到问题：
1. 运行验证脚本：`bash scripts/verify-timezone.sh`
2. 查看详细诊断：`docs/timezone-diagnosis.md`
3. 检查容器日志：`docker logs couponHub-api-prod`

---

**最后更新：** 2026-04-10
**修复状态：** ✅ 配置已完成，等待部署验证