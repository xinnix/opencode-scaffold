# 生产环境部署检查清单

## 📋 部署前检查

### 1. 环境变量配置 ✅

- [ ] 已复制 `.env.prod.example` 为 `1panel.env`
- [ ] 已填写数据库连接配置 `DATABASE_URL`
- [ ] 已填写 JWT 密钥（至少 32 字符）
- [ ] 已填写 CORS 前端域名
- [ ] 已配置阿里云 OSS（如使用）

### 2. 微信小程序配置 ✅

- [ ] 已填写 `WX_APP_ID`
- [ ] 已填写 `WX_APP_SECRET`

### 3. 微信支付配置 ✅

- [ ] 已填写 `WX_PAY_APP_ID`
- [ ] 已填写 `WX_PAY_MCH_ID`（商户号）
- [ ] 已填写 `WX_PAY_API_KEY`（API v3 密钥）
- [ ] 已填写 `WX_PAY_SERIAL_NO`（证书序列号）
- [ ] 已填写 `WX_PAY_PUBLIC_KEY_ID`
- [ ] 已配置 `WX_PAY_NOTIFY_URL`（HTTPS）
- [ ] 已配置 `WX_PAY_REFUND_NOTIFY_URL`（HTTPS）
- [ ] 已设置 `WX_PAY_SANDBOX=false`（生产环境）

### 4. 证书文件准备 ✅

- [ ] 已创建 `certs/` 目录
- [ ] 已上传 `apiclient_key.pem`（商户私钥）
- [ ] 已上传 `wechatpay_public_key.pem`（微信支付公钥）
- [ ] 已设置证书文件权限 `chmod 600 certs/*.pem`
- [ ] 已验证证书文件完整性（非空文件）

---

## 🐳 Docker 部署检查

### 1. 镜像构建 ✅

- [ ] 已构建 API 镜像
- [ ] 已构建 Admin 镜像
- [ ] 验证镜像大小正常（< 500MB）

**检查命令**：
```bash
docker images | grep couponHub
```

### 2. 容器启动 ✅

- [ ] 已启动 API 容器
- [ ] 已启动 Admin 容器
- [ ] 容器状态为 `Up`（运行中）

**检查命令**：
```bash
docker ps | grep couponHub
```

### 3. 服务健康检查 ✅

- [ ] API 健康检查通过
- [ ] Admin 前端可访问
- [ ] 数据库连接正常
- [ ] 微信支付初始化成功

**检查命令**：
```bash
# API 健康检查
curl http://localhost:3000/health

# 查看初始化日志
docker logs couponHub-api-prod | grep "初始化"
```

---

## 🔐 安全配置检查

### 1. 证书安全 ✅

- [ ] 证书文件未提交到 Git
- [ ] 证书文件权限为 600
- [ ] Docker 挂载为只读模式 (`:ro`)
- [ ] 容器内证书路径正确

**检查命令**：
```bash
# 检查本地证书权限
ls -la certs/

# 检查容器内证书
docker exec couponHub-api-prod ls -la /app/certs
```

### 2. 环境变量安全 ✅

- [ ] `1panel.env` 未提交到 Git
- [ ] JWT 密钥强度足够（≥ 32 字符）
- [ ] API v3 密钥强度足够（≥ 32 字符）
- [ ] 敏感配置已正确填写（非占位符）

### 3. 网络安全 ✅

- [ ] HTTPS 证书已配置（Nginx）
- [ ] 回调 URL 使用 HTTPS
- [ ] CORS 配置限制为具体域名
- [ ] 防火墙端口已开放

---

## 🌐 Nginx 配置检查

### 1. 反向代理 ✅

- [ ] 已配置 API 反向代理
- [ ] 已配置 Admin 前端反向代理
- [ ] HTTPS 证书已安装
- [ ] SSL 配置正确

**测试命令**：
```bash
# 测试 HTTPS
curl -I https://你的域名/api/health

# 测试回调 URL 可访问性
curl -I https://你的域名/api/payments/wechat/callback
```

### 2. 微信支付回调 ✅

- [ ] 回调 URL 可从外网访问
- [ ] 回调 URL 使用 HTTPS
- [ ] Nginx 转发配置正确
- [ ] 防火墙已开放 443 端口

