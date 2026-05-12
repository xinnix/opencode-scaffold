# 登录错误提示说明

## 📋 错误提示类型

### 管理端登录 (`auth.adminLogin`)

| 错误类型 | 错误信息 | HTTP 状态码 | 说明 |
|---------|---------|-----------|------|
| 邮箱不存在 | `邮箱不存在` | 401 | 输入的邮箱未注册 |
| 密码错误 | `密码错误` | 401 | 邮箱正确但密码错误 |
| 账户被禁用 | `账户已被禁用，请联系管理员` | 403 | 账户被管理员禁用 |

### 小程序用户登录 (`auth.login`)

| 错误类型 | 错误信息 | HTTP 状态码 | 说明 |
|---------|---------|-----------|------|
| 邮箱不存在 | `邮箱不存在` | 401 | 输入的邮箱未注册 |
| 密码错误 | `密码错误` | 401 | 邮箱正确但密码错误 |
| 账户被禁用 | `账户已被禁用，请联系客服` | 403 | 账户被禁用 |

### 用户注册 (`auth.register`)

| 错误类型 | 错误信息 | HTTP 状态码 | 说明 |
|---------|---------|-----------|------|
| 邮箱已注册 | `该邮箱已被注册，请直接登录` | 409 | 邮箱已被使用 |
| 用户名已存在 | `用户名已被占用，请更换` | 409 | 用户名已被使用 |

## 🔒 安全性说明

### ⚠️ 注意事项

**详细错误提示的权衡：**

1. **优点**：
   - ✅ 用户体验好，明确知道错误原因
   - ✅ 减少用户尝试次数
   - ✅ 降低用户困惑

2. **安全风险**：
   - ⚠️ 攻击者可以枚举用户邮箱（通过"邮箱不存在"判断）
   - ⚠️ 可能被用于撞库攻击

### 🛡️ 安全建议

**如果需要更高安全性（生产环境推荐）：**

可以修改为模糊错误提示：

```typescript
// 不区分具体错误，统一提示
if (!user || !isValidPassword) {
  throw new TRPCError({
    code: 'UNAUTHORIZED',
    message: '邮箱或密码错误',
  });
}
```

**环境配置方案（推荐）：**

```typescript
const isProduction = process.env.NODE_ENV === 'production';

if (!user) {
  throw new TRPCError({
    code: 'UNAUTHORIZED',
    message: isProduction ? '邮箱或密码错误' : '邮箱不存在',
  });
}
```

## 📊 错误码对照表

### tRPC 错误码

| tRPC Code | HTTP Status | 含义 |
|-----------|------------|------|
| `UNAUTHORIZED` | 401 | 认证失败 |
| `FORBIDDEN` | 403 | 权限不足 |
| `CONFLICT` | 409 | 资源冲突 |

### 前端处理示例

```typescript
try {
  const result = await trpcClient.auth.adminLogin.mutate({
    email,
    password,
  });
  // 登录成功
} catch (error: any) {
  const message = error.message;

  // 根据错误信息显示不同提示
  if (message.includes('邮箱不存在')) {
    // 可以引导用户注册
  } else if (message.includes('密码错误')) {
    // 可以提供找回密码链接
  } else if (message.includes('被禁用')) {
    // 提供客服联系方式
  }
}
```

## 🧪 测试账号

**管理端测试账号**（密码：`password123`）：

| 角色 | 邮箱 | 权限 |
|------|------|------|
| 超级管理员 | superadmin@example.com | 所有权限 |
| 管理员 | admin@example.com | 大部分权限 |
| 访客 | viewer@example.com | 只读权限 |

**小程序测试账号**（密码：`password123`）：

| 角色 | 邮箱 |
|------|------|
| 普通用户 | user@example.com |
| 普通用户2 | user2@example.com |

## 🔍 错误监控建议

建议在生产环境记录登录失败的详细信息：

```typescript
// 在 auth.service.ts 中添加日志
this.logger.warn(`登录失败: ${data.email} - 原因: 用户不存在`);
this.logger.warn(`登录失败: ${data.email} - 原因: 密码错误`);
this.logger.warn(`登录失败: ${admin.email} - 原因: 账户被禁用`);
```

这有助于：
- 📈 监控异常登录尝试
- 🔐 发现潜在攻击
- 📊 分析用户行为