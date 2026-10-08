---
name: dsh-github-upload
description: Use when the user wants to upload/publish a project, skill, or any folder to GitHub — 「传到 GitHub」「推上去」「建个仓库」「更新仓库里的文件」. Uploads via the GitHub Contents API (no git, no browser clicking), with a screen-tap/browser fallback when no token is available.
---

# 上传 GitHub（给 DSH 用的上传器）

> 用户一句话对应一条命令：**「把这个传到 GitHub」** = `upload`；**「建个仓库」** = `new`；**「看看传上去没」** = `files`。
> **不用 git、不用手机网页点来点去** —— 走 GitHub Contents API。

```sh
node github-upload.mjs check                                   # 验 token
node github-upload.mjs new dsh-xxx                             # 建仓库（需 token）
node github-upload.mjs upload wang1293965662-ai/dsh-xxx ./dsh-xxx
node github-upload.mjs files wang1293965662-ai/dsh-xxx         # 数一遍（公开仓库免 token）
node github-upload.mjs meta wang1293965662-ai/dsh-xxx --desc "说明" --topics dsh,dns
node github-upload.mjs release wang1293965662-ai/dsh-xxx v1.0.0 "标题"
```

## token 从哪来（一次配置，之后全自动）

优先顺序：`GH_TOKEN` 环境变量 → `~/.dsh-gh-token` → `/sdcard/gh-token.txt`。

拿 token（30 秒，直达链接已带好 `repo` 权限）：

```
https://github.com/settings/tokens/new?scopes=repo&description=dsh-upload
```
→ 拉到底点 **Generate token** → 复制 `ghp_...`
→ **让用户点"复制"后，AI 用剪贴板读出**（`android_clipboard` read），写进 `/sdcard/gh-token.txt`：
```sh
printf '%s' '<token>' > /sdcard/gh-token.txt && chmod 600 /sdcard/gh-token.txt
```
> ⚠️ **不要在聊天里显示 token**，也不要写进记忆档。用完让用户随时在那个页面点 Delete 撤销。

## 无 token 时的兜底（屏幕路线）

1. **建文件**：地址栏打开 `https://github.com/<owner>/<repo>/new/main?filename=<路径>`（**带斜杠会自动建文件夹**）
2. 点编辑区 → 用 `android_type(paste:true)` 粘贴（WebView 编辑器必须走粘贴，setText 不触发前端）
3. 拉到底 → 点绿色 **Commit changes**
4. **传多文件**：网页 `…/upload/main` 只接受**平铺**的多选；带子目录的必须在第 1 步里手动打路径 —— 所以**能用 API 就别用屏幕**。

## 实测坑（都踩过）

| 现象 | 原因 / 解法 |
|---|---|
| `Could not resolve host: github.com` | 梯子没覆盖 App。**DNS 修不了链路层**（见 `dsh-dns` 技能）；要 VPN 全局或把 DSH 加进代理名单 |
| `/sdcard` 上 git 报 `dubious ownership` | `git config --global --add safe.directory '<目录>'`（API 路线根本不用 git） |
| GitHub 手机 App 找不到上传 | **App 没有上传功能**，只能看/改；上传走 API 或浏览器 |
| 网页多选上传后目录被压平 | 浏览器不给传文件夹 → 用 API（本工具）或逐个"新建文件"打路径 |
| `HTTP 403` | token 没勾 `repo`；或对别人的仓库没权限 |
| 推送/上传卡在登录 | 别用账号密码，**用 token** |

## 收尾（每次都做）

1. `files` 数一遍，跟本地清单对比（少了哪个当场补）
2. 告诉用户仓库网址 + 文件数
3. 记进记忆档：仓库地址、传了什么、没传什么
