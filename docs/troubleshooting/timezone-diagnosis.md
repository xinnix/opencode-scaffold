# 时区配置问题诊断报告

## 🔍 问题分析

经过检查，发现以下时区配置问题：

### 1. PostgreSQL 数据库时区

```
当前时区: Etc/UTC (UTC+0)
```

### 2. Docker 容器时区

```bash
# Dockerfile.api 中缺少：
- TZ 环境变量未设置
- tzdata 包未安装
- Alpine Linux 默认使用 UTC
```

### 3. 应用时区配置

```bash
# .env 文件中缺少：
- TZ=Asia/Shanghai 配置
```

### 4. 时间字段影响范围

所有 DateTime 字段都受影响：

- `createdAt` - 创建时间（@default(now())）
- `updatedAt` - 更新时间（@updatedAt）
- `paidAt` - 支付时间
- `redeemedAt` - 核销时间
- `validFrom/validUntil` - 有效期
- 其他所有 DateTime 字段

**影响：**

- 数据库存储的时间是 UTC（比北京时间慢 8 小时）
- 例如：北京时间 2026-04-10 13:20 -> 数据库记录 2026-04-10 05:20

---

## ✅ 解决方案

有两种方案可选：

### 方案 A：统一设置为北京时间（推荐用于纯国内项目）

**优点：**

- 简单直接，数据库和应用统一时区
- 避免前端转换时区的复杂性
- 适合只服务中国用户的项目

**缺点：**

- 不适合国际化项目
- 数据迁移需要注意时区一致性

#### 实施步骤：

**1. 修改 Dockerfile.api（设置容器时区）**

```dockerfile
# 在 runner 阶段添加
ENV TZ=Asia/Shanghai
RUN apk add --no-cache tzdata && \
    ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone
```

**2. 修改 docker-compose.prod.yml（设置数据库时区）**

```yaml
services:
  api:
    environment:
      - TZ=Asia/Shanghai
```

**3. 设置 PostgreSQL 时区（可选）**

```sql
-- 在数据库中执行
ALTER DATABASE couponHub SET timezone TO 'Asia/Shanghai';

-- 或在连接时设置
-- DATABASE_URL 中添加参数
DATABASE_URL="postgresql://user:pass@host:port/db?timezone=Asia/Shanghai"
```

**4. 更新 .env 文件**

```bash
# 添加时区配置
TZ=Asia/Shanghai
```

**5. 重启服务**

```bash
# 重新构建镜像
docker build -f Dockerfile.api -t couponhub-api:latest .

# 重启容器
docker-compose -f docker-compose.prod.yml up -d --force-recreate
```

---

### 方案 B：应用层保持 UTC，响应时转换为用户时区（推荐用于国际化项目）

**优点：**

- 符合国际化最佳实践
- 数据库存储标准 UTC 时间
- 前端根据用户位置自动转换
- 支持多时区用户

**缺点：**

- 前端需要额外的时区转换逻辑
- API 响应需要包含时区信息

#### 实施步骤：

**1. 后端：API 响应中包含时区信息**

在 DTO 或响应中添加时区字段：

```typescript
interface OrderResponse {
  id: string;
  createdAt: string; // ISO 8601 格式: "2026-04-10T05:20:00.000Z"
  createdAtLocal?: string; // 可选：转换为用户时区的时间
  timezone?: string; // 可选：用户的时区
}
```

**2. 前端：使用库转换时区**

安装 dayjs 或 date-fns：

```typescript
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

// 转换为用户时区
const localTime = dayjs(createdAt).tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss');
```

**3. 小程序端处理**

```vue
<script setup>
import dayjs from 'dayjs';

// 将 UTC 时间转换为北京时间显示
function formatTime(utcTime: string) {
  return dayjs(utcTime).tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss');
}
</script>

<template>
  <div>创建时间: {{ formatTime(order.createdAt) }}</div>
</template>
```

---

## 🎯 推荐方案

根据你的项目特点：

### 如果项目只服务中国用户：

- **使用方案 A**（统一设置北京时间）
- 简单直接，无前端转换成本

