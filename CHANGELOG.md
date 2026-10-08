# 更新记录 · dsh-github-upload

## 1.0.0 — 2026-10-08
- 首个版本：`github-upload.mjs`（`check` / `files` / `new` / `upload` / `delete`）
- 走 Contents API：自动判断新建/覆盖（取 sha）、`--only` 白名单、跳过 .git/tgz/log/缓存
- 免 token 也能 `files` 核对公开仓库
- 实测坑写进 SKILL.md：梯子/链路层、safe.directory、App 无上传、网页压平目录、WebView 要粘贴
