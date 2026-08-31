# dsh-math-input

**[English](./README.md) | 中文**

一个零 token、完全离线的 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH) 数学输入插件。手写公式、截图识别、或直接编辑 LaTeX——全部在浏览器内识别，无需 API Key，不消耗 token。

## 为什么需要它

DSH 的输入框是纯文本。想让模型推理一个公式，你得手敲 LaTeX——又慢又容易出错。本插件提供三种输入方式加内联渲染：

| 输入方式 | 适用场景 | 识别引擎 |
|---|---|---|
| **手写输入** | 有触控笔 / 鼠标，想快速写出公式 | CoMER 神经网络（ONNX Runtime Web） |
| **截图识别** | 已有公式图片（PDF 截图、网页截图等） | 同一引擎，图像转张量后识别 |
| **LaTeX 编辑器** | 知道 LaTeX 语法，想要符号面板辅助 | 无需识别，直接输入 |
| **内联渲染** | 在输入框中写 `\[ ... \]`，自动渲染为公式 | KaTeX |

所有识别通过 ONNX Runtime Web（WASM / WebGPU）运行。模型 7.2 MB，首次下载后缓存在 IndexedDB。插件从不调用 `ctx.llm`——token 账单为零。

## 安装

### 前置条件

- DeepSeek Harness `>= 0.1.1-rc.2`
- Node.js `>= 20.0.0`
- Chrome 或 Edge 浏览器（WebGPU 支持与 SharedArrayBuffer 需要）

### 安装插件

```bash
# 从 npm 安装（推荐）
dsh plugin --profile web add dsh-math-input

# 从 GitHub 安装
dsh plugin --profile web add github:<owner>/dsh-math-input

# 无全局 dsh CLI 时
npx -y @deepseek-ai/dsh plugin --profile web add dsh-math-input
```

安装后**重启 DSH profile**（停掉再重新 `dsh web`）。输入框左侧出现 "+" 按钮即表示安装成功。

## 使用

点击输入框左侧的 "+" 按钮打开菜单：

### 1. 手写输入

1. 菜单中点击 **"手写输入"**，弹出画板弹窗
2. 用鼠标、触摸或触控笔在画板上书写公式
3. 停笔约 1.5 秒（可在设置中调整）后引擎自动识别
4. 识别结果以 KaTeX 预览渲染，下方可编辑 LaTeX 源码
5. 点击 **"确认插入"**，公式以 `\[ ... \]` 格式进入输入框并内联渲染
6. 点击 **"清空"** 重新写，**"撤销"** 删除最后一笔

### 2. 截图识别

1. 菜单中点击 **"截图并识别"**，弹出识别弹窗
2. **Ctrl+V** 粘贴图片，或点击 **"上传文件"** 选择本地图片
3. 引擎自动从图像中提取 LaTeX
4. 确认预览后点击 **"确认插入"**

### 3. LaTeX 语法编辑器

1. 菜单中点击 **"LaTeX 语法编辑器"**，输入框下方展开 dock 面板
2. 面板提供希腊字母按钮（`\alpha`、`\beta`、`\pi` 等）和模板按钮（`\frac{}{}`、`\sqrt{}`、`\sum_{}^{}` 等）
3. 点击按钮直接插入对应 LaTeX 代码到编辑器
4. 右侧实时 KaTeX 预览
5. 点击 **"插入"** 按钮，公式以 `\[ ... \]` 格式进入输入框

### 内联渲染

在输入框中任何你写（或粘贴）的 `\[ ... \]` 都会内联渲染为公式。例如输入 `\[x^2 + y^2 = r^2\]`，公式会直接渲染显示。

## 设置

打开 **设置 → Math Input**，可配置：

| 设置项 | 说明 | 可选值 |
|---|---|---|
| 识别模式 | 限制识别词汇范围 | auto（全部）、number（数字与运算符）、expression（数学表达式） |
| Beam 宽度 | 识别质量与速度权衡 | 1（最快）、2、3（质量最佳） |
| 执行后端 | ONNX 推理后端 | wasm（通用）、webgpu（需 Chrome 113+，通常快 2-5 倍） |
| 停笔识别延迟 | 停笔后自动识别的等待时间 | 0.3 - 10 秒 |
| 界面语言 | 覆盖 UI 语言 | zh / en，留空跟随 DSH 语言 |

设置持久化在 Host 端，跨页面刷新保留。

## 卸载

```bash
# 从 DSH profile 中卸载插件
dsh plugin --profile web remove dsh-math-input

# 或无全局 CLI 时
npx -y @deepseek-ai/dsh plugin --profile web remove dsh-math-input
```

重启 DSH profile。"+" 按钮和所有输入窗口都会被移除。

> 模型缓存（IndexedDB 中的 `math-handwrite-models` 数据库）不会被自动清除。如需手动清理，在浏览器 DevTools → Application → IndexedDB 中删除该数据库即可。

## 本地测试

不需要推 GitHub、不需要发 npm，按以下五步在本机完整验证。

### 第一步：编译项目

在 `dsh-math-input/` 目录下：

```bash
cd dsh-math-input
npm install
npm run build      # 生成 lib/ 目录
```

