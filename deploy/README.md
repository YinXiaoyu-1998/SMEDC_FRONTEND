# app 站点发布与回滚

本仓库只管理 `app.smedatacenter.xyz` 的静态产物与该站点的 Nginx 配置。API、数据库、业务密钥、
`api` 站点与 `runtime.env` 仍由 [SME_DATA_CENTER](https://github.com/YinXiaoyu-1998/SME_DATA_CENTER) 管理。
不新增常驻服务、镜像仓库或第二个后端。

## 主机布局

| 路径                                            | 内容                                   |
| ----------------------------------------------- | -------------------------------------- |
| `/opt/smedc/app/releases/<完整提交SHA>.<后缀>/` | 每次构建的完整静态产物，只追加不覆盖   |
| `/opt/smedc/app/current`                        | 指向某个 release 的软链，Nginx 的 root |
| `/opt/smedc/app/previous-release`               | 相对于站点根目录的上一版目标，用于回滚 |
| `/etc/nginx/sites-available/smedc-app.conf`     | `deploy/nginx-app.conf`                |
| `/etc/nginx/snippets/smedc-app-security.conf`   | `deploy/security-headers.conf`         |
| `/var/www/smedc-acme`                           | Certbot webroot，与官网共用            |

公开认证页面的路径保持稳定。`/oauth/device/verify`、`/auth/password/setup` 和 `/auth/password/setup/form` 由 SPA 接管；`/api/web/v1/` 和旧版表单提交继续转发到后端。

## 首次启用（需单独授权的主机操作）

线上首次启用前确认发布窗口、前后端配对版本及上一版服务的回退点。

1. 备份现有 Nginx 配置。把 `deploy/nginx-app-bootstrap.conf` 安装为独立站点，`nginx -t` 通过后 reload。
   此站点只开放 ACME challenge。
2. 添加并核对 `app.smedatacenter.xyz` 的 A 记录指向当前主机，确认 80/443 可达。
3. 用现有 Certbot 申请 **app 单独一张证书**（不要动 api 的证书）：
   `sudo certbot certonly --webroot -w /var/www/smedc-acme --cert-name app.smedatacenter.xyz -d app.smedatacenter.xyz`
   核对证书 SAN 与续期任务；续期后需要 `nginx -t && systemctl reload nginx` 的 deploy hook。
4. 安装 `deploy/security-headers.conf` 到 `/etc/nginx/snippets/smedc-app-security.conf`，
   再用 `deploy/nginx-app.conf` 替换 bootstrap 配置（二者不能同时启用）。`nginx -t` 通过后 reload。
5. 通过下文「发布与回滚」工作流交付第一个版本，核对 `current` 指向已校验的产物后再安排后端切换。

## 验收清单

- `https://app.smedatacenter.xyz/` 返回 SPA 首页，`/assets/*` 带 `immutable` 缓存头且 200。
- 未登录打开 `/admin/<orgId>/permissions` 跳到 `/login`，登录后回到原路径。
- 接口请求走同源 `/api/web/v1/*`；响应带 `cache-control: no-store`。
- 用合成账户验证设备授权与 Launcher 轮询，以及首次设密码、重置密码和旧链接。原路径应显示 React 认证页面。
- 未知路径返回 SPA 的 404 页面，而不是 Nginx 404。
- `api.smedatacenter.xyz/healthz` 仍为 200，MCP 与 Launcher 不受影响。

## 发布与回滚

工作流：Actions → **Deploy app site** → 选择 `main` → 操作 `deploy` 或 `rollback`。

仓库级变量 `APP_AUTO_DEPLOY=true` 允许合并到 `main` 后自动发布。发布前先运行同一提交的质量检查。手动发布和回滚仍从 `main` 触发。需要用 SSH 手工恢复时，同样从已审阅的前端版本调用 `scripts/deploy-remote.sh`，沿用工作流的参数及主机校验。脚本统一管理相对路径的版本软链和回退指针。

### GitHub Environment

在仓库设置里建 `app-production` Environment，按套餐能力限制为 `main` 并配置所需审核人。

| 类型     | 名称                  | 配置                                                                      |
| -------- | --------------------- | ------------------------------------------------------------------------- |
| Variable | `APP_DEPLOY_ENABLED`  | 完成主机准备后设为 `true`；未配置时工作流失败关闭                         |
| Variable | `APP_HOST`            | 当前主机 `39.96.66.185`，换主机须重新核实并更新 `deploy/known_hosts`      |
| Variable | `APP_SSH_USER`        | 已获准的部署用户，须能写 `/opt/smedc/app` 并获取 `/opt/smedc/deploy.lock` |
| Secret   | `APP_SSH_PRIVATE_KEY` | 从获准的密钥管理渠道配置；不要复用官网的 key                              |

主机需要 Bash、GNU tar/coreutils、flock、curl 与已有 SSH/Nginx/TLS。`deploy/known_hosts`
保留已核实的主机公钥，SSH 使用严格主机校验，不在 CI 临时信任扫描结果。

### 发布事务

1. 自动发布和手动 deploy 先运行本仓库的 `quality` 工作流（格式、lint、类型、测试、构建、契约校验）。
2. 校验本次选择的提交仍是当前 `main`，防止重跑旧工作流覆盖新版本。
3. `npm ci` + `contract:sync -- --check` + `build`，打包 `app.tar.gz`。
4. SSH 上传并按 SHA-256 校验；`scripts/deploy-remote.sh` 在主机锁内解包到
   `/opt/smedc/app/releases/<sha>.<suffix>`，验证必需文件，记录 `release-commit.txt`，原子切换 `current`。
5. 存在 `/opt/smedc/app-enabled` 标记时做公网校验，失败自动恢复原 `current` 并保留原回滚指针。
6. 校验通过后才更新 `previous-release`。

公网校验检查首页、静态资源和普通会话接口。认证入口切换后，三条原路径都应返回 SPA，
两个新会话接口都应返回明确的 **400** JSON 错误。切换前仍接受设备授权旧入口的 **400**。

### 认证入口切换

1. 先发布支持新增 JSON 认证接口的 API，保留旧 HTML 和提交路由。
2. 发布包含 React 认证页的静态产物。
3. 安装匹配的 app Nginx 配置，运行 `nginx -t` 后 reload，再完成认证验收。
4. 若需退回旧前端版本，先恢复 app Nginx 的旧路由并 reload，再回滚静态产物或 API。

### 回滚

在同一工作流选择 `main` → `rollback`：只恢复本仓库上一次成功发布前的目录并重新校验，
不运行构建、不重启服务、不回滚数据库。历史静态版本不自动删除；清理时至少保留
`current` 与 `previous-release` 指向的目录。

### 首次启用顺序

1. 按上文的首次启用步骤装好 Nginx 与证书，但**先不要**创建 `app-enabled` 标记。
2. 配置好 Environment 变量与密钥后手动跑一次 `deploy`；此时只交付静态文件并切换 `current`，不做公网校验。
3. 先检查新站的 HTTPS、首页与静态资源，再按服务仓发布手册单独授权并手动切换后端。
4. 两端切换后逐条走验收清单，包括密码兑换、设备授权及台账 PDF 预览。通过后创建空标记 `/opt/smedc/app-enabled`（root 所有），再开启 `APP_AUTO_DEPLOY`。此后发布脚本会检查公网并在失败时恢复上一版静态产物。
5. 首次切换失败时，从服务仓回退上一版后端和配置以恢复旧网页入口。后续静态版本回退使用同一前端工作流。

配置通过与本地测试都不代表线上已经验收；切换入口与退役旧链接仍需单独授权。

网页注册分两个独立文档。安装匹配的两个站点配置后，确认官方应用域的 `/register` 允许阿里云验证码 2.0 中国内地节点（V2 接入），`/register/verify` 和 `/login` 仍使用原 CSP。公共 API 域名的 registration 前缀应返回 404。确认真实邮箱收码、建组织和重新登录后再放量。
