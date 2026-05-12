# 生产数据库时区修复指南

## ⚠️ 重要警告

**这是一个高风险操作，请务必：**
1. 在低峰时段执行（建议凌晨）
2. 先在测试环境验证
3. 做好完整备份
4. 准备回滚方案

---

## 📋 操作前检查清单

### 1. 确认当前时区配置

```bash
# 连接到生产数据库
docker exec <postgres-container-name> psql -U <db-user> -d couponHub -c "SHOW timezone;"
docker exec <postgres-container-name> psql -U <db-user> -d couponHub -c "SELECT current_timestamp;"
```

**预期结果：**
- 如果显示 `UTC` → 需要修改
- 如果显示 `Asia/Shanghai` → 已正确配置

### 2. 统计需要修复的数据量

```bash
# 统计各表数据量
docker exec <postgres-container-name> psql -U <db-user> -d couponHub << EOF
SELECT 'orders' as table_name, COUNT(*) as row_count FROM orders
UNION ALL SELECT 'coupon_templates', COUNT(*) FROM coupon_templates
UNION ALL SELECT 'merchants', COUNT(*) FROM merchants
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'admins', COUNT(*) FROM admins
UNION ALL SELECT 'news', COUNT(*) FROM news
UNION ALL SELECT 'stock_logs', COUNT(*) FROM stock_logs;
EOF
```

**评估：**
- < 1000 条 → 可以考虑修复旧数据
- > 1000 条 → 建议**只修改配置，不修复旧数据**

---

## 🛡️ 数据备份（必须执行）

### 方案 1：完整数据库备份（推荐）

```bash
# 备份整个数据库
docker exec <postgres-container-name> pg_dump -U <db-user> couponHub > backup_couponHub_$(date +%Y%m%d_%H%M%S).sql

# 验证备份文件大小
ls -lh backup_couponHub_*.sql
```

### 方案 2：仅备份时间字段（节省空间）

```bash
# 只备份关键表的时间字段
docker exec <postgres-container-name> psql -U <db-user> -d couponHub << EOF > backup_timestamps_$(date +%Y%m%d_%H%M%S).sql
SELECT id, "createdAt", "updatedAt", "paidAt", "redeemedAt", "refundedAt"
FROM orders;
EOF
```

---

## 🔧 执行修复（分步操作）

### Step 1: 修改数据库时区配置（立即生效）

```bash
# 修改数据库时区
docker exec <postgres-container-name> psql -U <db-user> -d couponHub << EOF
ALTER DATABASE "couponHub" SET timezone TO 'Asia/Shanghai';
EOF

# 验证配置
docker exec <postgres-container-name> psql -U <db-user> -d couponHub -c "SHOW timezone;"
docker exec <postgres-container-name> psql -U <db-user> -d couponHub -c "SELECT current_timestamp;"
```

**预期结果：**
```
   TimeZone
---------------
 Asia/Shanghai

       current_timestamp
-------------------------------
 2026-04-16 09:XX:XX.XXXXXX+08
```

✅ **此时新数据已使用北京时间，无需重启应用**

---

### Step 2: 修复旧数据（可选，高风险）

#### ⚠️ 警告：此操作会修改所有历史数据

**仅在以下情况执行：**
- 数据量 < 1000 条
- 已完整备份
- 有停机窗口（建议暂停服务）

#### 修复脚本（分表执行）

