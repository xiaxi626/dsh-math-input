# 验证插件装载契约（plugin add → dsh web 冷启动 → UI）

[English](./verify-plugin-install.md) | **中文**

本指南验证 **插件装载契约**——真实用户从 GitHub 或 npm 安装本插件时走的完整路径：

- **A. 安装注册** —— `dsh plugin --profile <name> add` 安装本包后，reconcile 依据
  `package.json` 的 `dsh.bundle.patch: cordis.patch.yml` 声明，把本包追加进 profile 的
  `dsh.profile.bundles` 层。

- **B. 冷启动加载** —— `dsh web` 启动时，`cordis.patch.yml` 的 `insert` 条目以**裸包名**
  交给 cordis 加载器，经 Node 模块解析命中 profile `node_modules` 中的包，由 `main` /
  `exports["."]` 加载 `lib/index.js`（Host 入口）。

- **C. Client 发现** —— 浏览器端通过 `package.json` 的 `dsh.client` 清单发现，不走
  Host 入口。`dsh.client` 缺失或格式错误时 Host 正常加载但 "+" 按钮不出现。

契约由三处共同构成，缺一不可：

1. `cordis.patch.yml` 的 entry 必须是**裸包名**（`dsh-math-input`）——相对路径会被锚定到
   profile 根目录解析，指向结构性不存在的 `<profile>/lib/index.js`；
2. `package.json` 必须有 `main` 与 `exports["."]` 指向 `lib/index.js`（Host 入口加载）；
3. `package.json` 必须有 `dsh.client` 清单（浏览器端发现）。

破坏 (1) 或 (2)，`dsh web` 冷启动即报 `ERR_MODULE_NOT_FOUND`、整个插件树加载失败。
破坏 (3)，服务器正常启动但 "+" 按钮不出现——Host 加载了但 Client 未被发现。

> **为什么 overlay 冒烟测试覆盖不了这些**：`overlay.yml` 以**绝对路径**注入 Host 入口，
> 完全绕过 `node_modules` 解析。它无法发现 `main`/`exports` 契约被破坏或 `dsh.client`
> 清单缺失。本指南是唯一测试真实安装路径的手段。

## 与真实 `~/.dsh` 的关系（先读）

- **本流程会写入你真实的** **`~/.dsh/profiles/web/`**（安装、启动、卸载）。这是无法
  用临时 `DSH_HOME` 替代的：被验证的恰恰是真实 profile 的装载链路。

- **不需要访问 GitHub**：用本地 `file:` 源代替 `github:` 规格；`file:` 之后的一切实例化
  步骤与真实安装完全一致——pnpm 装入 profile 的 `node_modules` → reconcile 注册 bundle
  → 冷启动解析。

- 结尾的清理步骤把 profile 恢复原状（仅剩基础 bundle）。

## 前置条件

- Node.js ≥ 20（`package.json` 的 `engines`），`npx` 可用，能访问 npm registry

- 已 checkout 本仓库；若改过 `src/`，先 `npm run build`（装载的是 `lib/` 产物）

- 本机存在 `web` profile（跑过一次 `dsh web` 即会自动初始化）

***

## 第一部分 — 质量门禁（静态检查契约）

```bash
npm run typecheck   # tsc --noEmit（strict）
npm run lint        # ESLint 9 + typescript-eslint
npm test            # node:test + tsx——期望：全部用例通过
npm run build       # tsdown + tsc → lib/
```

契约三项静态检查（任一不满足即为回归）：

```bash
grep -n "name:" cordis.patch.yml      # 期望：name: dsh-math-input——裸包名，无 './' 前缀
grep -n '"main":' package.json        # 期望："main": "lib/index.js"
grep -n '"\.":' package.json          # 期望：exports 含 "."，指向 "./lib/index.js"
grep -n '"client"' package.json       # 期望：dsh.client 清单存在
```

***

## 第二部分 — 端到端验证（本地源代替 GitHub）

推送前远端提交可能还不存在，`github:` 安装会失败。用本地工作区作包源。
**`file:`** **之后的一切实例化步骤与真实** **`github:`** **安装完全一致**：pnpm 装入 profile 的
`node_modules` → reconcile 注册 bundle → 冷启动解析 → 经 `dsh.client` 发现 Client。

每个平台一个可整体复制的命令块。把 `PROJECT` 换成你的检出路径。

### Windows（Git Bash / MINGW64）

```bash
PROJECT="$(cygpath -m ~/Downloads/dsh-math-input)"   # ← 你的路径（正斜杠）
cd "$PROJECT"

echo "--- [a] 安装本地包 ---"
npx @deepseek-ai/dsh plugin --profile web add "file:$PROJECT"; echo "exit=$?"

echo "--- [b] 确认注册进 bundles 层 ---"
cat ~/.dsh/profiles/web/package.json
# 期望：dsh.profile.bundles 含 "dsh-math-input"，dependencies 含 file: 条目

echo "--- [c] 冷启动（原事故崩溃点）---"
npx @deepseek-ai/dsh web --no-open
# 期望：打印 "dsh web: http://127.0.0.1:3080"，无 loader 报错、进程不退出；保持运行
```

