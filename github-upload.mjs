#!/usr/bin/env node
/**
 * github-upload.mjs —— 不用 git、不用网页点击，直接把一个目录传到 GitHub
 * 走 GitHub Contents API（建仓库 / 传文件 / 列文件 / 查 token）。**给 DSH 用的上传器。**
 *
 * 用法：
 *   node github-upload.mjs check                          # 验 token（GET /user）
 *   node github-upload.mjs files <owner/repo>             # 列远端文件（公开仓库免 token）
 *   node github-upload.mjs new <repo> [--private]         # 建仓库（需 token）
 *   node github-upload.mjs upload <owner/repo> <本地目录> [远端前缀] [--only a.md,b/c.js]
 *   node github-upload.mjs delete <owner/repo> <路径>
 *
 * token 从哪来（按顺序找）：环境变量 GH_TOKEN → ~/.dsh-gh-token → /sdcard/gh-token.txt → 剪贴板（由 AI 用 android_clipboard 读出来传进来）
 * 常见错：401/403 = token 不对或没勾 repo；ENOTFOUND/TLS = 梯子没覆盖 App（DNS 层修不了，见 dsh-dns 技能）
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const API = 'https://api.github.com';
const SKIP = /(^\.git$|^node_modules$|\.tgz$|\.log$|^dns缓存\.json$)/;
function token() {
  const cands = [process.env.GH_TOKEN, path.join(os.homedir(), '.dsh-gh-token'), '/sdcard/gh-token.txt', '/data/user/0/com.deepseek.harness.beta/files/Lite/gh-token.txt'];
  for (const c of cands) { try { if (c && fs.existsSync(c)) { const t = fs.readFileSync(c, 'utf8').trim(); if (t) return t; } } catch (e) {} }
  return process.env.GH_TOKEN || '';
}
const H = (t) => ({ Authorization: 'Bearer ' + t, Accept: 'application/vnd.github+json', 'User-Agent': 'dsh-github-upload', 'X-GitHub-Api-Version': '2022-11-28' });
const die = (m) => { console.error('❌ ' + m); process.exit(1); };

const [cmd, ...args] = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const has = (n) => args.includes(n);

if (!cmd || cmd === '--help' || cmd === '-h') {
  console.log(`用法：
  node github-upload.mjs check
  node github-upload.mjs files <owner/repo>
  node github-upload.mjs new <repo> [--private]
  node github-upload.mjs upload <owner/repo> <本地目录> [远端前缀] [--only a.md,b/c.js]
  node github-upload.mjs delete <owner/repo> <路径>`);
  process.exit(0);
}

if (cmd === 'check') {
  const t = token();
  if (!t) die('没找到 token（GH_TOKEN / ~/.dsh-gh-token / /sdcard/gh-token.txt）');
  const r = await fetch(API + '/user', { headers: H(t) });
  if (!r.ok) die('token 无效或没权限：HTTP ' + r.status + ' ' + (await r.text()).slice(0, 100));
  const u = await r.json();
  console.log('✅ token 有效：' + u.login);
} else if (cmd === 'files') {
  const repo = args[0] || die('要 owner/repo');
  const t = token();
  const out = [];
  (async function walk(p) {
    const r = await fetch(API + '/repos/' + repo + '/contents/' + encodeURI(p), { headers: t ? H(t) : { Accept: 'application/vnd.github+json', 'User-Agent': 'dsh-github-upload' } });
    if (!r.ok) die('列目录失败：HTTP ' + r.status + '（' + p + '）');
    for (const e of await r.json()) { if (e.type === 'dir') await walk(e.path); else out.push(e.path + '  (' + e.size + 'B)'); }
  })('').then(() => { console.log('远端共 ' + out.length + ' 个文件：'); out.forEach((x) => console.log('  ' + x)); });
} else if (cmd === 'new') {
  const repo = args[0] || die('要仓库名');
  const t = token() || die('建仓库要 token');
  const r = await fetch(API + '/user/repos', { method: 'POST', headers: H(t), body: JSON.stringify({ name: repo, private: has('--private'), auto_init: false }) });
  if (r.status === 201) { const j = await r.json(); console.log('✅ 建好了：' + j.full_name); }
  else die('建仓库失败：HTTP ' + r.status + ' ' + (await r.text()).slice(0, 140));
} else if (cmd === 'upload') {
  const repo = args[0], dir = args[1]; const prefix = (args[2] && !args[2].startsWith('--')) ? args[2] : '';
  if (!repo || !dir) die('要 <owner/repo> <本地目录>');
  const t = token() || die('上传要 token（GH_TOKEN / /sdcard/gh-token.txt）');
  const only = (flag('--only') || '').split(',').map((x) => x.trim()).filter(Boolean);
  const files = [];
  (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (SKIP.test(e.name)) continue; const p = path.join(d, e.name); e.isDirectory() ? walk(p) : files.push(p); } })(dir);
  let ok = 0, fail = 0;
  for (const f of files) {
    const rel = (prefix ? prefix + '/' : '') + path.relative(dir, f).split(path.sep).join('/');
    if (only.length && !only.includes(rel)) continue;
    let sha = null;
    const g = await fetch(API + '/repos/' + repo + '/contents/' + encodeURI(rel), { headers: H(t) });
    if (g.status === 200) sha = (await g.json()).sha;
    const r = await fetch(API + '/repos/' + repo + '/contents/' + encodeURI(rel), { method: 'PUT', headers: H(t), body: JSON.stringify({ message: (sha ? 'update ' : 'add ') + rel, content: fs.readFileSync(f).toString('base64'), ...(sha ? { sha } : {}) }) });
    if (r.ok) { ok++; console.log('✅ ' + rel + (sha ? '（覆盖）' : '（新建）')); }
    else { fail++; console.log('❌ ' + rel + ' → HTTP ' + r.status + ' ' + (await r.text()).slice(0, 120)); }
  }
  console.log('\n成功 ' + ok + ' · 失败 ' + fail);
} else if (cmd === 'delete') {
  const repo = args[0], p = args[1]; const t = token() || die('要 token');
  const g = await fetch(API + '/repos/' + repo + '/contents/' + encodeURI(p), { headers: H(t) });
  if (!g.ok) die('找不到 ' + p);
  const sha = (await g.json()).sha;
  const r = await fetch(API + '/repos/' + repo + '/contents/' + encodeURI(p), { method: 'DELETE', headers: H(t), body: JSON.stringify({ message: 'delete ' + p, sha }) });
  console.log(r.ok ? '✅ 删了 ' + p : '❌ HTTP ' + r.status);
} else die('未知命令：' + cmd);