```bash
# 创建修复脚本
cat > fix_timestamps.sql << 'EOF'
-- ============================================
-- 时间字段修复脚本
-- 将所有 UTC 时间转换为北京时间（+8小时）
-- ============================================

-- 1. Orders 表（订单）
UPDATE orders
SET "createdAt" = "createdAt" + INTERVAL '8 hours',
    "updatedAt" = "updatedAt" + INTERVAL '8 hours',
    "paidAt" = CASE WHEN "paidAt" IS NOT NULL THEN "paidAt" + INTERVAL '8 hours' ELSE NULL END,
    "redeemedAt" = CASE WHEN "redeemedAt" IS NOT NULL THEN "redeemedAt" + INTERVAL '8 hours' ELSE NULL END,
    "refundedAt" = CASE WHEN "refundedAt" IS NOT NULL THEN "refundedAt" + INTERVAL '8 hours' ELSE NULL END;

-- 2. CouponTemplate 表（券模板）
UPDATE coupon_templates
SET "createdAt" = "createdAt" + INTERVAL '8 hours',
    "updatedAt" = "updatedAt" + INTERVAL '8 hours',
    "saleFrom" = "saleFrom" + INTERVAL '8 hours',
    "saleUntil" = "saleUntil" + INTERVAL '8 hours',
    "useFrom" = "useFrom" + INTERVAL '8 hours',
    "useUntil" = "useUntil" + INTERVAL '8 hours',
    "qrcodeGeneratedAt" = CASE WHEN "qrcodeGeneratedAt" IS NOT NULL THEN "qrcodeGeneratedAt" + INTERVAL '8 hours' ELSE NULL END;

-- 3. Merchants 表（商户）
UPDATE merchants
SET "createdAt" = "createdAt" + INTERVAL '8 hours',
    "updatedAt" = "updatedAt" + INTERVAL '8 hours';

-- 4. Users 表（用户）
UPDATE users
SET "createdAt" = "createdAt" + INTERVAL '8 hours',
    "updatedAt" = "updatedAt" + INTERVAL '8 hours',
    "lastLoginAt" = CASE WHEN "lastLoginAt" IS NOT NULL THEN "lastLoginAt" + INTERVAL '8 hours' ELSE NULL END;

-- 5. Admins 表（管理员）
UPDATE admins
SET "createdAt" = "createdAt" + INTERVAL '8 hours',
    "updatedAt" = "updatedAt" + INTERVAL '8 hours',
    "lastLoginAt" = CASE WHEN "lastLoginAt" IS NOT NULL THEN "lastLoginAt" + INTERVAL '8 hours' ELSE NULL END,
    "emailVerified" = CASE WHEN "emailVerified" IS NOT NULL THEN "emailVerified" + INTERVAL '8 hours' ELSE NULL END;

-- 6. News 表（新闻）
UPDATE news
SET "createdAt" = "createdAt" + INTERVAL '8 hours',
    "updatedAt" = "updatedAt" + INTERVAL '8 hours',
    "qrcodeGeneratedAt" = CASE WHEN "qrcodeGeneratedAt" IS NOT NULL THEN "qrcodeGeneratedAt" + INTERVAL '8 hours' ELSE NULL END;

-- 7. StockLogs 表（库存日志）
UPDATE stock_logs
SET "createdAt" = "createdAt" + INTERVAL '8 hours';

-- 8. Settlements 表（结算）
UPDATE settlements
SET "createdAt" = "createdAt" + INTERVAL '8 hours',
    "updatedAt" = "updatedAt" + INTERVAL '8 hours',
    "confirmedAt" = CASE WHEN "confirmedAt" IS NOT NULL THEN "confirmedAt" + INTERVAL '8 hours' ELSE NULL END,
    "paidAt" = CASE WHEN "paidAt" IS NOT NULL THEN "paidAt" + INTERVAL '8 hours' ELSE NULL END;

-- 9. Handlers 表（核销员）
UPDATE handlers
SET "createdAt" = "createdAt" + INTERVAL '8 hours',
    "updatedAt" = "updatedAt" + INTERVAL '8 hours';

-- 10. MerchantHandlers 表（商户核销员）
UPDATE merchant_handlers
SET "createdAt" = "createdAt" + INTERVAL '8 hours',
    "updatedAt" = "updatedAt" + INTERVAL '8 hours';

-- 11. Todos 表
UPDATE todos
SET "createdAt" = "createdAt" + INTERVAL '8 hours',
    "updatedAt" = "updatedAt" + INTERVAL '8 hours',
    "dueDate" = CASE WHEN "dueDate" IS NOT NULL THEN "dueDate" + INTERVAL '8 hours' ELSE NULL END;

-- 12. AdminRefreshTokens 表
UPDATE admin_refresh_tokens
SET "createdAt" = "createdAt" + INTERVAL '8 hours',
    "expiresAt" = "expiresAt" + INTERVAL '8 hours',
    "revokedAt" = CASE WHEN "revokedAt" IS NOT NULL THEN "revokedAt" + INTERVAL '8 hours' ELSE NULL END;

-- 13. UserRefreshTokens 表
UPDATE user_refresh_tokens
SET "createdAt" = "createdAt" + INTERVAL '8 hours',
    "expiresAt" = "expiresAt" + INTERVAL '8 hours',
    "revokedAt" = CASE WHEN "revokedAt" IS NOT NULL THEN "revokedAt" + INTERVAL '8 hours' ELSE NULL END;

-- 14. AdminRoles 表
UPDATE admin_roles
SET "assignedAt" = "assignedAt" + INTERVAL '8 hours';

-- 15. Roles 表
UPDATE roles
SET "createdAt" = "createdAt" + INTERVAL '8 hours',
    "updatedAt" = "updatedAt" + INTERVAL '8 hours';

-- 16. Permissions 表
UPDATE permissions
SET "createdAt" = "createdAt" + INTERVAL '8 hours';

-- 17. RolePermissions 表
UPDATE role_permissions
SET "createdAt" = "createdAt" + INTERVAL '8 hours';

-- 18. MerchantCategories 表
UPDATE merchant_categories
SET "createdAt" = "createdAt" + INTERVAL '8 hours',
    "updatedAt" = "updatedAt" + INTERVAL '8 hours';

-- 19. NewsCouponRelations 表
UPDATE news_coupon_relations
SET "createdAt" = "createdAt" + INTERVAL '8 hours';

-- 20. RefundFailureLogs 表
UPDATE refund_failure_logs
SET "createdAt" = "createdAt" + INTERVAL '8 hours',
    "updatedAt" = "updatedAt" + INTERVAL '8 hours';

-- 验证修复结果
SELECT 'orders' as table_name, COUNT(*) as total, MIN("createdAt") as oldest, MAX("createdAt") as newest FROM orders
UNION ALL SELECT 'coupon_templates', COUNT(*), MIN("createdAt"), MAX("createdAt") FROM coupon_templates
UNION ALL SELECT 'merchants', COUNT(*), MIN("createdAt"), MAX("createdAt") FROM merchants;
EOF
```

