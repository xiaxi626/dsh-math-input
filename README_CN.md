# dsh-math-input

[English](./README.md) | **中文**

一个零 token、完全离线的 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH) 数学输入插件。手写公式、截图识别、或直接编辑 LaTeX——全部在浏览器内识别,无需 API Key,不消耗 token。

## 它做什么

DSH 的输入框是纯文本。想让模型推理一个公式,你得手敲 LaTeX——又慢又容易出错。本插件提供三种输入方式加内联渲染:

* **手写输入**——在画板上用鼠标、触摸或触控笔书写,浏览器端神经网络(CoMER)识别为 LaTeX。

* **截图识别**——粘贴或上传公式图片,同一引擎提取 LaTeX。

* **LaTeX 编辑器**——dock 面板,带符号面板(希腊字母、分式、积分)与 KaTeX 实时预览。

* **内联渲染**——在输入框输入 `\[ ... \]`,公式用 KaTeX 内联渲染;点击渲染块切回源码编辑。

所有识别通过 ONNX Runtime Web(WASM/WebGPU)运行。模型 7.2 MB,首次下载后缓存在 IndexedDB。插件从不调用 `ctx.llm`——token 账单为零。

## 安装

前置条件:DeepSeek Harness `>= 0.1.1-rc.2`、Node.js `>= 20.0.0`、Chrome 或 Edge。

```
# 从 npm 安装(推荐)
dsh plugin --profile web add dsh-math-input

# 从 GitHub 安装
dsh plugin --profile web add github:<owner>/dsh-math-input

# 无全局 dsh CLI 时
npx -y @deepseek-ai/dsh plugin --profile web add dsh-math-input
```

安装后刷新 Web 界面。模型选择器左侧出现 "+" 按钮。

## 使用

点击 "+" 按钮打开输入法菜单:

1. **手写**——在画板上书写。停笔 1.5 秒后引擎自动识别。查看 KaTeX 预览,按需微调 LaTeX,点击确认。公式以 `\[ ... \]` 进入输入框并内联渲染。
2. **截图**——粘贴图片(Ctrl+V)、上传文件、或从浏览器截取。引擎从图像提取 LaTeX。
3. **LaTeX 编辑器**——带符号面板与实时预览,直接输入 LaTeX。

输入框中任何你写(或粘贴)的 `\[ ... \]` 都会内联渲染。点击渲染块切回源码。

## 设置

打开 设置 → Math Input,可配置识别模式(auto / number / expression)、beam width、执行后端(wasm / webgpu)、停笔防抖延迟、模型缓存、界面语言。

## 本地测试

完整步骤见 [docs/local-testing.md](./docs/local-testing.md)。快速版:

```
npm install
npm run build

# 创建 overlay.yml,写入 lib/index.js 的绝对路径
npx @deepseek-ai/dsh web --patch overlay.yml
```

验证 "+" 按钮与三个输入窗口。测试 GitHub 安装路径:

```
dsh plugin --profile web add github:<owner>/dsh-math-input
```

## 开发

```
npm run typecheck   # tsc --noEmit(strict)
npm run lint        # ESLint 9
npm test            # node:test + tsx
npm run build       # tsc -> lib/
```

CI 跨 Node 20 / 22 / 24 运行:typecheck、lint、单元测试、build,并校验提交的 `lib/` 与新构建一致。

## 文档

* [Architecture (English)](./docs/ARCHITECTURE.md) | [架构(中文)](./docs/ARCHITECTURE.zh-CN.md)

* [识别引擎选型](./docs/recognition-engine.md)

* [本地测试指南](./docs/local-testing.md)

* [Contributing](./CONTRIBUTING.md) | [贡献指南](./CONTRIBUTING.zh-CN.md)

* [Changelog](./CHANGELOG.md)

## 许可证

MIT
