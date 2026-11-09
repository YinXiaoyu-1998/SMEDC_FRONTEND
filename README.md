# SMEDC 前端

SMEDC 的网页前端：一个独立构建、独立部署的静态 React 应用。
它只通过 `/api/web/v1` 的 JSON 契约访问后端，不消费任何后端渲染的 HTML。

- 迁移背景与权威规格：SME_DATA_CENTER Issue #319
- 实施计划（决策、契约机制、分批）：SME_DATA_CENTER `docs/implementation/web-frontend-migration.md`
- 后端仓库：https://github.com/YinXiaoyu-1998/SME_DATA_CENTER

## 目录约定

| 路径            | 责任                                                       |
| --------------- | ---------------------------------------------------------- |
| `src/api/`      | HTTP 客户端；`generated/` 由后端契约生成，禁止手改         |
| `src/app/`      | 路由、布局、导航、角色跳转、错误页                         |
| `src/i18n/`     | `{zh, en}` 文案字典与 `useText()`                          |
| `src/ui/`       | 可复用的交互内核：按钮状态机、对话框、表格、字段、冲突对比 |
| `src/features/` | 权限设置、自动任务、台账下载中心                           |
| `src/styles/`   | 设计令牌与 CSS Modules                                     |

## 技术栈

| 类别   | 选择                                                           |
| ------ | -------------------------------------------------------------- |
| 框架   | React 19 + TypeScript 5.9（strict）                            |
| 构建   | Vite 7                                                         |
| 路由   | react-router 7（`createBrowserRouter`）                        |
| 数据层 | @tanstack/react-query 5                                        |
| 校验   | zod 4                                                          |
| 样式   | CSS Modules（不引入 UI 框架，按需使用 @radix-ui/react-dialog） |
| 测试   | vitest 3 + jsdom + Testing Library                             |

## 契约同步与代码生成

浏览器接口的唯一权威来源是后端公开仓库的 `packages/web-api-contract/contract.json`（JSON Schema 2020-12）。
本仓把契约快照与生成物一起提交，保证没有网络时也能构建、测试与校验。

```bash
# 按指定 commit 拉取并重新生成（只接受 commit SHA，分支名/tag 会移动，不能用于复现）
npm run contract:sync -- --ref 59e0b43b1e6f57a9951fae950c6d15973641950e

# 按 contract/ref.json 里 pin 住的 commit 重新拉取
npm run contract:sync

# 只做本地校验，不联网（CI 使用）
npm run contract:sync -- --check
```

| 文件                            | 说明                                                                                   |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| `contract/contract.json`        | 契约快照，由 sync 写入，禁止手改                                                       |
| `contract/ref.json`             | `{ repository, ref, syncedAt, hash }`；`hash` 是 `contract.json` 的 sha256，供 CI 比对 |
| `src/api/generated/contract.ts` | 由 `contract.json` 生成的 zod schema、推导类型与 `webApiRoutes`，禁止手改              |

规则：

- 生成物第一行固定是 `// 由 npm run contract:sync 生成，禁止手改`。
- 每条路由 `id`（如 `session.login`）推导为 `sessionLoginResponseSchema` / `SessionLoginResponse`，
  并同时导出 `Body` / `Params` / `Query` / `Response` 四组；契约里没有的部分生成空对象 schema，
  调用方不必判断某组 schema 是否存在。
- 生成是确定性的：命名与顺序只由契约内容决定，写入前用 prettier 格式化，连续两次生成字节一致。
- 拉取失败（网络、HTTP 错误、非法 JSON）会直接报错退出，不会静默沿用本地旧文件。

### 为什么没有用 json-schema-to-zod

生成物需要可读、可 diff、可逐字比较，而 `json-schema-to-zod` 的输出排版与 zod3 习惯语法由库版本决定，
升级依赖会无意义地重写整份生成物。转换器（[scripts/lib/json-schema-to-zod.mjs](scripts/lib/json-schema-to-zod.mjs)）
只覆盖契约实际使用的子集：object / array / string / number / integer / boolean / null、`enum`、`const`、
`nullable`、`$defs` 与 `$ref`、`anyOf` / `oneOf` / `allOf`、`additionalProperties`。
遇到无法精确表达的结构（递归 `$ref`、`prefixItems`、`if/then` 等）会带路径报错，提示先扩展转换器与测试，
而不是悄悄生成偏松或偏紧的校验。

### CI 中的契约检查

`.github/workflows/quality.yml` 只运行 `npm run contract:sync -- --check`，**不联网**：
它校验 `contract.json` 的 hash 与 `ref.json` 一致、`contract.json` 是 sync 的规范化格式、
`src/api/generated/contract.ts` 与 `contract.json` 逐字一致。因此 PR 不需要访问 GitHub；
升级契约是显式的 `--ref` 操作，必须在同一提交里更新上述三个文件。

## 本地开发

前端在开发期由 Vite 把 `/api` 代理到本地后端，浏览器视角始终是同源。
`__Host-` 会话 Cookie 要求安全上下文，因此本地必须用 `http://localhost`（不能用局域网 IP）。

```bash
npm install
npm run contract:sync -- --check   # 校验契约快照与生成物一致（不联网）
npm run dev                        # http://localhost:5173
```

## 质量门禁

提交前请依次跑通下列命令，CI（`.github/workflows/quality.yml`）在每次 push 与 PR 上执行相同步骤。

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run contract:sync -- --check
```
