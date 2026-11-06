#!/usr/bin/env bash
# 在 Linux web 主机上通过 SSH 执行，只动静态产物；不碰 API、Docker、数据库。
set -Eeuo pipefail
umask 022

operation=${1:?deploy or rollback required}
site_root=/opt/smedc/app
enabled_marker=/opt/smedc/app-enabled
previous_file="$site_root/previous-release"
pending=""
archive=""
old_target=""
armed=0

case "$operation" in deploy|rollback) ;; *) exit 64 ;; esac
test -d "$site_root"
# 与官网、服务发布共用同一把主机锁，避免三个发布流程同时改 Nginx root。
exec 9>/opt/smedc/deploy.lock
flock -n 9 || exit 75

validate_target() {
  [[ "$1" =~ ^releases/[a-zA-Z0-9.-]+$ ]] && test -s "$site_root/$1/index.html"
}

switch_target() {
  rm -f "$site_root/current-next"
  ln -s "$1" "$site_root/current-next"
  mv -Tf "$site_root/current-next" "$site_root/current"
}

cleanup() {
  local status=$?
  trap - EXIT
  if [ "$status" -ne 0 ] && [ "$armed" -eq 1 ]; then
    if [ -n "$old_target" ]; then
      switch_target "$old_target" || { echo "App site restore failed." >&2; exit 1; }
    else
      rm -f "$site_root/current"
    fi
  fi
  if [ -n "$pending" ]; then rm -rf "$pending"; fi
  if [ -n "$archive" ]; then rm -f "$archive"; fi
  rm -f "$site_root/previous-release.next" "$site_root/current-next"
  exit "$status"
}
trap cleanup EXIT

if [ -L "$site_root/current" ]; then
  old_target=$(readlink "$site_root/current")
  validate_target "$old_target"
else
  # 不覆盖非本流程管理的目录或文件。
  test ! -e "$site_root/current"
fi

verify() {
  # 首次启用前只交付文件，不宣称公网可用。
  if [ ! -f "$enabled_marker" ]; then return 0; fi
  local base=https://app.smedatacenter.xyz
  curl -fsS --max-time 15 "$base/" | grep -q 'id="root"'
  local asset assets status
  assets=$(grep -o '/assets/[^"]*\.\(js\|css\)' "$site_root/current/index.html" | sort -u || true)
  for asset in $assets; do
    curl -fsS --max-time 15 -o /dev/null "$base$asset"
  done
  # 代理必须真的把请求送到后端：无会话读会话应得 401，设备授权页缺参数应得 400。
  status=$(curl -sS --max-time 15 -o /dev/null -w '%{http_code}' "$base/api/web/v1/session")
  test "$status" = 401
  status=$(curl -sS --max-time 15 -o /dev/null -w '%{http_code}' "$base/oauth/device/verify")
  test "$status" = 400
  # 未知路径交给 SPA，而不是 Nginx 404。
  curl -fsS --max-time 15 -o /dev/null "$base/definitely-not-a-route"
}

if [ "$operation" = rollback ]; then
  target=$(cat "$previous_file")
  validate_target "$target"
  armed=1
  switch_target "$target"
  verify
else
  tag=${2:?full commit SHA required}
  incoming=${3:?archive required}
  digest=${4:?SHA256 required}
  [[ "$tag" =~ ^[a-f0-9]{40}$ ]]
  [[ "$incoming" =~ ^/tmp/smedc-app-[a-f0-9]{40}-[0-9]+-[0-9]+\.tar\.gz$ ]]
  [[ "$digest" =~ ^[a-f0-9]{64}$ ]]
  archive=$incoming
  printf '%s  %s\n' "$digest" "$archive" | sha256sum --check --status
  mkdir -p "$site_root/releases"
  pending=$(mktemp -d "$site_root/releases/$tag.XXXXXX")
  tar --no-same-owner -xzf "$archive" -C "$pending"
  test -z "$(find "$pending" -type l -print -quit)"
  test -s "$pending/index.html"
  test -n "$(find "$pending/assets" -name '*.js' -print -quit)"
  test -n "$(find "$pending/assets" -name '*.css' -print -quit)"
  printf '%s\n' "$tag" > "$pending/release-commit.txt"
  chmod -R a+rX "$pending"
  armed=1
  switch_target "releases/$(basename "$pending")"
  verify
  # 校验通过后才更新回滚指针。
  printf '%s\n' "$old_target" > "$site_root/previous-release.next"
  mv -Tf "$site_root/previous-release.next" "$previous_file"
  pending=""
fi
armed=0
printf 'App site %s completed: %s\n' "$operation" "$(readlink "$site_root/current")"