### 如果项目可能服务海外用户：

- **使用方案 B**（UTC + 前端转换）
- 符合国际化标准，支持多时区

---

## 📋 实施检查清单

### 方案 A 检查清单：

- [ ] 修改 Dockerfile.api 添加 TZ 和 tzdata
- [ ] 修改 docker-compose.prod.yml 添加 TZ 环境变量
- [ ] 更新 .env 文件添加 TZ=Asia/Shanghai
- [ ] 重新构建镜像
- [ ] 重启容器
- [ ] 验证时间显示正确

### 方案 B 检查清单：

- [ ] 后端确保返回 ISO 8601 格式时间
- [ ] 前端安装时区处理库（dayjs/date-fns）
- [ ] 前端实现时区转换函数
- [ ] 测试不同时区用户的时间显示

---

## 🔧 验证时区配置

### 验证容器时区：

```bash
docker exec couponHub-api-prod date
# 预期输出：包含 CST 或 Asia/Shanghai

docker exec couponHub-api-prod sh -c 'echo $TZ'
# 预期输出：Asia/Shanghai
```

### 验证数据库时区：

```bash
docker exec -i postgres psql -U xinnix -d couponHub -c "SHOW timezone;"
# 预期输出：Asia/Shanghai（如果设置了）
# 或 Etc/UTC（如果保持 UTC）
```

### 验证应用时间：

```bash
# 查看创建的记录时间
curl http://localhost:3000/api/orders/my -H "Authorization: Bearer <token>"

# 检查 createdAt 字段是否为北京时间
```

---

## 🚨 注意事项

### 1. 已有数据的时区问题

如果数据库已有数据（UTC 时间），设置时区后：

**方案 A：**

- 新数据会使用北京时间存储
- 旧数据仍是 UTC，需要手动转换（可选）

**转换脚本：**

```sql
-- 将所有 DateTime 字段加 8 小时（UTC -> 北京时间）
UPDATE admins SET created_at = created_at + INTERVAL '8 hours';
UPDATE users SET created_at = created_at + INTERVAL '8 hours';
-- 其他表...
```

**方案 B：**

- 数据保持 UTC
- 前端查询时自动转换显示

### 2. 微信支付回调时间

微信支付回调的 `paidAt` 时间：

- 微信返回的是北京时间
- 需要在保存时转换为 UTC（方案 B）或直接保存（方案 A）

### 3. 定时任务时间

如果使用定时任务（cron、调度器）：

- 确保调度器也使用相同时区
- 否则任务执行时间会偏差 8 小时

---

## 💡 最佳实践建议

### 推荐：方案 B（UTC + 前端转换）

理由：

1. **国际化友好**：未来扩展海外用户无障碍
2. **数据库标准**：UTC 是数据库时间的行业标准
3. **时区转换灵活**：前端可以根据用户 GPS 或设置动态显示
4. **避免数据迁移**：不需要批量修改历史数据

### 实现示例：

**后端：**

```typescript
// apps/api/src/order/order.service.ts
async createOrder(data: CreateOrderDto) {
  const order = await this.prisma.order.create({
    data: {
      ...data,
      createdAt: new Date(), // 自动使用 UTC
    },
  });

  return {
    ...order,
    // 返回 ISO 8601 格式（包含 Z 后缀表示 UTC）
    createdAt: order.createdAt.toISOString(),
  };
}
```

**前端（小程序）：**

```vue
<script setup>
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

// 北京时间格式化
const formatBeijingTime = (isoString: string) => {
  return dayjs(isoString).tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss');
};

// 示例：显示订单创建时间
const orderCreateTime = ref('');

async function loadOrder() {
  const order = await api.getOrder(id);
  orderCreateTime.value = formatBeijingTime(order.createdAt);
}
</script>

<template>
  <div class="time">创建时间: {{ orderCreateTime }}</div>
</template>
```

---

## 📞 下一步

请告诉我你希望使用哪种方案：

- **方案 A**：统一北京时间（国内项目）
- **方案 B**：UTC + 前端转换（国际化项目）

我将帮你实施完整的修复方案。
