# 本地测试（插件装载验证）

[English](./local-testing.md) | **中文**

## 前置要求

- Node.js >= 20

- Chrome 或 Edge（需要 WebGPU 支持和 SharedArrayBuffer）

## 安装

```bash
npm install
npm run build
```

## 基于链接的测试（推荐）

本插件同时有 Host 入口（`lib/index.js`）和 Client bundle（`lib/client.js`，
通过 `package.json` 的 `dsh.client` 声明）。overlay 方式只加载 Host——Client
是通过 `node_modules` 发现的，所以必须先把包链接进去。

### 一次性设置：链接本地包

**Windows (Git Bash / MINGW)：**

```bash
PROJECT="$(cygpath -m ~/Downloads/dsh-math-input)"   # ← 你的路径
npx @deepseek-ai/dsh plugin --profile web add "file:$PROJECT"
```

**macOS / Linux：**

```bash
PROJECT="$(pwd)"                       # ← 从仓库根目录运行
npx @deepseek-ai/dsh plugin --profile web add "file:$PROJECT"
```

这会把包装进 profile 的 `node_modules`（持久链接）。之后每次 `npm run build`
后，`lib/` 的更新立即可用——**不需要重新安装**。

### 迭代：重新构建 + 重启

```bash
npm run build
npx @deepseek-ai/dsh web --no-open
```

打开 `http://127.0.0.1:3080`。

### 清理：用完后取消链接

```bash
npx @deepseek-ai/dsh plugin --profile web remove dsh-math-input
```

## Overlay 备选方案（仅 Host）

如果你只需要测试 Host 端代码（设置服务、typert 清单等），不需要 Client UI，
可以用 overlay 补丁代替链接：

在项目根目录创建 `overlay.yml`：

```yaml
- insert:
    - id: dsh-math-input
      name: '/你的/绝对路径/dsh-math-input/lib/index.js'
```

**也可以用命令一键生成**（在项目根目录执行）：

**Windows (Git Bash / MINGW)：**

```bash
cat > overlay.yml <<EOF
- insert:
    - id: dsh-math-input
      name: '/$(pwd -W)/lib/index.js'
EOF
```

> `pwd -W` 输出 Windows 风格路径（如 `C:/Users/xxx/dsh-math-input`）。
> 必须加 `/` 前缀，结果是 `/C:/Users/xxx/dsh-math-input/lib/index.js`。
> Node.js ESM 加载器不接受裸 `C:/...` 路径（会把 `C:` 当协议名）——
> 必须写成 `/C:/...` 或 `file:///C:/...`。**不要**用 `pwd`（输出
> `/c/Users/...`，加载器会解析成 `C:\c\Users\...`）。

**macOS / Linux：**

```bash
cat > overlay.yml <<EOF
- insert:
    - id: dsh-math-input
      name: '$(pwd)/lib/index.js'
EOF
```

> `pwd` 输出 Unix 风格路径（如 `/Users/xxx/dsh-math-input`），已以 `/` 开头——
> 不需要额外前缀。

用 overlay 补丁启动 DSH web 客户端：

```bash
npx @deepseek-ai/dsh web --patch overlay.yml
```

> **注意**：overlay 只加载 Host 入口。Client UI（手写板、截图 OCR、LaTeX
> 编辑器、设置页）**不会出现**，因为 `dsh.client` 是通过 `node_modules`
> 发现的，而 overlay 绕过了它。要测试完整 UI，请用上面的[基于链接的方案](#基于链接的测试推荐)。

## 验证清单

适用于基于链接的方案（overlay 仅覆盖 Host 装载）：

1. **"+" 按钮** 出现在输入行左侧
2. **菜单** 点击后展开三项：手写、截图、LaTeX 编辑器
3. **手写板** 弹窗渲染，画布接受指针绘制
4. **设置区** 出现在 Settings 中，有五个控件（mode、beam、provider、debounce、language）
5. 修改设置后刷新页面，值持久化
6. **预览条** 把输入框里的 `\[x^2\]` 渲染为 KaTeX 标签
7. **LaTeX 编辑器面板** 从菜单切换，调色板插入片段，Insert 写入 `\[...\]`

## 故障排查

- **绝对路径必需**：`overlay.yml` 的 `name` 字段必须是 `lib/index.js` 的绝对路径

- **SharedArrayBuffer 降级**：如果服务器未发送 `Cross-Origin-Opener-Policy` 和 `Cross-Origin-Embedder-Policy` 头，ONNX Runtime 降级为单线程 WASM——识别仍可用但更慢

- **模型下载**：首次识别触发约 7.2 MB 下载（encoder + decoder + vocab）；后续加载使用 IndexedDB 缓存

- **WebGPU**：`provider: 'webgpu'` 自动检测，不支持时降级为 `wasm`