#### 执行修复（需要停机）

```bash
# 1. 暂停应用服务（建议）
docker-compose -f docker-compose.prod.yml down

# 2. 执行修复脚本
docker exec -i <postgres-container-name> psql -U <db-user> -d couponHub < fix_timestamps.sql

# 3. 验证修复结果
docker exec <postgres-container-name> psql -U <db-user> -d couponHub -c 'SELECT id, "orderNo", "createdAt" FROM orders ORDER BY "createdAt" DESC LIMIT 5;'

# 4. 重启应用
docker-compose -f docker-compose.prod.yml up -d
```

---

## ✅ 验证修复结果

### 1. 检查新数据时间

```bash
# 创建测试订单（通过 API 或小程序）
# 然后查询数据库验证时间
docker exec <postgres-container-name> psql -U <db-user> -d couponHub << EOF
SELECT id, "orderNo", "createdAt", "updatedAt"
FROM orders
ORDER BY "createdAt" DESC
LIMIT 1;
EOF
```

**预期：** `createdAt` 时间应该与系统时间一致（北京时间）

### 2. 检查应用日志

```bash
# 查看 API 日志，确认时间正确
docker logs couponHub-api-prod --tail 100 | grep -i "time"
```

### 3. 检查小程序端显示

在小程序端查看订单列表，确认时间显示正确。

---

## 🔄 回滚方案（如果出现问题）

### 方案 1：从备份恢复