---

## 📊 功能验证

### 1. 数据库验证 ✅

- [ ] 数据库连接成功
- [ ] Prisma Client 生成正常
- [ ] 数据库迁移执行成功
- [ ] Seed 数据导入成功（可选）

**检查命令**：
```bash
docker logs couponHub-api-prod | grep "Prisma"
```

### 2. 微信支付验证 ✅

- [ ] 微信支付初始化成功
- [ ] 证书加载成功
- [ ] 日志显示「微信支付 V3 初始化成功」

**检查命令**：
```bash
docker logs couponHub-api-prod | grep "微信支付"
```

**预期输出**：
```
[WechatPayService] 微信支付 V3 初始化成功 | 商户号: XXXXXX | 沙箱: false | 验签模式: 微信支付公钥（推荐）
```

### 3. 小程序登录验证 ✅

- [ ] 微信小程序登录正常
- [ ] Token 生成成功
- [ ] 用户信息获取成功

---

## 🔧 故障排查

### 常见错误及解决方案

#### 1. 微信支付配置不完整

**错误信息**：
```
微信支付配置不完整（缺少 WX_PAY_APP_ID / WX_PAY_MCH_ID / WX_PAY_API_KEY / WX_PAY_SERIAL_NO）
```

**解决方案**：
- 检查 `1panel.env` 中所有 `WX_PAY_*` 变量是否填写
- 确保变量值非空，不是占位符（如 `your_xxx`）

---

#### 2. 证书文件找不到

**错误信息**：
```
微信支付商户私钥文件不存在或为空: /app/certs/apiclient_key.pem
```

**解决方案**：
```bash
# 1. 检查本地证书目录
ls -la certs/

# 2. 检查容器内挂载
docker exec couponHub-api-prod ls -la /app/certs

# 3. 检查 docker-compose.prod.yml volumes 配置
grep "volumes" docker-compose.prod.yml -A 5
```

---

#### 3. 微信支付公钥未配置

**错误信息**：
```
未配置微信支付公钥（WX_PAY_PUBLIC_KEY_ID / WX_PAY_PUBLIC_KEY_PATH）
```

**解决方案**：
- 确保已上传 `wechatpay_public_key.pem` 到 `certs/` 目录
- 在 `1panel.env` 中配置 `WX_PAY_PUBLIC_KEY_ID`
- 设置 `WX_PAY_PUBLIC_KEY_PATH=/app/certs/wechatpay_public_key.pem`

---

#### 4. 容器启动失败

**错误信息**：
```
Error: Cannot find module '@opencode/database'
```

**解决方案**：
```bash
# 1. 检查镜像构建是否完整
docker build -f Dockerfile.api -t couponHub-api:test . --no-cache

# 2. 检查 Prisma Client 是否生成
docker run --rm couponHub-api:test ls -la node_modules/@opencode/database

# 3. 重新构建并启动
docker-compose -f docker-compose.prod.yml build --no-cache api
docker-compose -f docker-compose.prod.yml up -d api
```

---

## 📝 部署完成确认

### 全部检查通过后，记录以下信息：

- [ ] **部署时间**: YYYY-MM-DD HH:MM
- [ ] **部署人员**: 姓名
- [ ] **服务器 IP**: x.x.x.x
- [ ] **API 域名**: https://api.yourdomain.com
- [ ] **Admin 域名**: https://admin.yourdomain.com
- [ ] **容器版本**: couponHub-api:v1-latest
- [ ] **商户号**: XXXXXX
- [ ] **证书到期时间**: YYYY-MM-DD

---

## 🚀 后续维护

### 定期检查项目

- [ ] 每周检查容器运行状态
- [ ] 每月检查证书有效期
- [ ] 每月检查日志异常
- [ ] 每季度更新依赖版本
- [ ] 证书到期前 30 天更新

### 监控命令

```bash
# 查看容器状态
docker ps | grep couponHub

# 查看实时日志
docker logs -f couponHub-api-prod

# 查看资源使用
docker stats couponHub-api-prod

# 检查证书到期（手动）
# 登录微信支付商户平台查看证书有效期
```

---

**祝部署顺利！如有问题请参考 [生产环境部署指南](deployment-guide.md)**