# 脚手架完善路线图 — 以 Claude Code 开发为中心

> 生成时间：2026-05-13
> 状态：Phase 1-5 已完成，Phase 6 待实施

## Context

当前脚手架已有扎实的核心：genModule 智能生成、BaseService/createCrudRouter/StandardListPage 抽象层、3 个 Agent、11 个 Skill、3 个 Hook。但作为"以 Claude Code 开发为中心"的框架，在**可靠性、自动化深度、开发者体验、生产就绪**四个维度存在明显短板。

---

## Phase 1 — genModule 健壮性 ✅ 已完成

### 1.1 toPascalCase/toPlural bug 修复 ✅

**文件**：`.claude/skills/genModule/scripts/generate-module.ts`

**改动**：

- `toPascalCase`：改为按 `-_/s` 分词后逐词首字母大写，正确处理 `coupon-template` → `CouponTemplate`
- `toCamelCase`：改为基于 `toPascalCase` 结果首字母小写
- `toPlural`：新增 -fe→-ves、-f→-ves、-is→-es 变形；新增 20+ 不规则复数（person/people, child/children, leaf/leaves, analysis/analyses, criterion/criteria 等）；保留大小写一致性

### 1.2 幂等性检查 ✅

**新增函数**：

- `validateModuleName(name)` — 校验格式（`^[a-z][a-z0-9-]*$`）、长度（≤50）、保留名（admin/auth/user/role/permission/upload/payment/wechat/agents/config/system/common/shared/base/prisma/trpc/health）
- `checkModuleExists(moduleName)` — 检查 Prisma schema/Zod schema/tRPC router/Frontend page 是否已存在
- `validateProjectStructure()` — 检查 5 个必需文件路径存在

**集成位置**：`generateModule()` 函数开头，幂等性检查在输入校验之后

### 1.3 try/catch + 回滚机制 ✅

**新增机制**：

- `FileOperation` 接口：记录每次文件操作的类型（create/append/modify）和原始内容
- `fileOperations[]` 数组：全局操作日志
- `modifyFile(path, modifier)` — 读取原始内容→执行修改→记录到操作日志→写入
- `rollback()` — 逆序回滚所有操作（create→unlink, append/modify→恢复原始内容），清理空目录

**集成位置**：步骤 4-10 包裹在 try/catch 中，catch 调用 `rollback()` + `process.exit(1)`

**改造的函数**：

- `updateAppTsx` — 改用 `modifyFile()` 替代直接 `readFileSync` + `writeFileSync`
- `updateAppRouter` — 同上
- `updateAdminLayout` — 同上

### 1.4 字符串定位改进 ✅

**改动**：

- `updateAppTsx`：用正则匹配 `import .+$` 找最后 import 行；用 `resources={(\[...\])}` 匹配资源数组；用 `<Route path="/" element={<AdminLayout` 匹配路由组。定位失败抛出明确 Error。
- `updateAppRouter`：用正则匹配 import 行和 `export const appRouter` 定义。定位失败抛出明确 Error。
- `updateAdminLayout`：用正则匹配 `const menuConfig = \[...\]` 和 `matchAll(/\];/g)` 找最后一个 children 数组。定位失败抛出明确 Error。

### 1.5 Mustache 模板清理 ✅

**改动**：

- `references/templates/` 重命名为 `references/legacy-templates/`
- 新增 `references/legacy-templates/README.md` 说明这些模板仅供参考，脚本使用内联模板
- 文档中列出脚本当前不生成的代码（NestJS Module、REST Controller、DTO、Service）

### 1.6 SKILL.md 更新 ✅

**改动**：

- 新增"安全特性"段落（幂等性、输入校验、项目结构验证、回滚、dry-run）
- 新增 Error 10（模块已存在）、Error 11（模块名不合法）、Error 12（项目结构不完整）
- 新增 Development Tips 9-11（模块名规则、保留名、重复防止）

---

## Phase 2 — 测试基础设施 + 安全基线 ✅ 已完成

### 2.1 测试基础设施

**目标**：为 API、Admin、Shared 三个包建立测试框架

**具体任务**：

