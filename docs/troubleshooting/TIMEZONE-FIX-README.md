# 时区问题修复完整方案

## 🔍 问题确认

运行验证脚本确认问题：
```bash
bash scripts/check-timezone.sh
```

**验证结果：**
```
📱 本地系统时间：Fri Apr 10 19:09:22 CST 2026
🗄️ 数据库当前时间：2026-04-10 11:09:22 UTC
```

**问题：** 数据库时间比实际时间慢 8 小时（UTC vs 北京时间）

---

## ✅ 修复内容

### 已自动完成的修复

Claude 已自动修复以下配置：

#### 1. Dockerfile.api
```dockerfile
# --- Stage 5: Runner (最终运行镜像) ---
FROM node:22-alpine AS runner
WORKDIR /app

# ===== 时区配置（关键修复）=====
ENV TZ=Asia/Shanghai
RUN apk add --no-cache tzdata && \
    ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone && \
    apk del tzdata
```

#### 2. Dockerfile.admin
```dockerfile
# Stage 4: Production (Nginx)
FROM nginx:alpine AS production

# ===== 时区配置（关键修复）=====
ENV TZ=Asia/Shanghai
RUN apk add --no-cache tzdata && \
    ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone && \
    apk del tzdata
```

#### 3. docker-compose.prod.yml
```yaml
services:
  api:
    environment:
      - TZ=Asia/Shanghai
  admin:
    environment:
      - TZ=Asia/Shanghai
```

#### 4. .env
```bash
# ===== 时区配置（关键修复）=====
TZ=Asia/Shanghai
```

#### 5. 1panel.env.example
```bash
# ===== 时区配置（关键修复）=====
TZ=Asia/Shanghai
```

---

## 🚀 立即部署

### 方式一：一键修复（推荐）

```bash
# 运行一键修复脚本
bash scripts/fix-timezone.sh

# 验证修复效果
bash scripts/verify-timezone.sh
```

### 方式二：手动部署

#### 开发环境
```bash
# 重启开发服务（.env 中的 TZ 立即生效）
pkill -f 'nest start'
pnpm --filter @opencode/api dev
```

#### 生产环境
```bash
# 步骤 1: 重新构建镜像（包含时区修复）
docker build -f Dockerfile.api -t couponhub-api:latest .
docker build -f Dockerfile.admin -t couponhub-admin:latest .

# 步骤 2: 创建生产环境配置
cp 1panel.env.example 1panel.env
vi 1panel.env  # 填写实际配置，确保包含 TZ=Asia/Shanghai

# 步骤 3: 重启容器
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml --env-file 1panel.env up -d

# 步骤 4: 查看日志确认启动
docker logs -f couponHub-api-prod
```

---

## ✅ 验证修复

### 快速验证
```bash
# 运行验证脚本
bash scripts/check-timezone.sh
```

**预期结果：**
```
📱 本地系统时间：Fri Apr 10 19:09:22 CST 2026
🗄️ 数据库当前时间：2026-04-10 19:09:22  # 应为北京时间
🐳 API 容器时间：Fri Apr 10 19:09:22 CST 2026  # 应为北京时间
```

### 详细验证
```bash
# 完整验证脚本
bash scripts/verify-timezone.sh

# 检查容器时区
docker exec couponHub-api-prod date
docker exec couponHub-api-prod sh -c 'echo $TZ'

# 检查数据库时区
docker exec postgres psql -U xinnix -d couponHub -c "SHOW timezone;"

# 测试创建订单，验证 createdAt 时间
```

---

## 📊 影响范围

所有 DateTime 字段都将使用北京时间：

### 用户相关
- ✅ `users.createdAt` - 用户注册时间
- ✅ `users.lastLoginAt` - 最后登录时间

### 订单相关
- ✅ `orders.createdAt` - 订单创建时间
- ✅ `orders.paidAt` - 支付时间
- ✅ `orders.redeemedAt` - 核销时间
- ✅ `orders.refundedAt` - 退款时间
- ✅ `orders.expireAt` - 过期时间

### 券模板相关
- ✅ `coupon_templates.validFrom` - 有效期开始
- ✅ `coupon_templates.validUntil` - 有效期结束

### 管理相关
- ✅ `admins.createdAt` - 管理员创建时间
- ✅ `admins.lastLoginAt` - 最后登录时间
- ✅ 所有表的 `createdAt` 和 `updatedAt`

---

## ⚠️ 数据迁移（可选）

### 方案选择

**已有数据吗？**
- ❌ 否 → 无需迁移，修复后新数据自动使用北京时间
- ✅ 是 → 选择以下方案：

### 方案 A：保持历史数据（推荐）

