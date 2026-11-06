# app 站点发布与回滚

本仓库只管理 `app.smedatacenter.xyz` 的静态产物与该站点的 Nginx 配置。API、数据库、业务密钥、
`api` 站点与 `runtime.env` 仍由 [SME_DATA_CENTER](https://github.com/YinXiaoyu-1998/SME_DATA_CENTER) 管理。
不新增常驻服务、镜像仓库或第二个后端。

## 主机布局

| 路径                                          | 内容                                   |
| --------------------------------------------- | -------------------------------------- |
| `/opt/smedc/app/releases/<完整提交SHA>/`      | 每次构建的完整静态产物，只追加不覆盖   |
| `/opt/smedc/app/current`                      | 指向某个 release 的软链，Nginx 的 root |
| `/opt/smedc/app/previous-release`             | 上一次成功发布的目录名，用于回滚       |
| `/etc/nginx/sites-available/smedc-app.conf`   | `deploy/nginx-app.conf`                |
| `/etc/nginx/snippets/smedc-app-security.conf` | `deploy/security-headers.conf`         |
| `/var/www/smedc-acme`                         | Certbot webroot，与官网共用            |

`deploy/nginx-app.conf` 里的转发前缀是契约的一部分：`/api/web/v1/`、`/oauth/device/`、`/auth/password/`。
少写一个，线上就是 404；多写一个，等于把 MCP 面暴露到网页域。

## 首次启用（需单独授权的主机操作）

以下步骤是准备说明，不是已执行记录。执行前先确认 app 证书、DNS 与发布窗口。

1. 核对 `app.smedatacenter.xyz` 的 A 记录指向当前主机，80/443 可达。
2. 备份现有 Nginx 配置。把 `deploy/nginx-app-bootstrap.conf` 安装为独立站点，`nginx -t` 通过后 reload。
   它只开放 ACME challenge，其余路径 404；此时 API 站点与其他站点不受影响。
3. 用现有 Certbot 申请 **app 单独一张证书**（不要动 api 的证书）：
   `sudo certbot certonly --webroot -w /var/www/smedc-acme --cert-name app.smedatacenter.xyz -d app.smedatacenter.xyz`
   核对证书 SAN 与续期任务；续期后需要 `nginx -t && systemctl reload nginx` 的 deploy hook。
4. 安装 `deploy/security-headers.conf` 到 `/etc/nginx/snippets/smedc-app-security.conf`，
   再用 `deploy/nginx-app.conf` 替换 bootstrap 配置（二者不能同时启用）。`nginx -t` 通过后 reload。
5. 发布第一个版本（见下节）。`/opt/smedc/app/current/index.html` 存在之后站点才算可用。

## 发布

```bash
# 本地或 CI 构建，产物必须与本仓库某个完整提交 SHA 对应
npm ci && npm run contract:sync -- --check && npm run build

# 上传到主机（需要已获准的部署用户）
sha=$(git rev-parse HEAD)
tar -C dist -czf "/tmp/app-${sha}.tar.gz" .
scp "/tmp/app-${sha}.tar.gz" deploy@HOST:/tmp/

# 在主机执行：解包 → 校验 → 记录版本 → 原子切换
ssh deploy@HOST "bash -s -- $sha" <<'REMOTE'
set -euo pipefail
sha="$1"; src="/tmp/app-$sha.tar.gz"; dir="/opt/smedc/app/releases/$sha"
test -s "$src"
test -f "$dir/.complete" && { echo "already published"; exit 0; }
mkdir -p "$dir"
tar -C "$dir" -xzf "$src"
test -f "$dir/index.html" && test -d "$dir/assets"
printf '%s\n' "$sha" > "$dir/release-commit.txt"
: > "$dir/.complete"
if [ -L /opt/smedc/app/current ]; then readlink -f /opt/smedc/app/current | xargs basename > /opt/smedc/app/previous-release; fi
ln -sfn "$dir" /opt/smedc/app/current.new && mv -Tf /opt/smedc/app/current.new /opt/smedc/app/current
REMOTE

# 校验
curl -fsS -o /dev/null -w '%{http_code}\n' https://app.smedatacenter.xyz/
```

`mv -Tf` 保证软链切换是原子的；切换前先写 `previous-release`，所以失败时回滚只是一次反向切换。

## 回滚

```bash
ssh deploy@HOST 'bash -s' <<'REMOTE'
set -euo pipefail
prev=$(cat /opt/smedc/app/previous-release)
test -d "/opt/smedc/app/releases/$prev"
ln -sfn "/opt/smedc/app/releases/$prev" /opt/smedc/app/current.new && mv -Tf /opt/smedc/app/current.new /opt/smedc/app/current
REMOTE
```

回滚只切静态产物，不重启服务、不回滚数据库、不动 api 站点。历史版本不自动删除；
清理时至少保留 `current` 与 `previous-release` 指向的目录。

## 验收清单

- `https://app.smedatacenter.xyz/` 返回 SPA 首页，`/assets/*` 带 `immutable` 缓存头且 200。
- 未登录打开 `/admin/<orgId>/permissions` 跳到 `/login`，登录后回到原路径。
- 接口请求走同源 `/api/web/v1/*`；响应带 `cache-control: no-store`。
- `/oauth/device/verify?user_code=...` 与 `/auth/password/setup#token=...` 仍能由后端渲染并完成流程。
- 未知路径返回 SPA 的 404 页面，而不是 Nginx 404。
- `api.smedatacenter.xyz/healthz` 仍为 200，MCP 与 Launcher 不受影响。

## 自动发布

工作流：Actions → **Deploy app site** → 选择 `main` → 操作 `deploy` 或 `rollback`。

**只有手动触发会发布**；普通 push 与 PR 合并都不会动线上。要改成合并即发布，再给工作流加
`push: branches: [main]`，并先确认 `APP_DEPLOY_ENABLED` 门禁与回滚演练都已就绪。

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

1. 手动触发后先运行本仓库的 `quality` 工作流（格式、lint、类型、测试、构建、契约校验）。
2. 校验本次选择的提交仍是当前 `main`，防止重跑旧工作流覆盖新版本。
3. `npm ci` + `contract:sync -- --check` + `build`，打包 `app.tar.gz`。
4. SSH 上传并按 SHA-256 校验；`scripts/deploy-remote.sh` 在主机锁内解包到
   `/opt/smedc/app/releases/<sha>.<suffix>`，验证必需文件，记录 `release-commit.txt`，原子切换 `current`。
5. 存在 `/opt/smedc/app-enabled` 标记时做公网校验，失败自动恢复原 `current` 并保留原回滚指针。
6. 校验通过后才更新 `previous-release`。

公网校验除了首页与静态资源，还断言两件「配置是否真的通了」的事：
`/api/web/v1/session` 无会话返回 **401**（代理到达后端），`/oauth/device/verify` 缺参数返回 **400**（服务端渲染页面被正确转发）。

### 回滚

在同一工作流选择 `main` → `rollback`：只恢复本仓库上一次成功发布前的目录并重新校验，
不运行构建、不重启服务、不回滚数据库。历史静态版本不自动删除；清理时至少保留
`current` 与 `previous-release` 指向的目录。

### 首次启用顺序

1. 按上文的首次启用步骤装好 Nginx 与证书，但**先不要**创建 `app-enabled` 标记。
2. 配置好 Environment 变量与密钥后手动跑一次 `deploy`；此时只交付静态文件并切换 `current`，不做公网校验。
3. 逐条走验收清单，确认无误后创建空标记 `/opt/smedc/app-enabled`（root 所有）。
4. 之后再发布就会自动做公网校验与失败回滚。

配置通过与本地测试都不代表线上已经验收；切换入口与退役旧链接仍需单独授权。