#### 2.1.1 API 测试（vitest + @nestjs/testing）

- 安装：`vitest`, `@nestjs/testing`, `prisma-mock` 或自建 Prisma mock
- 配置：`apps/api/vitest.config.ts`
- 创建测试工具：
  - `apps/api/src/common/test/prisma-mock.ts` — PrismaClient mock factory
  - `apps/api/src/common/test/trpc-mock.ts` — tRPC caller mock（无需 HTTP）
  - `apps/api/src/common/test/app-module.ts` — 测试用 NestJS module
- 示例测试：
  - `apps/api/src/common/base.service.spec.ts` — BaseService CRUD 测试
  - `apps/api/src/trpc/trpc.helper.spec.ts` — createCrudRouter 测试
- package.json scripts：`"test": "vitest", "test:coverage": "vitest --coverage"`

#### 2.1.2 Admin 测试（vitest + React Testing Library）

- 安装：`vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`
- 配置：`apps/admin/vitest.config.ts`
- 创建测试工具：
  - `apps/admin/src/test/trpc-mock.ts` — tRPC client mock
  - `apps/admin/src/test/render-with-provider.tsx` — 带 Refine Provider 的 render
- 示例测试：
  - `apps/admin/src/shared/components/StandardListPage/index.spec.tsx`
  - `apps/admin/src/shared/components/StandardForm/index.spec.tsx`

#### 2.1.3 Shared 测试（vitest）

- 配置：`infra/shared/vitest.config.ts`
- 示例测试：Zod schema 验证测试

#### 2.1.4 genModule 生成测试脚手架

- 修改 `generate-module.ts`：每个生成的模块自动创建 `*.spec.ts` 文件
- 后端测试模板：测试 createCrudRouter 的 6 个 procedure
- 前端测试模板：测试 ListPage 渲染和表单提交

#### 2.1.5 CI 集成

- 修改 `.github/workflows/ci.yml`：添加 `test` stage

### 2.2 安全基线

**目标**：满足生产部署最低安全要求

**具体任务**：

#### 2.2.1 Rate Limiting

- 安装 `@nestjs/throttler`
- 创建 `apps/api/src/core/guards/throttler.guard.ts`
- 在 `app.module.ts` 注册 ThrottlerModule
- 配置：全局 100 req/min，auth 路由 10 req/min

#### 2.2.2 Helmet + CORS

- 安装 `@nestjs/helmet`（或手动 `helmet`）
- 在 `main.ts` 中 `app.use(helmet())`
- 配置 CORS：`app.enableCors({ origin: [...], credentials: true })`
- 设置 CSP、HSTS headers

#### 2.2.3 登录暴力破解保护

- 在 `auth.service.ts` 的 `login` 方法中添加失败计数
- 5 次失败后锁定 15 分钟
- 可选：用 Redis 存储失败计数

#### 2.2.4 文件上传校验

- 在 `upload.service.ts` 中添加文件类型白名单和大小限制
- 配置化：通过环境变量设置 `MAX_FILE_SIZE`、`ALLOWED_MIME_TYPES`

#### 2.2.5 Exception Filter 安全加固

- 修改 `http-exception.filter.ts`：生产环境不输出 stack trace 和详细错误信息
- 添加请求 ID 传播（`X-Request-Id` header）

---

## Phase 3 — 搜索抽象 + 错误体系 + 可观测性 ✅ 已完成

### 3.1 createCrudRouter 搜索/过滤抽象

**目标**：消除每个模块手动实现搜索的重复代码

**具体任务**：

#### 3.1.1 扩展 createCrudRouter 支持 search

- 在 `getMany` procedure 中增加 `search` 参数
- `search` 接受 `{ fields: string[], keyword: string }` 格式
- 自动构建 `OR` 条件：`search.fields.map(f => ({ [f]: { contains: keyword, mode: 'insensitive' } }))`
- 支持配置：`createCrudRouter('Product', { ..., searchFields: ['name', 'description'] })`

#### 3.1.2 扩展 createCrudRouter 支持 filter

