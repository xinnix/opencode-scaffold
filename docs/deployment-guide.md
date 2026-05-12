# 生产环境部署指南

## 目录

- [环境变量配置](#环境变量配置)
- [微信支付证书处理](#微信支付证书处理)
- [Docker 部署流程](#docker-部署流程)
- [常见问题](#常见问题)

---

## 环境变量配置

### 1. 复制环境变量模板

```bash
cp .env.prod.example .env.prod
# 或使用 1panel.env（推荐）
cp .env.prod.example 1panel.env
```

### 2. 配置微信支付环境变量

在 `1panel.env` 中填写以下微信支付配置：

```bash
# 微信支付基础配置
WX_PAY_APP_ID=你的小程序AppID
WX_PAY_MCH_ID=商户号
WX_PAY_API_KEY=API_v3密钥
WX_PAY_SERIAL_NO=商户证书序列号

# 证书路径（容器内路径，不要修改）
WX_PAY_PRIVATE_KEY_PATH=/app/certs/apiclient_key.pem
WX_PAY_PUBLIC_KEY_ID=PUB_KEY_ID_XXXXX
WX_PAY_PUBLIC_KEY_PATH=/app/certs/wechatpay_public_key.pem

# 回调地址（必须 HTTPS）
WX_PAY_NOTIFY_URL=https://你的域名/api/payments/wechat/callback
WX_PAY_REFUND_NOTIFY_URL=https://你的域名/api/payments/wechat/refund-callback

# 支付环境
WX_PAY_SANDBOX=false  # 生产环境设为 false
```

---

## 微信支付证书处理

### 方案一：Volume 挂载（推荐）

**适用场景**：
- 有服务器文件系统访问权限
- 需要灵活更新证书文件
- 多环境部署（开发/测试/生产）

**操作步骤**：

1. 在服务器上创建证书目录：

```bash
# 在项目根目录创建 certs 目录
mkdir -p certs

# 上传证书文件到服务器
# 方式 1：使用 scp
scp apps/api/certs/apiclient_key.pem user@server:/path/to/coupon/certs/
scp apps/api/certs/wechatpay_public_key.pem user@server:/path/to/coupon/certs/

# 方式 2：使用 FTP/SFTP 工具上传
```

2. docker-compose.prod.yml 已配置自动挂载：

```yaml
volumes:
  - ./certs:/app/certs:ro  # 只读挂载，提升安全性
```

3. 验证证书文件：

```bash
# 启动容器后，验证证书是否存在
docker exec couponHub-api-prod ls -la /app/certs
# 应看到：
# apiclient_key.pem
# wechatpay_public_key.pem
```

**优点**：
- ✅ 不需要重新构建镜像即可更新证书
- ✅ 证书文件不会包含在镜像中（安全性更高）
- ✅ 容器重启自动加载新证书
- ✅ 多环境部署只需修改挂载路径

**缺点**：
- ❌ 需要在服务器上维护证书文件
- ❌ 部署时需要额外步骤上传证书

---

### 方案二：构建时复制（适合 CI/CD）

**适用场景**：
- CI/CD 自动化构建
- 容器化平台部署（K8s、Docker Swarm）
- 需要镜像自包含所有配置

**操作步骤**：

1. 修改 Dockerfile.api（构建阶段）：

```dockerfile
# --- Stage 5: Runner ---
FROM node:22-alpine AS runner
WORKDIR /app

# ... 其他 COPY 步骤 ...

# 构建时复制证书文件（需要在构建上下文中存在）
# 注意：需要在构建前将证书文件复制到项目根目录的 certs/ 文件夹
COPY certs/apiclient_key.pem /app/certs/apiclient_key.pem
COPY certs/wechatpay_public_key.pem /app/certs/wechatpay_public_key.pem

# ... 其他配置 ...
```

2. 构建镜像前准备证书：

```bash
# 在项目根目录
mkdir -p certs
cp apps/api/certs/*.pem certs/
```

3. 构建镜像：

```bash
docker build -f Dockerfile.api -t couponHub-api:latest .
```

**优点**：
- ✅ 镜像自包含，无需外部依赖
- ✅ 适合 K8s、Docker Swarm 等平台
- ✅ 部署简单，只需拉取镜像

**缺点**：
- ❌ 证书文件会包含在镜像中（安全性较低）
- ❌ 更新证书需要重新构建镜像
- ❌ 需要在构建上下文中维护证书文件

**⚠️ 安全提示**：
如果使用此方案，**切勿将证书推送到公共镜像仓库**！建议：
- 使用私有镜像仓库（ghcr.io private、阿里云 ACR）
- 构建完成后删除本地镜像中的证书（使用多阶段构建清理）

---

### 方案三：Docker Secrets（生产推荐）

**适用场景**：
- Docker Swarm 集群部署
- 需要最高安全级别
- 多服务共享证书

**操作步骤**：

1. 创建 Docker Secrets：

```bash
# 在 Swarm master 节点执行
docker secret create wechat_pay_private_key certs/apiclient_key.pem
docker secret create wechat_pay_public_key certs/wechatpay_public_key.pem
```

2. 修改 docker-compose.prod.yml：

```yaml
secrets:
  wechat_pay_private_key:
    external: true
  wechat_pay_public_key:
    external: true

services:
  api:
    secrets:
      - wechat_pay_private_key
      - wechat_pay_public_key
    environment:
      - WX_PAY_PRIVATE_KEY_PATH=/run/secrets/wechat_pay_private_key
      - WX_PAY_PUBLIC_KEY_PATH=/run/secrets/wechat_pay_public_key
```

**优点**：
- ✅ 最高安全性（证书不会写入镜像或挂载为文件）
- ✅ 自动分发到 Swarm 所有节点
- ✅ 支持证书轮换和版本管理
- ✅ 仅运行时可见，构建时不可见

**缺点**：
- ❌ 仅支持 Docker Swarm，不支持单机 Docker Compose
- ❌ 配置复杂度较高

---

## Docker 部署流程

### 1. 前置准备

```bash
# 1. 克隆代码
git clone https://github.com/your-repo/couponHub.git
cd couponHub

# 2. 创建证书目录并上传证书
mkdir -p certs
# 上传 apiclient_key.pem 和 wechatpay_public_key.pem 到 certs/

# 3. 配置环境变量
cp .env.prod.example 1panel.env
# 编辑 1panel.env，填写实际配置
```

### 2. 构建镜像

```bash
# 构建所有镜像
docker-compose -f docker-compose.prod.yml build

# 或单独构建 API 镜像
docker build -f Dockerfile.api -t couponHub-api:latest .
```

### 3. 启动服务

```bash
# 使用 docker-compose 启动
docker-compose -f docker-compose.prod.yml --env-file 1panel.env up -d

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f api
```

### 4. 验证部署

```bash
# 检查容器状态
docker ps

# 检查 API 健康状态
curl http://localhost:3000/health

# 检查微信支付配置是否正确加载
docker exec couponHub-api-prod cat /app/certs/apiclient_key.pem
```

### 5. 配置 Nginx 反向代理（HTTPS）

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 常见问题

### Q1: 证书文件找不到

**错误信息**：
```
微信支付商户私钥文件不存在或为空: /app/certs/apiclient_key.pem
```

**解决方案**：

1. 检查宿主机证书目录：

```bash
ls -la certs/
# 应看到两个 .pem 文件
```

2. 检查容器内挂载：

```bash
docker exec couponHub-api-prod ls -la /app/certs
```

3. 检查 docker-compose.prod.yml volumes 配置是否正确。

---

### Q2: 微信支付配置不完整

**错误信息**：
```
微信支付配置不完整（缺少 WX_PAY_APP_ID / WX_PAY_MCH_ID / WX_PAY_API_KEY / WX_PAY_SERIAL_NO）
```

**解决方案**：

1. 检查 `1panel.env` 是否包含所有必需环境变量：

```bash
grep WX_PAY 1panel.env
```

2. 确保所有必需变量都已填写：
   - `WX_PAY_APP_ID`
   - `WX_PAY_MCH_ID`
   - `WX_PAY_API_KEY`
   - `WX_PAY_SERIAL_NO`
   - `WX_PAY_PUBLIC_KEY_ID`
   - `WX_PAY_PRIVATE_KEY_PATH`
   - `WX_PAY_PUBLIC_KEY_PATH`

---

### Q3: 回调地址无法访问

**错误信息**：
```
支付回调失败: 连接超时
```

**解决方案**：

1. 确保回调 URL 配置正确（必须是 HTTPS）：

```bash
WX_PAY_NOTIFY_URL=https://你的域名/api/payments/wechat/callback
```

2. 确保 Nginx 反向代理配置正确。

3. 检查防火墙是否开放端口。

4. 使用微信支付回调 URL 验证工具测试。

---

### Q4: 如何更新证书

**方案一（Volume 挂载）**：

```bash
# 1. 上传新证书到服务器
scp new_apiclient_key.pem user@server:/path/to/coupon/certs/apiclient_key.pem

# 2. 重启容器自动加载新证书
docker-compose -f docker-compose.prod.yml restart api
```

**方案二（构建时复制）**：

```bash
# 1. 更新本地证书文件
cp new_apiclient_key.pem certs/apiclient_key.pem

# 2. 重新构建镜像
docker build -f Dockerfile.api -t couponHub-api:latest .

# 3. 重启服务
docker-compose -f docker-compose.prod.yml up -d --force-recreate api
```

---

### Q5: 证书文件安全性

**最佳实践**：

1. ✅ **不要提交证书到 Git**：
   - `.gitignore` 已配置忽略 `*.pem` 文件
   - 使用 `.env.prod` 或 `1panel.env` 存储配置（也不提交）

2. ✅ **使用 Volume 只读挂载**：
   ```yaml
   volumes:
     - ./certs:/app/certs:ro  # 只读，防止容器修改
   ```

3. ✅ **限制证书文件权限**：
   ```bash
   chmod 600 certs/*.pem  # 仅 owner 可读写
   chown root:root certs/*.pem  # 或使用专用用户
   ```

4. ✅ **定期轮换证书**：
   - 微信支付证书有效期 1-2 年
   - 设置提醒，到期前更新

5. ✅ **监控证书使用日志**：
   ```bash
   docker logs couponHub-api-prod | grep "微信支付"
   ```

---

## 推荐方案对比

| 方案 | 适用场景 | 安全性 | 灵活性 | 复杂度 |
|------|---------|--------|--------|--------|
| **Volume 挂载** | 单机部署、有服务器权限 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **构建时复制** | CI/CD、K8s 平台 | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Docker Secrets** | Swarm 集群 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

**推荐**：
- **单机部署**：使用 **Volume 挂载**
- **Swarm 集群**：使用 **Docker Secrets**
- **K8s 部署**：使用 **K8s Secrets**（类似 Docker Secrets）

---

## 相关文档

- [微信支付快速配置](wechat-pay-quick-setup.md)
- [微信支付公钥升级指南](wechat-pay-public-key-guide.md)
- [微信支付 SDK 升级指南](wechatpay-sdk-upgrade-guide.md)
- [退款回调实现文档](refund-callback-implementation.md)