# 生产环境 API 地址配置说明

## 📋 配置概览

本文档说明生产环境下管理端（Admin）向后端（API）发送请求时的地址配置。

## ✅ 当前配置状态

所有配置已验证通过 ✅

## 🔧 配置链路

### 1. 构建时配置（GitHub Actions）

**文件**: `.github/workflows/deploy.yml`

```yaml
env:
  VITE_API_URL: /trpc  # 构建时的默认值

jobs:
  build-and-push:
    steps:
      - name: Build Admin
        uses: docker/build-push-action@v5
        with:
          build-args: |
            VITE_API_URL=${{ env.VITE_API_URL }}
```

**说明**: GitHub Actions 在构建镜像时会传递 `VITE_API_URL=/trpc`

### 2. Dockerfile 配置

**文件**: `Dockerfile.admin`

```dockerfile
# Stage 3: Build
ARG VITE_API_URL=/trpc  # 默认值，可被 build-args 覆盖
ENV VITE_API_URL=${VITE_API_URL}

RUN pnpm build  # Vite 在构建时将此值硬编码到 JS 文件中
```

**说明**:
- ARG 定义构建参数，默认值为 `/trpc`
- ENV 将其设置为环境变量，Vite 在构建时读取
- 构建后的 JS 文件中会包含硬编码的 `/trpc`

### 3. 运行时配置（Nginx）

**文件**: `nginx.conf`

```nginx
location /trpc {
    proxy_pass http://api:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    # ... 其他代理配置
}
```

**说明**:
- Nginx 监听 80 端口
- 接收 `/trpc` 请求并转发到 `api:3000`（容器内网络）
- `api:3000` 是 Docker 网络中的服务名

### 4. Docker Compose 配置

**文件**: `docker-compose.prod.yml`

```yaml
services:
  api:
    image: ...-api:latest
    container_name: feedbackhub-api-prod

  admin:
    image: ...-admin:latest  # 使用 GitHub Actions 构建的镜像
    container_name: feedbackhub-admin-prod
    ports:
      - "80:80"

networks:
  feedbackhub-network:
    driver: bridge
```

**说明**:
- 两个服务在同一 Docker 网络中
- admin 容器可以通过 `http://api:3000` 访问 api 容器

### 5. 前端代码配置

**文件**: `apps/admin/src/shared/dataProvider/dataProvider.ts`

```typescript
export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpLink({
      url: import.meta.env.VITE_API_URL || "/trpc",
      // ...
    }),
  ],
});
```

**说明**:
- `import.meta.env.VITE_API_URL` 在构建时被替换为 `/trpc`
- 最终代码中会包含硬编码的 `/trpc`

## 📊 完整数据流

### 生产环境

```
┌─────────────────┐
│  浏览器          │
│ https://domain.com │
└────────┬────────┘
         │ 1. 请求 /trpc
         ▼
┌─────────────────┐
│  Nginx (admin)  │
│  :80            │
└────────┬────────┘
         │ 2. 反向代理
         ▼
┌─────────────────┐
│  API Container  │
│  api:3000       │
│  (NestJS + tRPC)│
└─────────────────┘
```

### 开发环境

```
┌─────────────────┐
│  浏览器          │
│ localhost:5173  │
└────────┬────────┘
         │ 1. 请求 /trpc
         ▼
┌─────────────────┐
│  Vite Dev Server│
│  :5173          │
└────────┬────────┘
         │ 2. 代理转发
         ▼
┌─────────────────┐
│  API Server     │
│  localhost:3000 │
└─────────────────┘
```

## 🧪 验证方法

### 1. 本地验证构建配置

```bash
# 检查 GitHub Actions 配置
grep "VITE_API_URL" .github/workflows/deploy.yml

# 检查 Dockerfile 默认值
grep "ARG VITE_API_URL" Dockerfile.admin

# 运行验证脚本
./scripts/verify-prod-config.sh
```

### 2. 容器运行时验证

```bash
# 启动服务
docker compose -f docker-compose.prod.yml up -d

# 检查构建的 JS 文件中的 API URL
docker exec feedbackhub-admin-prod sh -c 'grep -o "VITE_API_URL[^,]*" /usr/share/nginx/html/assets/*.js | head -1'

# 应该输出: /trpc
```

### 3. 网络连通性测试

```bash
# 进入 admin 容器
docker exec -it feedbackhub-admin-prod sh

# 测试能否访问 api 容器
wget -O- http://api:3000/trpc

# 应该看到 tRPC 响应
```

### 4. 浏览器测试

1. 访问 `https://your-domain.com`
2. 打开浏览器开发者工具 → Network
3. 查看请求 URL，应该是：
   ```
   https://your-domain.com/trpc?batch=1&input=...
   ```
4. 不应该看到 `localhost:3000` 或完整的 API URL

## ⚙️ 自定义配置

### 修改 API URL（前后端分离部署）

如果需要前后端分离部署（不同域名），修改 GitHub Secrets：

1. 进入 GitHub 仓库 → Settings → Secrets
2. 添加 Secret: `VITE_API_URL`
3. 值为: `https://api.your-domain.com/trpc`
4. 重新触发构建

### 本地构建测试

```bash
# 构建时指定 API URL
docker build \
  --file Dockerfile.admin \
  --build-arg VITE_API_URL=/trpc \
  --target production \
  -t feedbackhub-admin:test .
```

## 🐛 常见问题

### Q1: 为什么使用相对路径 `/trpc` 而不是完整 URL？

**A**: 相对路径有以下优势：
- ✅ 前后端同域名，无跨域问题
- ✅ 利用 Nginx 反向代理，安全且灵活
- ✅ 部署简单，只需配置一个域名
- ✅ 自动适应 HTTP/HTTPS

### Q2: 为什么不在运行时配置 API URL？

**A**: Vite 的 `VITE_*` 环境变量在**构建时**被硬编码到 JS 文件中，运行时无法修改。如果需要运行时配置，需要：
1. 使用 `window.location` 动态构建 URL
2. 或在 nginx 中注入配置文件

### Q3: docker-compose.prod.yml 中的 env_file 有用吗？

**A**: 对于 admin 服务，`env_file` **没有用**，因为：
- `env_file` 设置的是运行时环境变量
- 但 Vite 在构建时就已经将 URL 硬编码了
- 只有 api 服务需要 `env_file`（后端在运行时读取环境变量）

### Q4: 如何确认生产环境使用的是正确的配置？

**A**: 检查构建的 JS 文件：
```bash
docker exec feedbackhub-admin-prod grep -a "/trpc" /usr/share/nginx/html/assets/*.js | head -1
```

如果看到完整的 `http://localhost:3000/trpc`，说明构建时使用了错误的配置。

## 📚 相关文件

- `.github/workflows/deploy.yml` - GitHub Actions 构建配置
- `Dockerfile.admin` - Admin 镜像构建文件
- `nginx.conf` - Nginx 反向代理配置
- `docker-compose.prod.yml` - 生产环境编排配置
- `apps/admin/.env` - 本地开发环境变量
- `scripts/verify-prod-config.sh` - 配置验证脚本

## 🔄 更新日志

- 2026-03-09: 修复 Dockerfile.admin 默认值为 `/trpc`
- 2026-03-09: 清理 docker-compose.prod.yml 配置混淆
- 2026-03-09: 添加配置验证脚本