- 在 `getMany` procedure 中增加 `filter` 参数
- `filter` 接受 `Record<string, any>` 格式
- 支持常见操作符：`eq`, `ne`, `gt`, `lt`, `contains`, `in`, `between`
- 自动转换为 Prisma `where` 条件

#### 3.1.3 迁移现有手动搜索实现

- 将 `userRouter` 的手动搜索迁移为 `createCrudRouter` + `searchFields` 配置
- 验证行为一致

### 3.2 错误处理体系

**目标**：统一错误格式，支持错误码和 tRPC 错误

**具体任务**：

#### 3.2.1 自定义异常类

- 创建 `apps/api/src/common/exceptions/`：
  - `business.exception.ts` — `BusinessException`（带 errorCode、message、metadata）
  - `not-found.exception.ts` — 继承 BusinessException
  - `forbidden.exception.ts` — 继承 BusinessException
  - `validation.exception.ts` — 继承 BusinessException

#### 3.2.2 错误码目录

- 创建 `apps/api/src/common/constants/error-codes.ts`
- 格式：`{ MODULE_RESOURCE_ACTION: 'ERR_XXXX' }`（如 `USER_NOT_FOUND: 'ERR_1001'`）

#### 3.2.3 tRPC 错误格式化

- 创建 `apps/api/src/trpc/trpc-error.ts` — 将 BusinessException 转为 TRPCError
- 在 tRPC middleware 中统一拦截

#### 3.2.4 请求 ID 传播

- 在 `main.ts` 中添加请求 ID 中间件
- 从 `X-Request-Id` header 读取或生成 UUID
- 注入到 tRPC context 和日志中

### 3.3 可观测性

**目标**：结构化日志 + 健康检查 + 请求日志

**具体任务**：

#### 3.3.1 结构化日志

- 安装 `nestjs-pino`（或 `winston`）
- 配置 JSON 格式日志，包含 requestId、userId、module
- 替换所有 `console.log/error` 为 LoggerService

#### 3.3.2 请求日志中间件

- 创建 `apps/api/src/core/middleware/request-log.middleware.ts`
- 记录每个请求的 method、url、statusCode、duration、requestId

#### 3.3.3 健康检查

- 安装 `@nestjs/terminus`
- 创建 `apps/api/src/modules/health/`：
  - `health.controller.ts` — `/health`（liveness）、`/health/ready`（readiness）
  - `prisma.health.ts` — 数据库连接检查
  - `redis.health.ts` — Redis 连接检查（如果使用）

---

## Phase 4 — Claude Code 集成深化 ✅ 已完成

### 4.1 Memory 系统

**目标**：让 Claude 在跨会话中保持项目上下文

**具体任务**：

- 创建 `.claude/projects/` 目录结构（已由 Claude Code 自动管理）
- 在 MEMORY.md 中维护：
  - 模块清单（名称、字段、关系、生成时间）
  - 架构决策记录（ADR）
  - 已知问题和规避方案
  - 最近的 schema 变更历史
- genModule 生成后自动更新 MEMORY.md
- deleteModule 删除后自动更新 MEMORY.md

### 4.2 MCP Server 集成

**目标**：通过 MCP 提供数据库内省和项目状态查询

**具体任务**：

- 在 `.claude/settings.json` 中配置 MCP servers：
  - Prisma MCP — 提供 schema 内省能力（模型列表、字段列表、关系图）
  - 或使用现有的 context7 MCP 查询 Prisma/NestJS 文档
- 评估：是否需要自建 MCP server 提供项目特有的内省能力

### 4.3 子 Agent 编排

**目标**：genModule 委派专业 Agent 处理各层

**具体任务**：

- 改造 genModule SKILL.md：
  - 步骤 4-5（Prisma + Zod）→ 委派 `nestjs-refine-trpc-expert` agent
  - 步骤 7（前端页面）→ 委派 `antdesign-crud-designer` agent
  - 步骤 8-10（注册）→ 保留在主脚本中
- 在 SKILL.md 中使用 Agent tool 的模式示例

### 4.4 脚本化 Skill

**目标**：将 analyze/refactor/init-project/seed-data 从纯 SKILL.md 升级为可执行脚本

**具体任务**：

