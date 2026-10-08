#!/system/bin/sh
# 把 dsh-github-upload 装进任意 DSH 版本（幂等）。用法： sh 安装.sh [目标版本 files 目录]
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
T="$1"
if [ -z "$T" ]; then
  for c in /data/user/0/com.deepseek.harness.beta/files /data/user/0/com.deepseek.harness/files /data/user/0/com.deepseek.harness.compat/files; do
    [ -d "$c/payload/dshhome" ] && T="$c" && break
  done
fi
[ -n "$T" ] && [ -d "$T/payload/dshhome" ] || { echo "❌ 找不到目标版本（传 <...>/files）"; exit 1; }
H="$T/payload/dshhome"
echo "① SKILL.md → $H/skills/dsh-github-upload/"
mkdir -p "$H/skills/dsh-github-upload"
cp -f "$HERE/SKILL.md" "$H/skills/dsh-github-upload/SKILL.md"
echo "② 工具 → $H/skills/dsh-github-upload/"
cp -f "$HERE"/*.mjs "$H/skills/dsh-github-upload/" 2>/dev/null || true
echo "✅ 完成：$H/skills/dsh-github-upload/"
