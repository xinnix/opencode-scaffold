# 统一错误处理机制

## 架构设计

### 核心理念
- **单一职责**：错误处理逻辑集中在 `dataProvider` 层
- **自动化**：所有模块自动获得统一的错误处理
- **可维护**：错误消息统一管理，易于修改和扩展

### 错误处理流程

```
用户操作 → API 调用 → 后端返回错误
    ↓
dataProvider.handleTRPCError()
    ↓
提取业务友好的错误消息
    ↓
message.error() 显示给用户
```

## 实现细节

### 1. 错误识别与转换

**位置**: `apps/admin/src/shared/dataProvider/dataProvider.ts`

#### 外键约束错误
```typescript
// 数据库错误: "violates foreign key constraint"
// 用户看到: "该订单已有其他数据关联，无法删除"
```

支持的外键错误：
- 删除有订单关联的券模板 → "该订单已有其他数据关联，无法删除"
- 删除有核销员的商户 → "该商户已有其他数据关联，无法删除"

#### 唯一约束错误
```typescript
// 数据库错误: "duplicate key value violates unique constraint"
// 用户看到: "邮箱已存在，请使用其他值"
```

支持的字段映射：
- `email` → "邮箱"
- `username` → "用户名"
- `order_no` → "订单号"

#### 非空约束错误
```typescript
// 数据库错误: "null value in column"
// 用户看到: "标题不能为空"
```

### 2. 表名与字段名映射

为了提供更友好的错误消息，系统自动映射数据库表名和字段名：

**表名映射**:
```typescript
{
  'orders': '订单',
  'coupon_templates': '券模板',
  'merchants': '商户',
  'users': '用户',
  'news': '新闻',
  'settlements': '结算单',
}
```

**字段名映射**:
```typescript
{
  'email': '邮箱',
  'username': '用户名',
  'title': '标题',
  'password': '密码',
  'status': '状态',
  'order_no': '订单号',
}
```

### 3. 组件层使用

**无需错误处理代码**，只需关注成功回调：

```typescript
const handleDelete = (id: string) => {
  deleteOne(
    { resource: "couponTemplate", id },
    {
      onSuccess: () => {
        message.success("删除成功");
        query.refetch();
      },
      // 错误处理由 dataProvider 统一管理
    }
  );
};
```

## 支持的错误类型

### 数据库错误
- ✅ 外键约束违反 (foreign key constraint)
- ✅ 唯一约束违反 (unique constraint)
- ✅ 非空约束违反 (not null constraint)
- ✅ 检查约束违反 (check constraint)

### HTTP 错误
- ✅ 401 未授权 → 自动刷新 Token 或跳转登录
- ✅ 403 禁止访问 → "没有权限执行此操作"
- ✅ 404 未找到 → "请求的资源不存在"
- ✅ 409 冲突 → 显示具体冲突信息
- ✅ 400 错误请求 → 显示具体错误信息
- ✅ 500 服务器错误 → "服务器错误，请稍后重试"

### 网络错误
- ✅ 连接失败 → "无法连接到服务器，请检查网络连接"

## 扩展指南

### 添加新的表名映射

编辑 `dataProvider.ts` 中的 `extractBusinessErrorMessage` 函数：

```typescript
const tableNames: Record<string, string> = {
  // 现有映射...
  'new_table': '新表名', // 添加新映射
};
```

### 添加新的字段名映射

```typescript
const fieldNames: Record<string, string> = {
  // 现有映射...
  'new_field': '新字段名', // 添加新映射
};
```

### 处理新的错误类型

在 `extractBusinessErrorMessage` 函数中添加新的检测逻辑：

```typescript
// 添加新的错误类型检测
if (errorMessage.includes('新的错误模式')) {
  return "用户友好的错误消息";
}
```

## 最佳实践

### ✅ 推荐做法
- 让 `dataProvider` 统一处理所有错误
- 组件只关注成功回调
- 在全局配置错误消息映射

### ❌ 避免的做法
- 在组件层重复编写错误处理逻辑
- 直接向用户展示数据库错误消息
- 每个页面单独处理相同的错误类型

## 测试验证

删除有订单关联的券模板：
1. 在管理后台选择一个有订单的券模板
2. 点击删除按钮
3. 应该看到：**"该订单已有其他数据关联，无法删除"**

## 未来优化

- [ ] 支持国际化 (i18n)
- [ ] 添加错误上报 (Sentry)
- [ ] 支持自定义错误处理器
- [ ] 添加错误码系统