另开一个 Git Bash 窗口：

```bash
echo "--- [d] 服务在监听 ---"
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3080   # 期望：200
```

在浏览器中打开 `http://127.0.0.1:3080` 验证 UI：

```
--- [e] UI 验证 ---
1. 输入框左侧出现 "+" 按钮
2. 点击 "+" 弹出菜单，包含三项：手写输入、截图识别、LaTeX 编辑器
3. 设置 → Math Input 显示五个控件（模式、束宽、推理后端、防抖、语言）
4. 在输入框输入 \[x^2\]，下方渲染出 KaTeX 公式
```

回到 \[c] 窗口 `Ctrl+C` 停止服务，然后清理：

```bash
echo "--- [f] 清理：移除插件 ---"
npx @deepseek-ai/dsh plugin --profile web remove dsh-math-input; echo "exit=$?"
cat ~/.dsh/profiles/web/package.json
# 期望：bundles 只剩基础项，dependencies 中 dsh-math-input 已消失
```

### macOS / Linux

```bash
PROJECT="$(pwd)"                       # ← 从仓库根目录运行；或用绝对路径
cd "$PROJECT"

echo "--- [a] 安装本地包 ---"
npx @deepseek-ai/dsh plugin --profile web add "file:$PROJECT"; echo "exit=$?"

echo "--- [b] 确认注册进 bundles 层 ---"
cat ~/.dsh/profiles/web/package.json

echo "--- [c] 冷启动（原事故崩溃点）---"
npx @deepseek-ai/dsh web --no-open
# 期望同 Windows；保持运行，另开终端跑 [d]：
#   curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3080   # 期望：200
# 然后在浏览器打开 http://127.0.0.1:3080 做 [e] UI 验证（清单同 Windows）
# [c] 窗口 Ctrl+C 后：

echo "--- [f] 清理：移除插件 ---"
npx @deepseek-ai/dsh plugin --profile web remove dsh-math-input; echo "exit=$?"
cat ~/.dsh/profiles/web/package.json
```

***

## 判定标准

| 步骤   | 通过                              | 失败信号                                                                           |
| ---- | ------------------------------- | ------------------------------------------------------------------------------ |
| \[a] | `exit=0`，pnpm 安装成功              | pnpm 报错 / reconcile 警告 `declares no dsh.bundle`                                |
| \[b] | bundles 含 `dsh-math-input`      | 缺失（`dsh.bundle.patch` 声明被破坏）                                                   |
| \[c] | 打印监听地址，持续无报错                    | `failed to import loader entry dsh-math-input` / `ERR_MODULE_NOT_FOUND` / 进程退出 |
| \[d] | HTTP 200                        | 连接拒绝                                                                           |
| \[e] | "+" 按钮可见、菜单可打开、设置页显示 Math Input | "+" 按钮缺失（Host 加载了但 Client 未发现）；设置区缺失                                           |
| \[f] | `exit=0`，profile 恢复原状           | 残留依赖或 bundle                                                                   |

启动崩溃发生在树组装早期，\[c] 保持约 10 秒无异常即可判定通过。Client 缺失（\[e] 失败
但 \[c] 通过）意味着 `package.json` 的 `dsh.client` 格式错误或 `inject` 列表有误。

***

## 推送后的真实 `github:` 复验

提交并推送到 GitHub 后，把 \[a] 换成真实规格，重跑 \[b]–\[f]，补齐 tarball 拉取这一环：

```bash
npx @deepseek-ai/dsh plugin --profile web add "github:<owner>/dsh-math-input"
```

***

## 设计备注

- **为什么不能只靠 overlay 冒烟测试？** overlay 以绝对路径注入 Host 入口，完全绕过
  `node_modules` 解析。它能验证编译产物能跑，但无法验证包的 `main`/`exports` 契约是否
  适配真实 `plugin add` 安装。本指南是唯一能发现裸包名被改成相对路径这类回归的测试。

- **为什么本插件需要 UI 检查**：与纯 CLI 工具不同，`dsh-math-input` 同时有 Host 入口
  （注册设置服务）和 Client 端（React UI 含 "+" 按钮）。冷启动通过只证明 Host 加载了；
  \[e] 的 UI 检查才证明 Client 经 `dsh.client` 被发现且在渲染。

- **维护规则**：任何触碰 `cordis.patch.yml`、`main`、`exports`、`dsh.bundle`、`dsh.client`
  的改动，都必须重跑本指南。