#### 4.4.1 analyze 脚本化

- 创建 `.claude/skills/analyze/scripts/analyze-module.ts`
- 功能：扫描 `apps/api/src/modules/`，检测哪些模块未使用 BaseService/createCrudRouter
- 输出：标准化建议报告

#### 4.4.2 refactor 脚本化

- 创建 `.claude/skills/refactor/scripts/refactor-module.ts`
- 功能：将手动 CRUD 代码转换为 BaseService + createCrudRouter 模式
- 支持 `--dry-run` 预览

#### 4.4.3 seed-data 脚本化

- 创建 `.claude/skills/seed-data/scripts/seed-data.ts`
- 功能：基于 Prisma schema 自动生成假数据（使用 faker）
- 支持 `--count` 指定数量、`--model` 指定模型

---

## Phase 5 — 开发者体验 + 质量提升 ✅ 已完成

### 5.1 .vscode/ 配置

**具体任务**：

- `.vscode/extensions.json` — 推荐扩展（Prisma、ESLint、Prettier、Tailwind、tRPC）
- `.vscode/launch.json` — NestJS debug 配置 + Chrome DevTools 配置
- `.vscode/settings.json` — 工作区设置（formatOnSave、eslint.autoFixOnSave）
- `.vscode/tasks.json` — 常用任务（dev、build、test、migrate）

### 5.2 ESLint + Prettier 统一

**具体任务**：

- `apps/api/.eslintrc.js` — NestJS ESLint 配置
- `.prettierrc` — 统一 Prettier 配置（单引号、尾逗号、2 空格）
- `.prettierignore` — 忽略 prisma/generated 文件
- 在 `after-edit.sh` hook 中使用项目根 .prettierrc

### 5.3 commitlint + husky

**具体任务**：

- 安装 `@commitlint/cli`, `@commitlint/config-conventional`, `husky`
- `commitlint.config.js` — conventional commits 规则
- husky hooks：
  - `pre-commit` — lint-staged（eslint --fix + prettier --write）
  - `commit-msg` — commitlint
  - `pre-push` — type-check

### 5.4 Swagger/OpenAPI

**具体任务**：

- 安装 `@nestjs/swagger`, `swagger-ui-express`
- 在 `main.ts` 中配置 SwaggerModule
- 为现有 REST controllers 添加 API decorators
- 访问 `/api/docs` 查看 API 文档

### 5.5 数据库工具增强

**具体任务**：

#### 5.5.1 Prisma Extensions

- 创建 `apps/api/src/prisma/extensions/soft-delete.ts` — 软删除扩展（过滤 deletedAt 字段）
- 创建 `apps/api/src/prisma/extensions/audit.ts` — 审计字段自动填充
- 在 PrismaService 中注册扩展

#### 5.5.2 createCrudRouter 类型安全

- 替换 `z.any()` 为从 Prisma DMMF 动态生成的 Zod schema
- `transformRelationFields` 改为从 Prisma schema 读取关系字段，而非硬编码白名单
- 默认 orderBy 改为 `{ createdAt: 'desc' }`

### 5.6 模块注册完全自动化

**具体任务**：

- genModule 新增生成 NestJS Module 类（使用 `references/legacy-templates/backend/module.ts.mustache` 作为参考）
- genModule 新增生成 Permission Seed 数据
- genModule 新增自动注册到 `app.module.ts`

### 5.7 i18n 基础

**具体任务**：

- 安装 `react-i18next`, `i18next`
- 创建 `apps/admin/src/locales/zh-CN.ts` 和 `en-US.ts`
- 提取现有硬编码中文字符串到 locale 文件
- 在 App.tsx 中配置 i18n provider
- 小程序：安装 `vue-i18n`，创建 `apps/miniapp/src/locales/`

### 5.8 CI/CD 完善

**具体任务**：

- 修改 `.github/workflows/ci.yml`：
  - 添加 lint stage（eslint + prettier --check）
  - 添加 type-check stage
  - 添加 test stage
  - 添加 dependency audit stage（`pnpm audit`）
- 可选：添加 deploy stage（Docker build + push + deploy）

---

## Phase 6 — 增量优化