```bash
# 停止服务
docker-compose -f docker-compose.prod.yml down

# 恢复数据库
docker exec -i <postgres-container-name> psql -U <db-user> -d couponHub < backup_couponHub_YYYYMMDD_HHMMSS.sql

# 重启服务
docker-compose -f docker-compose.prod.yml up -d
```

### 方案 2：反向修复时间字段

```bash
# 如果已执行了 +8 小时，需要回滚则执行 -8 小时
docker exec <postgres-container-name> psql -U <db-user> -d couponHub << EOF
UPDATE orders
SET "createdAt" = "createdAt" - INTERVAL '8 hours',
    "updatedAt" = "updatedAt" - INTERVAL '8 hours';
-- ... 其他表同理
EOF
```

---

## 📊 监控建议

### 1. 监控新订单时间

```bash
# 创建定时检查脚本
cat > check_timezone.sh << 'EOF'
#!/bin/bash
docker exec <postgres-container-name> psql -U <db-user> -d couponHub -c "SELECT current_timestamp;" | grep -q "Asia/Shanghai"
if [ $? -eq 0 ]; then
    echo "✅ Timezone OK"
else
    echo "❌ Timezone ERROR"
    # 发送告警（邮件/短信）
fi
EOF

# 添加到 cron 定时任务（每小时检查）
crontab -e
# 添加：0 * * * * /path/to/check_timezone.sh >> /var/log/timezone_check.log
```

### 2. 监控订单创建日志

在应用日志中记录订单创建时间，对比数据库时间：

```typescript
// apps/api/src/modules/order/services/order.service.ts
const order = await this.prisma.order.create({
  data: { ... }
});
this.logger.log(`订单创建：${order.orderNo}, createdAt: ${order.createdAt}, 系统时间: ${new Date()}`);
```

---

## 🎯 最佳实践建议

### 1. 只修改配置，不修复旧数据（推荐）

**优点：**
- 零风险，不影响现有数据
- 不需要停机
- 新数据立即使用正确时间

**缺点：**
- 旧数据时间仍为 UTC（需要前端显示时 +8 小时）

### 2. 完整修复（仅适用于新系统）

**条件：**
- 数据量 < 1000 条
- 系统刚上线，历史数据不重要
- 有完整备份和停机窗口

### 3. 分阶段修复（大型系统）

**步骤：**
1. 先修改配置（立即生效）
2. 每天凌晨批量修复前一天的数据
3. 逐步修复历史数据

---

## 🚨 常见问题

### Q1: 修改时区后需要重启应用吗？

**A:** 不需要。`ALTER DATABASE` 立即生效，新连接会自动使用新时区。

### Q2: 旧订单的时间会在前端显示错误吗？

**A:** 是的。如果前端直接显示数据库时间，旧订单会显示 UTC 时间。解决方案：
- **方案 1：** 前端根据订单号判断（订单号包含正确时间）
- **方案 2：** 前端显示时统一 +8 小时
- **方案 3：** 执行旧数据修复脚本

### Q3: 时区配置会丢失吗？

**A:** 不会。`ALTER DATABASE` 永久保存，即使重启容器也不会丢失。

### Q4: 如何确保 Docker 容器也使用正确时区？

**A:** 在 `docker-compose.prod.yml` 中添加：
```yaml
environment:
  - TZ=Asia/Shanghai
```

---

## 📝 操作记录模板

```
执行时间：2026-XX-XX XX:XX
执行人：XXX
备份文件：backup_couponHub_YYYYMMDD_HHMMSS.sql
修复前时区：UTC
修复后时区：Asia/Shanghai
修复的数据表：orders, coupon_templates, ...（列出）
修复的记录数：XXX 条
验证结果：✅ 成功 / ❌ 失败
回滚操作：如有
备注：
```

---

## 🔗 相关文档

- PostgreSQL 时区文档：https://www.postgresql.org/docs/current/datatype-datetime.html
- Prisma DateTime 文档：https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#datetime