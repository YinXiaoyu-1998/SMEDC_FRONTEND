# SMEDC 前端

独立构建、独立发布的网页前端，只通过 `/api/web/v1` 契约访问后端。后端仓库是 [SME_DATA_CENTER](https://github.com/YinXiaoyu-1998/SME_DATA_CENTER)。

## 边界

- 不消费后端渲染的 HTML；设备授权与设密码两个页面仍由后端渲染，本项目不实现它们。
- 后端域名绝不出现在前端代码里：接口一律走相对路径 `/api/web/v1`，由 Nginx 同源转发。
- 认证与授权判断只在服务端。前端只根据服务端返回的 `canManageSettings` 做导航显示，不自行推导角色或权限。
- 会话只存在于 `__Host-` HttpOnly Cookie 里。禁止把身份、密码、令牌或草稿写入 localStorage/sessionStorage；只有语言偏好可以持久化。

## 契约

- `src/api/generated/` 与 `contract/` 由 `npm run contract:sync -- --ref <sha>` 生成，禁止手改。
- 后端接口变化时：先在后端仓改 `packages/web-api-contract`，再在这里重新同步并提交生成物。
- `npm run contract:sync -- --check` 在 CI 里校验生成物与 `contract.json` 一致。

## 界面约定

- 文案一律 `{zh, en}` 元组，默认中文；业务名称原样显示不翻译。
- 草稿只留在内存；版本冲突时保留草稿并要求显式比较与重新确认，不自动覆盖或重试。
- 按钮在无有效改动或前置条件不足时置灰；请求中保留原文案并在左侧显示圆形指示器；取消确认不提交。
- 样式用 CSS Modules + `src/styles/tokens.css`；不要引入 UI 框架或状态库。

## 命令

```bash
npm run dev                  # http://localhost:5173，/api 代理到 127.0.0.1:3000
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run contract:sync -- --check
```

## 发布

- 见 `deploy/README.md`。静态产物发布到 `/opt/smedc/app/releases/<sha>`，`current` 软链原子切换。
- 部署需要单独授权；PR 与合并都不代表已上线。