> 如果改了代码想先确认类型无误再编译，可以跑 `npm run typecheck`（只检查类型，不生成产物）。

### 第二步：创建本地 overlay

在项目根目录下新建 `overlay.yml`（注意：**不要提交到 git**，它是本地开发专用的）：

```yaml
# overlay.yml
- insert:
    - id: dsh-math-input
      # Windows: '/C:/你的路径/dsh-math-input/lib/index.js'
      # macOS:   '/Users/你的路径/dsh-math-input/lib/index.js'
      # Linux:   '/home/你的路径/dsh-math-input/lib/index.js'
      name: '/你的/绝对/路径/dsh-math-input/lib/index.js'
```

> `name` 填 `lib/index.js` 的**绝对路径**。Windows 必须在盘符前加 `/`，例如 `'/C:/dev/dsh-math-input/lib/index.js'`；macOS / Linux 直接用绝对路径，例如 `'/home/user/dsh-math-input/lib/index.js'`。

**也可以用命令一键生成**（确保已 cd 到项目目录）：

**Windows (Git Bash / MINGW)：**

```bash
cat > overlay.yml <<EOF
- insert:
    - id: dsh-math-input
      name: '/$(pwd -W)/lib/index.js'
EOF
```

> `pwd -W` 输出 Windows 风格绝对路径（如 `C:/Users/xxx/dsh-math-input`），前面必须加 `/`，拼接后得到 `/C:/Users/xxx/dsh-math-input/lib/index.js`。
> Node.js ESM loader 在 Windows 上不认裸 `C:/...` 路径（会被当成 `c:` 协议），必须写成 `/C:/...` 或 `file:///C:/...`。

**macOS / Linux：**

```bash
cat > overlay.yml <<EOF
- insert:
    - id: dsh-math-input
      name: '$(pwd)/lib/index.js'
EOF
```

### 第三步：用 patch 模式启动 DSH

```bash
npx @deepseek-ai/dsh web --patch overlay.yml
```

打开 `http://127.0.0.1:3080`。

> 如果 web profile 依赖缺失（从未安装过 DSH web profile），先运行：
> ```bash
> npx -y @deepseek-ai/dsh plugin --profile web list
> ```
> 然后重试上面的 overlay 命令。

### 第四步：验证功能

在 DSH Web 界面中依次验证：

1. 输入框左侧出现 **"+" 按钮**
2. 点击 "+" 弹出菜单，包含三个选项：**手写输入**、**截图并识别**、**LaTeX 语法编辑器**
3. **手写输入**：弹出画板弹窗，可接受鼠标 / 触摸书写
4. **设置**：设置 → Math Input，五个控件可正常操作
5. 修改设置后刷新页面，设置值保持不变
6. 在输入框输入 `\[x^2\]`，下方预览条渲染出 KaTeX 公式
7. **LaTeX 编辑器**：从菜单切换，面板展开，点击希腊字母按钮插入代码，点击"插入"写入 `\[...\]`

### 第五步：改代码后重新测试

每次修改代码后：

```bash
# 重新编译
npm run build

# 停掉 DSH（Ctrl+C），重新启动
npx @deepseek-ai/dsh web --patch overlay.yml
```

## 注意事项与限制

- **模型下载**：首次识别会触发约 7.2 MB 下载（encoder 3.4 MB + decoder 4.0 MB + vocab 4 KB），后续使用 IndexedDB 缓存。
- **WebGPU 自动降级**：选择 `webgpu` 后端时，如果浏览器不支持（需 Chrome 113+），自动回退到 `wasm`。
- **SharedArrayBuffer**：ONNX Runtime Web 使用多线程 WASM 需要 `Cross-Origin-Opener-Policy: same-origin` 和 `Cross-Origin-Embedder-Policy: require-corp` 响应头。未设置时回退到单线程，识别仍可工作但速度较慢。
- **手写 vs 印刷体**：CoMER 模型基于 CROHME 手写数学表达式数据集训练，针对手写体优化。截图识别印刷体公式效果可能不如手写体。
- **浏览器兼容**：需要支持 WebAssembly SIMD 的现代浏览器。Chrome / Edge 推荐，Firefox 基本可用，Safari 支持有限。
- **零 token 保证**：插件从不调用 `ctx.llm`，所有识别在浏览器本地完成，不产生任何 API 调用费用。

## 开发

```bash
npm run typecheck   # tsc --noEmit (strict)
npm run lint        # ESLint 9
npm test            # node:test + tsx
npm run build       # tsdown + tsc → lib/
```

CI 跨 Node 20 / 22 / 24 运行：typecheck、lint、单元测试、build，并校验提交的 `lib/` 与新构建一致。

## 文档

- [架构（英文）](./docs/ARCHITECTURE.md) | [架构（中文）](./docs/ARCHITECTURE.zh-CN.md)
- [识别引擎选型](./docs/recognition-engine.md)
- [本地测试指南](./docs/local-testing.md)
- [贡献指南](./CONTRIBUTING.zh-CN.md)
- [更新日志](./CHANGELOG.md)

## 许可证

MIT