**优点：**
- ✅ 无风险，无需操作
- ✅ 新数据使用北京时间

**缺点：**
- ⚠️ 历史数据仍是 UTC
- ⚠️ 前端可能需要区分处理

**实施：** 无需操作，只需部署修复。

### 方案 B：批量转换历史数据

**优点：**
- ✅ 所有数据统一为北京时间
- ✅ 前端无需特殊处理

**缺点：**
- ⚠️ 需要执行迁移脚本
- ⚠️ 需要备份数据库

**实施步骤：**

```bash
# 1. 备份数据库（必须！）
docker exec postgres pg_dump -U xinnix couponHub > backup_before_timezone_fix.sql

# 2. 检查迁移脚本
cat scripts/migrate-timezone-data.sql

# 3. 执行迁移（谨慎！）
docker exec -i postgres psql -U xinnix -d couponHub < scripts/migrate-timezone-data.sql

# 或使用 psql 客户端
psql $DATABASE_URL < scripts/migrate-timezone-data.sql
```

**迁移脚本说明：**
- 位置：`scripts/migrate-timezone-data.sql`
- 作用：将所有 DateTime 字段加 8 小时（UTC → 北京时间）
- 影响表：admins, users, orders, payments, settlements 等

---

## 📝 部署检查清单

### 开发环境
- [ ] .env 文件包含 `TZ=Asia/Shanghai`
- [ ] 重启开发服务
- [ ] 验证时间显示正确

### 生产环境
- [ ] Dockerfile.api 包含时区配置
- [ ] Dockerfile.admin 包含时区配置
- [ ] docker-compose.prod.yml 包含 TZ 环境变量
- [ ] 1panel.env 包含 `TZ=Asia/Shanghai`
- [ ] 重新构建镜像
- [ ] 重启容器
- [ ] 验证容器时区正确
- [ ] 创建测试订单验证时间
- [ ] （可选）迁移历史数据

---

## 🔧 故障排查

### 问题 1: 容器时间仍为 UTC

**检查：**
```bash
docker exec couponHub-api-prod date
```

**解决：**
```bash
# 确认镜像已重新构建
docker images | grep couponhub-api

# 如果镜像未更新，重新构建
docker build -f Dockerfile.api -t couponhub-api:latest .

# 重启容器
docker-compose -f docker-compose.prod.yml restart api
```

### 问题 2: 数据库时间不对

**检查：**
```bash
docker exec postgres psql -U xinnix -d couponHub -c "SHOW timezone;"
```

**说明：**
- 数据库可以保持 UTC（这是标准做法）
- 应用层设置 `TZ=Asia/Shanghai` 会自动处理转换

### 问题 3: 历史数据时间不对

**解决方案 A：** 保持不变，前端根据创建时间判断
```javascript
const createTime = new Date(order.createdAt);
const cutoffTime = new Date('2026-04-10T00:00:00Z'); // 修复部署时间
const displayTime = createTime < cutoffTime
  ? new Date(createTime.getTime() + 8 * 60 * 60 * 1000) // 旧数据 +8 小时
  : createTime; // 新数据直接显示
```

**解决方案 B：** 执行数据迁移（见上方）

### 问题 4: 验证脚本报错

**检查：**
```bash
# 容器是否运行
docker ps

# 数据库是否连接
docker exec postgres psql -U xinnix -d couponHub -c "SELECT 1;"

# 脚本权限
ls -l scripts/*.sh
```

---

## 📚 相关文档

- **快速指南：** `docs/timezone-quick-fix.md`
- **详细诊断：** `docs/timezone-diagnosis.md`
- **修复摘要：** `docs/timezone-fix-summary.md`
- **数据迁移脚本：** `scripts/migrate-timezone-data.sql`
- **验证脚本：** `scripts/verify-timezone.sh`
- **快速检查：** `scripts/check-timezone.sh`

---

## 🎯 快速命令参考

```bash
# 验证当前时区
bash scripts/check-timezone.sh

# 一键修复
bash scripts/fix-timezone.sh

# 完整验证
bash scripts/verify-timezone.sh

# 重新构建镜像
docker build -f Dockerfile.api -t couponhub-api:latest .

# 重启容器
docker-compose -f docker-compose.prod.yml restart api

# 查看容器时间
docker exec couponHub-api-prod date

# 查看数据库时间
docker exec postgres psql -U xinnix -d couponHub -c "SELECT NOW();"
```

---

**最后更新：** 2026-04-10
**状态：** ✅ 配置已完成，等待部署验证

**下一步：**
1. 运行 `bash scripts/fix-timezone.sh` 一键修复
2. 或按照手动部署步骤操作
3. 运行 `bash scripts/check-timezone.sh` 验证效果