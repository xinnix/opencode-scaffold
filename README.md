<h1 align="center">OpenCode Scaffold</h1>

<p align="center">
  <strong>克隆即开工 — 全栈管理系统脚手架</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License"></a>
  <img src="https://img.shields.io/badge/Node-%3E%3D18-green.svg" alt="Node">
  <img src="https://img.shields.io/badge/pnpm-workspace-orange.svg" alt="pnpm">
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg" alt="PRs Welcome">
</p>

<p align="center">
  <a href="README.md">中文</a> · <a href="README.en.md">English</a>
</p>

---

面向开发者的全栈管理系统脚手架。内置 RBAC 权限、双身份认证、微信支付、文件上传等基础设施，一条命令生成全栈 CRUD 模块。克隆 → 配置 → 开发，无需从零搭建。

## 核心亮点

| 特性 | 说明 |
|------|------|
| **端到端类型安全** | tRPC `AppRouter` 类型直传前端，零手写 API 契约 |
| **CRUD 路由工厂** | `createCrudRouter('Model', schemas)` 一行生成 6 个 tRPC procedure |
| **双身份认证** | Admin (RBAC) + User (微信登录)，JWT `type` claim 自动隔离 |
| **权限即中间件** | `permissionProcedure('user', 'create')` 声明式鉴权，super_admin 自动放行 |
| **三层前端抽象** | `StandardListPage` → `StandardForm` → `FieldDefinition`，声明式构建 CRUD 页面 |
| **Token 自动刷新** | Admin + Miniapp 双端 401→refresh→retry，mutex 防并发刷新 |
| **genModule 生成器** | 一条命令生成 Prisma Schema + tRPC Router + Service + 前端页面 |
| **业务友好报错** | PostgreSQL 约束违例自动翻译为中文用户提示 |
| **微信支付集成** | JSAPI 下单 + 退款 + 回调验证，开箱即用 |
| **Monorepo 统一管理** | pnpm Workspace + 共享 Zod Schema + Prisma Client |

## 技术栈

| 层 | 技术 | 职责 |
|----|------|------|
| **Backend** | NestJS + tRPC + Prisma + PostgreSQL | API + 类型安全 RPC + ORM |
| **Admin UI** | React 19 + Refine + Ant Design 5 + tRPC | 管理后台 + 强类型调用 |
| **Miniapp** | uni-app + Vue 3 + TypeScript | 微信小程序 |
| **Shared** | Zod + `@opencode/shared` | 验证 Schema + 类型注册中心 |
| **Infra** | pnpm Workspace + Docker + Nginx | Monorepo + 容器化部署 |

**类型流 — 从数据库到 UI 的端到端类型安全：**

```
schema.prisma ──► @opencode/database ──► AppRouter ──► @opencode/shared ──► tRPC Client
     (SSOT)         (Prisma Client)      (tRPC)        (Zod Schema)       (Admin/Miniapp)
```

## 架构概览

```
                    ┌─────────────────────────────────────────────┐
                    │              apps/admin (React)              │
                    │  StandardListPage / StandardForm / Auth     │
                    └──────────────────┬──────────────────────────┘
                                       │ tRPC Client (type-safe)
                    ┌──────────────────┴──────────────────────────┐
                    │              apps/api (NestJS)               │
                    │  tRPC Router / BaseService / Guards         │
                    │  Auth / RBAC / Wechat / Payment / Upload / Agents │
                    └──────┬───────────────────────┬──────────────┘
                           │                       │
              ┌────────────┴────────┐   ┌──────────┴──────────┐
              │  PostgreSQL (Prisma) │   │  WeChat Pay / OSS   │
              └─────────────────────┘   └─────────────────────┘

                    ┌─────────────────────────────────────────────┐
                    │           apps/miniapp (uni-app)             │
                    │  WeChat Login / User Profile / HTTP Client  │
                    └──────────────────┬──────────────────────────┘
                                       │ REST API (401→refresh→retry)
```

**双身份模型**：Admin 用户通过 tRPC 访问，受 RBAC 权限控制；小程序 User 通过 REST 访问，仅能操作自己的数据。JWT 中的 `type` 字段（`admin` / `user`）在网关层自动隔离跨身份访问。