### 6.1 前端增强

- Zustand 全局状态管理（用户偏好、UI 状态）
- 乐观更新（useUpdate 的 onMutate 回调）
- WebSocket 实时数据同步（通知、状态变更）
- 表单草稿自动保存（localStorage）

### 6.2 小程序端集成

- genModule 生成小程序 API 客户端（`apps/miniapp/src/api/<module>.ts`）
- 基于 tRPC router 类型生成小程序请求函数

### 6.3 架构决策记录

- 创建 `docs/adr/` 目录
- 记录关键决策：Modal vs Separate Page、tRPC vs REST、BaseService 继承 vs 组合
- CLAUDE.md 补充模块清单和已知问题

### 6.4 自动化机会

- Schema 变更 hook：编辑 schema.prisma 后自动触发 prisma generate + shared build
- Enum 同步 skill：从 Prisma enum 自动生成 Zod enum 和前端 Select options
- API 文档自动生成：tRPC router 内省生成 Markdown API 参考

---

## 关键文件索引

| 文件                                                    | 用途                                 |
| ------------------------------------------------------- | ------------------------------------ |
| `.claude/skills/genModule/scripts/generate-module.ts`   | 核心生成脚本（Phase 1 已改造）       |
| `.claude/skills/genModule/SKILL.md`                     | genModule 技能文档（Phase 1 已更新） |
| `.claude/skills/genModule/references/legacy-templates/` | 参考模板（Phase 1 已重命名）         |
| `apps/api/src/common/base.service.ts`                   | BaseService 抽象                     |
| `apps/api/src/trpc/trpc.helper.ts`                      | createCrudRouter 工厂                |
| `apps/admin/src/shared/components/StandardListPage/`    | 通用列表页                           |
| `apps/admin/src/shared/components/StandardForm/`        | 通用表单                             |
| `apps/admin/src/shared/components/StandardDetailPage/`  | 通用详情页                           |
| `apps/api/src/core/filters/http-exception.filter.ts`    | 全局异常过滤器                       |
| `apps/api/src/trpc/app.router.ts`                       | tRPC 路由注册                        |
| `apps/admin/src/App.tsx`                                | 前端路由和资源注册                   |
| `apps/admin/src/shared/layouts/AdminLayout.tsx`         | 侧边栏菜单                           |
| `.github/workflows/ci.yml`                              | CI 流水线                            |
| `.claude/settings.json`                                 | Claude Code 配置（权限、hooks、MCP） |
| `.claude/agents/`                                       | Agent 定义                           |
| `.claude/hooks/`                                        | Hook 脚本                            |

---

## 验证方式

每个 Phase 完成后，按以下步骤验证：

1. **Phase 1**（已完成）：
   - `npx tsx .claude/skills/genModule/scripts/generate-module.ts --help` 正常输出
   - `npx tsx .claude/skills/genModule/scripts/generate-module.ts admin` 报错"保留名"
   - `npx tsx .claude/skills/genModule/scripts/generate-module.ts 123bad` 报错"不合法"
   - `npx tsx .claude/skills/genModule/scripts/generate-module.ts coupon-template --dry-run` 正确输出 `CouponTemplate`

2. **Phase 2**：
   - `pnpm test` 在 api/admin/shared 三个包中运行通过
   - `curl http://localhost:3000/health` 返回 200
   - 连续 10 次快速登录请求被 rate limit 拦截

3. **Phase 3**：
   - `createCrudRouter` 带 `searchFields` 的模块支持搜索
   - BusinessException 正确转换为 TRPCError
   - 日志输出包含 requestId 和结构化字段

4. **Phase 4**：
   - MEMORY.md 包含模块清单
   - genModule 生成后 MEMORY.md 自动更新
   - analyze 脚本输出标准化建议

5. **Phase 5**：
   - `pnpm lint` 通过
   - `git commit` 触发 commitlint + lint-staged
   - `/api/docs` 可访问 Swagger UI
   - Prisma soft-delete 扩展正常工作

6. **Phase 6**：
   - genModule 生成的小程序 API 客户端类型正确
   - Enum 同步 skill 输出一致
