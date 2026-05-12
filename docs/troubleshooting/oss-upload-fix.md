# OSS 上传接口修复说明

## 修复的问题

### 1. 前端 tRPC 客户端导入错误

**问题:**
- `oss-upload.ts` 导入了不存在的 `trpc` 对象
- 应该导入 `trpcClient` 或 `getTrpcClient`

**修复:**
```typescript
// 修改前
import { trpc } from '../trpc/trpcClient';

// 修改后
import { trpcClient } from '../dataProvider/dataProvider';
```

### 2. 后端依赖注入问题

**问题:**
- `upload.router.ts` 中每次请求都创建新的 `ConfigService` 和 `FileStorageService` 实例
- 违反了 NestJS 依赖注入原则

**修复:**
1. 在 `AppModule` 中注册 `FileStorageService` 为全局 provider
2. 在 `trpc.ts` 中添加 `setFileStorageService` 方法
3. 在 `main.ts` 中初始化 `FileStorageService` 实例
4. 在 `createContext` 中将 `fileStorage` 添加到 context
5. 在 `upload.router.ts` 中从 `ctx.fileStorage` 获取服务实例

### 3. FileStorageService Scope 问题

**问题:**
- `FileStorageService` 使用了 `Scope.TRANSIENT`，每次请求创建新实例

**修复:**
```typescript
// 修改前
@Injectable({ scope: Scope.TRANSIENT })

// 修改后
@Injectable() // 默认单例模式
```

## 修改的文件

### 后端
1. `apps/api/src/trpc/trpc.ts` - 添加 fileStorage 到 context
2. `apps/api/src/main.ts` - 初始化 FileStorageService
3. `apps/api/src/app.module.ts` - 注册 FileStorageService 为全局 provider
4. `apps/api/src/modules/upload/module.ts` - 简化模块配置
5. `apps/api/src/modules/upload/trpc/upload.router.ts` - 使用 context 中的服务
6. `apps/api/src/shared/services/file-storage.service.ts` - 修改 scope

### 前端
1. `apps/admin/src/shared/utils/oss-upload.ts` - 修复 trpc 客户端导入
2. `apps/admin/src/modules/merchant/components/MerchantForm.tsx` - 使用 OSSUpload 组件

## 架构改进

### 之前的架构（有问题）
```
前端 → tRPC → upload.router → new ConfigService()
                              → new FileStorageService() ❌ 每次创建新实例
```

### 现在的架构（正确）
```
前端 → tRPC → upload.router → ctx.fileStorage ✅ 使用全局单例
                                 ↓
                              AppModule（全局 provider）
```

## 如何验证修复

### 1. 启动后端服务
```bash
pnpm --filter @opencode/api dev
```

### 2. 启动前端服务
```bash
pnpm --filter @opencode/admin dev
```

### 3. 测试上传功能
1. 访问商户管理页面
2. 点击「创建商户」
3. 在 Logo 字段点击「上传图片」
4. 选择图片文件
5. 查看浏览器 Network 面板:
   - 应该看到 `getUploadCredentials` 请求成功
   - 应该看到 POST 到 OSS 成功
   - 图片 URL 应该正确显示

### 4. 检查环境变量
确保 `apps/api/.env` 中配置了 OSS:
```bash
FILE_STORAGE_PROVIDER=aliyun-oss
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
OSS_BUCKET=your-bucket-name
OSS_ACCESS_KEY_ID=your-access-key-id
OSS_ACCESS_KEY_SECRET=your-access-key-secret
OSS_REGION=oss-cn-hangzhou
```

## 常见问题

### Q: 上传时提示 "文件存储服务未初始化"?
A: 检查后端日志，确认 FileStorageService 是否正确初始化。确保环境变量配置正确。

### Q: 上传时提示 CORS 错误?
A: 在 OSS Bucket 控制台配置跨域规则：
- 来源: `*` 或指定域名
- 允许方法: `GET, POST, PUT`
- 允许 Headers: `*`

### Q: 上传成功但图片无法访问?
A: 检查 Bucket 权限：
- 推荐设置为「公共读，私有写」
- 或使用「私有」并在需要时生成签名 URL

## 相关文档

- [OSS 上传使用指南](./oss-upload-guide.md)
- [环境变量配置指南](./env-configuration-guide.md)