## 目录结构

```
opencode-scaffold/
├── apps/
│   ├── api/                    # NestJS 后端
│   │   └── src/
│   │       ├── modules/        # 业务模块 (auth, user, admin, role, payment, upload, wechat, agents)
│   │       ├── trpc/           # tRPC 配置 + AppRouter + createCrudRouter 工厂
│   │       ├── common/         # BaseService 基类
│   │       └── core/           # Guards, Filters, Interceptors
│   ├── admin/                  # React + Refine 管理后台
│   │   └── src/
│   │       ├── modules/        # 业务页面 (admin, user, role, auth, agents)
│   │       └── shared/        # StandardListPage, StandardForm, dataProvider, trpcClient
│   └── miniapp/                # uni-app 微信小程序
│       └── src/
│           ├── pages/          # 页面 (index, login, profile, agents)
│           ├── api/            # REST API 调用
│           └── utils/          # HTTP Client (token refresh + mutex)
├── infra/
│   ├── database/               # Prisma Schema + Client + Seed + Migrations
│   └── shared/                 # @opencode/shared (Zod Schema + 类型)
├── docs/                       # 技术文档
├── .claude/                    # Claude Code skills + agents + hooks
├── docker-compose.prod.yml     # 生产 Docker Compose
├── docker-compose.local.yml    # 本地测试 Docker Compose
└── .env.example                # 环境变量模板
```

## 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/your-org/opencode-scaffold.git my-project
cd my-project

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，填写 DATABASE_URL 和 JWT_SECRET

# 4. 启动 PostgreSQL (Docker)
docker compose -f docker-compose.local.yml up -d

# 5. 数据库迁移 + Seed
cd infra/database && npx prisma migrate dev && npx prisma db seed && cd ../..

# 6. 启动开发服务
pnpm dev
```

**验证服务启动：**

| 服务 | 地址 | 测试账号 |
|------|------|----------|
| API | `http://localhost:3000` | — |
| Swagger | `http://localhost:3000/api/docs` | — |
| Admin | `http://localhost:5173` | `superadmin@example.com / password123` |
| Miniapp H5 | `http://localhost:8080` | `user@example.com / password123` |

## 开发命令

### CLI 命令

| 命令 | 用途 |
|------|------|
| `pnpm dev` | 启动全部服务 (API + Admin + Miniapp) |
| `pnpm --filter @opencode/api dev` | 仅启动后端 API |
| `pnpm --filter admin dev` | 仅启动管理后台 |
| `pnpm --filter @opencode/miniapp dev` | 仅启动小程序 H5 |
| `pnpm build` | 构建整个 monorepo |
| `pnpm type-check` | TypeScript 类型检查 |
| `cd infra/database && npx prisma migrate dev` | 运行数据库迁移 |
| `cd infra/database && npx prisma db seed` | 填充种子数据 |

### Claude Code 斜杠命令

