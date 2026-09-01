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

## Overlay 冒烟测试

在项目根目录创建 `overlay.yml`（路径替换为你自己的）：

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

打开 `http://127.0.0.1:3080`。

## 验证清单

1. **"+" 按钮**出现在输入行左侧
2. 点击后**菜单**打开，包含三项：手写识别、截图识别、LaTeX 编辑器
3. **手写板**弹窗正常渲染，画布可用指针书写
4. **设置区**出现在设置页中，包含五个控件（模式、束宽、推理后端、防抖、语言）
5. 修改设置后刷新页面，设置仍然保留
6. 在输入框中输入 `\[x^2\]`，**预览条**以 KaTeX 芯片形式渲染
7. 从菜单切换 **LaTeX 编辑器**停靠栏，符号面板可插入片段，"插入"按钮写入 `\[...\]`

## 故障排查

- **必须使用绝对路径**：`overlay.yml` 中的 `name` 字段必须是指向 `lib/index.js` 的绝对路径

- **Profile 初始化**：首次运行 `dsh web` 会自动初始化 web profile；已有的 profile 若无法解析某个 bundle，运行 `npx @deepseek-ai/dsh plugin --profile web install`

- **SharedArrayBuffer 回退**：如果服务器未发送 `Cross-Origin-Opener-Policy` 和 `Cross-Origin-Embedder-Policy` 头，ONNX Runtime 会回退到单线程 WASM——识别仍然可用，只是更慢

- **模型下载**：首次识别会触发约 7.2 MB 的下载（编码器 + 解码器 + 词表）；之后走 IndexedDB 缓存

- **WebGPU**：`provider: 'webgpu'` 会自动检测，浏览器不支持时回退到 `wasm`

