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

## 本地开发

前端在开发期由 Vite 把 `/api` 代理到本地后端，浏览器视角始终是同源。
`__Host-` 会话 Cookie 要求安全上下文，因此本地必须用 `http://localhost`（不能用局域网 IP）。

```bash
npm install
npm run contract:sync     # 从后端契约生成本地类型（F1 批次提供）
npm run dev               # http://localhost:5173
```

## 质量门禁

提交前请依次跑通下列命令，CI（`.github/workflows/quality.yml`）在每次 push 与 PR 上执行相同步骤。

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```