> 使用 [Claude Code](https://claude.ai/code) CLI 可获得 AI 辅助开发体验

| 命令 | 用途 |
|------|------|
| `/genModule <name>` | 交互式全栈 CRUD 模块生成 |
| `/init-project` | 初始化新项目（重命名包名、数据库、环境变量） |
| `/analyze` | 分析现有模块，识别标准化机会 |
| `/refactor` | 重构为脚手架标准模式 |
| `/deleteModule <name>` | 删除模块（清理前后端和 Schema） |
| `/seed-data` | 创建假数据 |
| `/db-migrate` | 运行迁移 + 生成 Prisma Client + Seed |
| `/sync` | 同步工作区（Prisma Generate + Build Shared） |

## 核心抽象层

### BaseService — CRUD 基类

继承即获得完整的 CRUD 操作，支持生命周期钩子：

```typescript
@Injectable()
export class ProductService extends BaseService<'Product'> {
  constructor(prisma: PrismaService) {
    super(prisma, 'Product');
  }
  // 可用方法: list, getOne, create, update, remove, removeMany, count, exists
  // 可覆盖钩子: beforeCreate, afterCreate, beforeUpdate, afterUpdate, beforeDelete, afterDelete
  // 行级权限: checkOwnership(userId, recordId)
}
```

### createCrudRouter — tRPC 路由工厂

一行代码生成 6 个标准 CRUD procedure：

```typescript
export const productRouter = createCrudRouter('Product', {
  create: CreateProductSchema,
  update: UpdateProductSchema,
}, {
  protectedGetMany: true,
  protectedCreate: true,
});
// 生成: getMany, getOne, create, update, delete, deleteMany
```

需要自定义 procedure 时，使用 `createCrudRouterWithCustom` 合并自定义路由。

### permissionProcedure — 声明式鉴权

```typescript
// 在 tRPC router 中声明权限，super_admin 自动放行
create: permissionProcedure('product', 'create')
  .input(CreateProductSchema)
  .mutation(async ({ ctx, input }) => { /* ... */ }),
```

### StandardListPage + StandardForm — 声明式前端

```tsx
// 列表页：columns + search + filter + statistics + permissions
<StandardListPage
  resource="products"
  title="商品管理"
  columns={columns}
  searchFields={[{ field: 'name', placeholder: '搜索商品名' }]}
  formComponent={ProductForm}
  permissions={{ create: 'product:create', update: 'product:update', delete: 'product:delete' }}
/>

// 表单：声明式字段定义
const fields: FieldDefinition[] = [
  { key: 'name', label: '商品名', type: 'input', required: true },
  { key: 'price', label: '价格', type: 'number', min: 0, precision: 2 },
  { key: 'categoryId', label: '分类', type: 'select', resource: 'categories' },
  { key: 'cover', label: '封面图', type: 'upload', maxFileSize: 2 },
  { key: 'isActive', label: '上架', type: 'switch' },
];
```

### 双身份 + Token 自动刷新

```
Admin Login ──► JWT { sub, email, type: 'admin' } ──► tRPC (RBAC)
User  Login ──► JWT { sub, openId, type: 'user'  } ──► REST  (ownership)

401 Response ──► Mutex Lock ──► Refresh Token ──► Retry Original ──► Unlock
```

### 业务友好报错

```
PostgreSQL: "duplicate key value violates unique constraint" on field `email`
    ──► 用户看到: "邮箱已存在，请使用其他值"

PostgreSQL: "violates foreign key constraint" on table `orders`
    ──► 用户看到: "该订单已有其他数据关联，无法删除"
```

## genModule 代码生成器

一条命令生成完整全栈 CRUD 模块：

```bash
/genModule product
```

**生成目标：**

| 目标 | 路径 |
|------|------|
| Prisma Model | `infra/database/prisma/schema.prisma`（追加） |
| tRPC Router | `apps/api/src/modules/product/trpc/product.router.ts` |
| NestJS Module | `apps/api/src/modules/product/module.ts` |
| List Page | `apps/admin/src/modules/product/pages/ProductListPage.tsx` |
| Form Component | `apps/admin/src/modules/product/components/ProductForm.tsx` |
| App Router 注册 | `apps/api/src/trpc/app.router.ts`（追加） |
| Refine Resource | `apps/admin/src/App.tsx`（追加） |

**智能字段推断：**

| 字段模式 | 推断的 UI 组件 |
|----------|----------------|
| `price`, `amount` | InputNumber + ¥ formatter + min:0 |
| `email` | email 验证规则 |
| `phone` | 手机号正则验证 |
| `avatar`, `cover` | OSSUpload 图片上传 |
| `parentId` | TreeSelect（自动检测树形结构） |
| `*Id`（外键） | Select 下拉（自动关联 resource） |
| `is*` | Switch 开关 |
| `*At`（日期） | DatePicker + showTime |

## 编码规范

| 规范 | 示例 |
|------|------|
| 文件命名 | `feature-name.service.ts`（kebab-case） |
| TS 变量 | `camelCase` |
| 数据库字段 | `snake_case`（via `@@map`） |
| Prisma 模型 | `PascalCase` |
| tRPC 路由 | 与 Prisma 模型名对齐 |
| Zod Schema | `CreateXxxSchema` / `UpdateXxxSchema` |

**SSOT 原则（Single Source of Truth）：**
- `schema.prisma` 是唯一的模型真理源
- `infra/shared` 是唯一的验证真理源
- 所有端共享 `@opencode/shared` 类型

**数据隔离：**
- Admin 用户可访问所有数据
- User 用户只能访问自己的数据（`where: { userId: user.id }`）
- `createdById` / `updatedById` 从 JWT 上下文自动注入

## 部署

### Docker Compose（推荐）

```bash
cp .env.example .env.prod
# 编辑 .env.prod 填写生产配置
docker compose -f docker-compose.prod.yml up -d
```

容器：`api`（NestJS）、`admin`（Nginx + 静态文件）、`postgres`、`redis`

### GitHub Actions CI/CD

项目包含 `.github/workflows/ci.yml`，push 到 `main` 时自动执行：

1. **build** — install → type-check → build
2. **migrate** — 构建通过后自动运行 `prisma migrate deploy`，同步生产数据库（PR 不触发）

> 需在 GitHub Secrets 中配置 `PROD_DATABASE_URL`

**Schema 变更流程：**

```
修改 schema.prisma → /db-migrate → /sync → git commit & push → CI 自动 migrate deploy
```

### 1Panel 部署

参考 `1panel.env.example` 配置 1Panel 环境变量。

详细部署指南见 `docs/deployment-guide.md` 和 `docs/deployment-checklist.md`。

## 环境变量

| 变量 | 必需 | 默认值 | 说明 |
|------|------|--------|------|
| `DATABASE_URL` | Yes | — | PostgreSQL 连接字符串 |
| `JWT_SECRET` | Yes | — | JWT 签名密钥（>=32 chars） |
| `JWT_EXPIRES_IN` | No | `7d` | Access Token 过期时间 |
| `JWT_REFRESH_EXPIRES_IN` | No | `30d` | Refresh Token 过期时间 |
| `CORS_ORIGIN` | No | `localhost:5173` | 允许的前端域名 |
| `PORT` | No | `3000` | API 服务端口 |
| `WX_APP_ID` | No | — | 微信小程序 AppID |
| `WX_APP_SECRET` | No | — | 微信小程序 AppSecret |
| `WX_PAY_MCH_ID` | No | — | 微信支付商户号 |

完整配置见 `.env.example`。

## 内置模块

| 模块 | 后端 | 前端 | 说明 |
|------|------|------|------|
| auth | auth.service + auth.router | LoginPage + SessionExpired | 双身份认证 + JWT |
| user | user.service + user.router | UserListPage + UserDetail | 小程序用户 CRUD |
| admin | admin.service + admin.router | AdminListPage + AdminDetail | 管理员 CRUD + RBAC |
| role | role.service + role.router | RoleListPage + RoleDetail | 角色管理 + 权限分配 |
| permission | permission.service + permission.router | — | 权限注册中心 |
| upload | upload.service + upload.router | OSSUpload 组件 | 多策略文件存储 |
| payment | payment.service + payment.router | — | 微信支付 JSAPI + 退款 |
| wechat | wechat.service | — | 微信登录 + 小程序 API |
| agents | agents.service + dify.service + agents.router | AgentListPage + AgentChatPage | Dify AI Agent 对话（SSE 流式） |

## 参与贡献

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/my-feature`
3. 提交变更：`git commit -m 'feat: add my feature'`
4. 推送分支：`git push origin feature/my-feature`
5. 提交 Pull Request

代码风格请遵循现有模式，优先使用 `BaseService` 和 `createCrudRouter`，Zod Schema 放入 `@opencode/shared`。提交前运行 `pnpm type-check`。

## 许可证

[MIT](LICENSE)

## 致谢

- [NestJS](https://nestjs.com/) — 渐进式 Node.js 框架
- [tRPC](https://trpc.io/) — 端到端类型安全 RPC
- [Prisma](https://www.prisma.io/) — 下一代 ORM
- [Refine](https://refine.dev/) — React 管理面板框架
- [Ant Design](https://ant.design/) — 企业级 UI 组件库
- [uni-app](https://uniapp.dcloud.net.cn/) — 跨端小程序框架
