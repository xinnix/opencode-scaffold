# 环境变量配置指南

## API 服务环境变量 (apps/api/.env)

### 基础配置

```bash
# API Server Port
PORT=3000

# CORS Origin (开发环境使用 "*", 生产环境指定域名)
CORS_ORIGIN="*"

# Node Environment
NODE_ENV=development
```

### JWT 认证配置

```bash
# JWT Secret (生产环境必须修改!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Access Token 过期时间
JWT_EXPIRES_IN=1h

# Refresh Token 过期时间
JWT_REFRESH_EXPIRES_IN=30d
```

### 微信小程序配置

```bash
# 微信小程序 AppID
WX_APP_ID=your-wechat-app-id

# 微信小程序 AppSecret
WX_APP_SECRET=your-wechat-app-secret
```

### 微信支付配置

```bash
# 微信支付 AppID (通常与小程序 AppID 相同)
WX_PAY_APP_ID=your-wechat-pay-app-id

# 微信支付商户号
WX_PAY_MCH_ID=your-merchant-id

# 微信支付 API v3 密钥
WX_PAY_API_KEY=your-api-v3-key

# 商户 API 证书序列号
WX_PAY_SERIAL_NO=your-certificate-serial-no

# 商户 API 私钥路径
WX_PAY_PRIVATE_KEY_PATH=./certs/apiclient_key.pem

# 微信支付回调 URL (必须 HTTPS)
WX_PAY_NOTIFY_URL=https://your-domain.com/api/payments/wechat/callback

# 支付环境 (true=沙箱, false=正式)
WX_PAY_SANDBOX=false
```

### 文件上传配置

#### OSS 配置 (推荐)

```bash
# 文件存储提供商
FILE_STORAGE_PROVIDER=aliyun-oss

# OSS Endpoint (例如: oss-cn-hangzhou.aliyuncs.com)
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com

# OSS Bucket 名称
OSS_BUCKET=your-bucket-name

# OSS AccessKey ID
OSS_ACCESS_KEY_ID=your-access-key-id

# OSS AccessKey Secret
OSS_ACCESS_KEY_SECRET=your-access-key-secret

# OSS Region
OSS_REGION=oss-cn-hangzhou
```

#### 本地存储配置 (备用)

```bash
# 文件存储提供商
FILE_STORAGE_PROVIDER=local

# 上传文件保存路径
UPLOAD_PATH=./uploads

# 服务器 URL (用于构建文件访问 URL)
SERVER_URL=http://localhost:3000
```

## 获取 OSS 配置信息

### 1. 创建 OSS Bucket

1. 登录 [阿里云 OSS 控制台](https://oss.console.aliyun.com/)
2. 点击「创建 Bucket」
3. 填写 Bucket 名称,选择地域
4. 存储类型: 标准存储
5. 读写权限: **公共读,私有写** (推荐) 或 **私有**
6. 创建完成后,记录:
   - Bucket 名称
   - Endpoint (如 `oss-cn-hangzhou.aliyuncs.com`)
   - Region (如 `oss-cn-hangzhou`)

### 2. 获取 AccessKey

1. 进入「访问控制 RAM」>「身份管理」>「用户」
2. 创建新用户或使用已有用户
3. 确保 user 有 `AliyunOSSFullAccess` 权限
4. 在「安全信息管理」中创建 AccessKey
5. 记录:
   - AccessKey ID
   - AccessKey Secret

⚠️ **安全提示**: AccessKey Secret 仅在创建时显示一次,请妥善保管!

### 3. 配置跨域 (CORS)

如果使用前端直传,必须在 OSS Bucket 中配置跨域规则:

1. 进入 Bucket > 「权限管理」 > 「跨域设置」
2. 点击「设置」
3. 添加规则:
   - 来源: `*` (开发) 或指定域名 (生产)
   - 允许 Methods: `GET, POST, PUT`
   - 允许 Headers: `*`
   - 暴露 Headers: `ETag, x-oss-request-id`
   - 缓存时间: `3600`

## 获取微信配置信息

### 微信小程序

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入「开发」>「开发管理」>「开发设置」
3. 记录:
   - AppID
   - AppSecret

### 微信支付

1. 登录 [微信支付商户平台](https://pay.weixin.qq.com/)
2. 进入「账户中心」>「API安全」
3. 设置:
   - API v3 密钥
   - 申请 API 证书
   - 下载商户 API 私钥文件 (`apiclient_key.pem`)
4. 记录:
   - 商户号
   - API 证书序列号

## 安全注意事项

### 生产环境必须修改的配置

1. ✅ `JWT_SECRET` - 使用强密码 (至少 32 字符)
2. ✅ `CORS_ORIGIN` - 指定具体域名,不使用 `*`
3. ✅ `WX_PAY_NOTIFY_URL` - 使用 HTTPS 域名
4. ✅ `WX_PAY_SANDBOX=false` - 关闭沙箱模式
5. ✅ OSS Bucket 权限 - 根据业务需求设置

### 证书文件

- 商户 API 私钥文件 (`apiclient_key.pem`) 放在 `apps/api/certs/` 目录
- 确保 `.gitignore` 包含 `certs/` 目录,不要提交到代码库

## 环境变量检查清单

开发环境最小配置:

```bash
✅ PORT
✅ CORS_ORIGIN
✅ JWT_SECRET (可使用默认值)
✅ WX_APP_ID + WX_APP_SECRET (小程序登录需要)
✅ FILE_STORAGE_PROVIDER + OSS 配置 (或本地存储)
```

生产环境完整配置:

```bash
✅ 所有基础配置
✅ 所有 JWT 配置 (修改密钥)
✅ 所有微信配置
✅ 所有微信支付配置
✅ OSS 配置 (推荐) 或本地存储配置
✅ SERVER_URL (本地存储时需要)
```

## 配置文件示例

参考 `apps/api/.env.example` 文件获取完整配置模板。

## 常见问题

### Q: OSS 上传失败?

检查:

1. CORS 配置是否正确
2. Bucket 权限是否允许写入
3. AccessKey 是否有效
4. Endpoint 格式是否正确 (不含 `https://`)

### Q: 微信支付回调失败?

检查:

1. `WX_PAY_NOTIFY_URL` 是否为 HTTPS
2. 服务器是否可以从外网访问
3. 证书文件路径是否正确
4. API v3 密钥是否正确

### Q: JWT 认证失败?

检查:

1. `JWT_SECRET` 是否一致
2. Token 是否过期
3. 前后端时间是否同步
