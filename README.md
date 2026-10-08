# dsh-github-upload · 上传 GitHub（给 DSH 用的上传器）

> 一句话：**把任意目录/技能包直接传到 GitHub** —— 不用 git、不用手机网页点点点，走 GitHub Contents API。

## 装

```sh
sh 安装.sh                     # 装进任意 DSH 版本（自己推导 DSH_HOME）
```

## 用

```sh
node github-upload.mjs check                                   # 验 token
node github-upload.mjs new dsh-xxx [--private]                 # 建仓库
node github-upload.mjs upload wang1293965662-ai/dsh-xxx ./dsh-xxx [远端前缀] [--only a.md,b/c.js]
node github-upload.mjs files wang1293965662-ai/dsh-xxx         # 列远端（公开仓库免 token）
node github-upload.mjs meta <owner/repo> --desc "..." --topics a,b,c   # 填 About/Topics
node github-upload.mjs release <owner/repo> v1.0.0 [标题]              # 打版本标签
node github-upload.mjs delete wang1293965662-ai/dsh-xxx path/to/file
```

## token（一次配置）

```
https://github.com/settings/tokens/new?scopes=repo&description=dsh-upload
```
→ Generate token → 复制 → 存到 `/sdcard/gh-token.txt`（或 `GH_TOKEN` 环境变量）。

## 权限与安全

- 只用 **classic token + `repo`**，不需要别的 scope
- token 只存在本地文件 / 环境变量，**不写进日志、不显示在聊天里**
- 用完可在 token 页面点 **Delete** 撤销

## 文件

```
github-upload.mjs   主工具（check / files / new / upload / delete）
SKILL.md            DSH 技能说明书（何时用、屏幕兜底路线、实测坑）
安装.sh             幂等安装
```

## 许可

MIT（见 LICENSE）。
