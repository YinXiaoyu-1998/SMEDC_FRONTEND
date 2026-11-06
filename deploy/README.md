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

## 尚未自动化

自动发布工作流（构建产物 → `current` 切换 → 公网校验 → 失败自动回滚）尚未落地。
落地前按上面的手工步骤执行，并遵守服务仓库的发布授权边界。
