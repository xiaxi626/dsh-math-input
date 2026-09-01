# dsh-math-input — 架构文档

[English](./ARCHITECTURE.md) | **中文**

一个零 token、完全离线的 DeepSeek Harness (DSH) 数学输入插件。提供三种输入方式——手写识别、截图 OCR、LaTeX 编辑器——以及在 DSH 输入框内的 LaTeX 内联渲染。所有识别均在浏览器内完成,无需 API Key、无服务器往返、不消耗 token。

> **核验状态(2026-08-31)**:本文档中所有平台相关论断均已对照一手资料核验——`deepseek-harness` 官方文档(`docs/architecture.md`、`docs/subsystems/slots.md`、`docs/subsystems/typert.md`、`docs/subsystems/web-client.md`、`docs/subsystems/client-modules.md`、`docs/user/develop/basic/*`)与 `DIAG5/dsh-better-input` v0.1.8 完整源码。尚待实施期间解决的问题集中在[开放问题](#开放问题)。

## 设计目标

| 目标                    | 实现方式                                                                                      |
| --------------------- | ----------------------------------------------------------------------------------------- |
| 零 token 成本            | 识别完全在客户端通过 ONNX Runtime Web (WASM/WebGPU) 运行,插件从不调用 `ctx.llm`。                            |
| 首次下载后完全离线             | CoMER 模型(共 7.2 MB)首次从 GitHub Releases 下载,之后缓存在 IndexedDB,后续加载秒开且无需网络。                     |
| 面向数学而非中文              | 识别引擎(CoMER,训练于 CROHME 手写数学数据集)针对 LaTeX 符号与表达式,是拉丁字母与数学运算符,不是中文字符。                         |
| 与 dsh-better-input 一致 | 镜像其已核验的 Client/Host/Typert/Remote 结构、插槽约定、语言模式与构建流水线(基于 v0.1.8 源码),但因不需要 LLM 调用,Host 端更薄。 |

## 平台对接(已核验)

### Bundle、Profile 与分层

运行中的 `dsh` 是按序分层组合的 Cordis 插件树:先是 profile 中的各 bundle,然后是 profile 的 `cordis.patch.yml`、home 级 patch,最后是 `--patch` overlay。`dsh plugin --profile web add dsh-math-input` 将本包安装到 profile home;浏览器端通过包的 `dsh.client` 清单发现,而不是通过 Host 入口。

因此我们的 `cordis.patch.yml` 极简(与 dsh-better-input、dsh-skills-nexus 同构):

```yaml
- insert:
    - id: dsh-math-input
      name: dsh-math-input
```

`package.json` 声明 `dsh.bundle.patch: "./cordis.patch.yml"` 以及 `dsh.client`(见[客户端运行时](#客户端运行时))。

### Host 运行时

- 插件入口导出 `name` 与 `apply(ctx)`(函数形式)。`inject` 声明的依赖在 `apply` 运行前就绪;通过 `ctx` 注册的一切自动清理;显式清理用 `ctx.effect(() => disposer)`。

- Host 只注册一个服务:`MathInputSettingsService extends TypertRemoteService`(来自 `@deepseek-ai/dsh-typert-protocol`),经 `await ctx.plugin(MathInputSettingsService)` 挂载,构造为 `super(ctx, 'MathInput', { namespace: 'mathInput' })`。该服务的每个公开方法都会成为一个 Remote 调用。

- 设置经 `@deepseek-ai/dsh-settings` 持久化:`ctx.settings.register(settingsNamespace('dsh-math-input'), MathInputSettingsSchema, { validate })`,schema 为带逐字段默认值的 Schemastery 对象。Host 负责校验(`validateSettings`)与扁平存储结构。

- Typert 网关边界规则(来自 dsh-better-input 的实战注释):返回对象中绝不显式赋值 `undefined`——可选键直接省略;取消信号作为描述符声明的尾部参数 `signal: AbortSignal` 传入。

- 全程无 `ctx.llm`——零 token 是架构约束,不是行为约定。

### Typert / Remote 契约

第三方插件手写三个契约文件(harness 的 Typert 代码生成仅用于其自身构建):

| 文件                       | 内容                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `src/remote-contract.ts` | 全部参数/返回值的 Zod wire schema + `z.infer` wire 类型                                                                            |
| `src/typert.ts`          | `TYPERT` 清单:`{ package, face: 'host', schemas: [], invocations: [...], model: { services, events, objects } }`——每方法一个描述符 |
| `src/remote.ts`          | `TYPERT_REMOTE: TypertRemoteContribution`(面向客户端的描述符)+ `declare module '@deepseek-ai/dsh-typert-protocol'` 类型扩展           |

单方法描述符形态:`id: 'dsh-math-input#mathInput/<method>'`、`service: 'MathInput'`、`namespace: 'mathInput'`、`invocation: { kind: 'direct' }`、有序 `parameters`(`{ name, wire, source: 'json', codec: { mode: 'strict', typeSymbol, schema } }`)、可选 `cancellation: { parameter: 'signal' }`、strict `result` codec。

本薄插件的契约只暴露设置读写:

- `mathInput/getSettings() -> MathInputSettingsView`

- `mathInput/updateSettings(patch, signal?) -> MathInputSettingsView`

Client 侧一次性挂载:`await ctx.remote.$mount(TYPERT_REMOTE)`,之后调用 `remote.getSettings()` 等,返回 `RemoteResult<T>`(`{ ok: true, value } | { ok: false, error }`)。

### 客户端运行时

- `package.json` 声明 `dsh.client: { platform: 'web', inject: [...] }`,列出必须先于我们物化的框架包(与 dsh-better-input 一致):`@deepseek-ai/dsh-client-runtime`、`@deepseek-ai/dsh-client-ui-conversation`、`@deepseek-ai/dsh-client-ui-slots`。客户端 bundle 经 `exports['./client']` 导出。

- 客户端入口(`src/client.ts` → `src/client/index.ts`)导出 `inject: ['slots', 'remote', 'locale']` 与 `async apply(ctx: ClientContext): Promise<() => Promise<void>>`:

  1. `const disposeRemote = await ctx.remote.$mount(TYPERT_REMOTE)`——挂载 `remote.mathInput`。
  2. `ctx.locale.register(MATH_INPUT_NS, { zh, en })`——在任何插槽渲染前注册双语词典。
  3. `await ctx.inject(['slots', 'remote', 'remote.mathInput', 'locale'], async (remoteCtx) => { ...插槽注册... })`——内层 inject 在挂载之后才请求 `remote.mathInput`(在外层请求会死锁,因为它反过来门控我们自己的激活)。
  4. 返回销毁函数:清理语言词典与 remote 挂载。

- 组件为 React 18 函数组件,从不接收 `ctx`,一切以 props 传入。

- CSS:内联样式基于 DSH 设计令牌(`var(--dsw-alias-*)`);插件关键帧经带 `dataset.plugin = 'dsh-math-input'` 的 `document.head` style 标签注入,销毁时移除。

### 插槽映射(对照 `docs/subsystems/slots.md` 官方插槽树核验)

| 我们的组件      | 插槽                             | 基数/作用域         | 位置说明                                                               |
| ---------- | ------------------------------ | -------------- | ------------------------------------------------------------------ |
| 启动器 "+" 按钮 | `conversation.input.left`      | list / session | 输入行左侧。使用新 list id、小 order。                                         |
| 手写窗口       | React portal → `document.body` | 不适用            | DSH 没有模态插槽;模态窗口用 portal 实现(dsh-better-input 的浮动 UI 同样用 portal)。    |
| 截图识别窗口     | React portal → `document.body` | 不适用            | 同上。                                                                |
| LaTeX 编辑面板 | `conversation.input.dock`      | list / session | 输入框上方可开合的 dock 行(better-input 在此占用 order 15/20,我们用新 id)。           |
| 设置页        | `settings.section`             | list / root    | 侧栏标题用 `label` thunk:`ctx.locale.bind(NS)('settingsTitle')`,跟随语言切换。 |
| 内联渲染       | 输入框 draft(见下文)                 | 不适用            | 输入框 draft 是纯字符串;见组件 6 与开放问题。                                       |

插槽注册模式(与 dsh-better-input 完全一致):

```tsx
remoteCtx.slots.inject('conversation.input.dock', () =>
  remoteCtx.slots.register(
    { name: 'conversation.input.dock', id: 'math-input-latex-dock', order: 30, locale: MATH_INPUT_NS,
      inject: (sessionId) => ({ /* 私有面:控制器、回调 */ }) },
    LatexEditorDock
  )
)
```

**输入框访问**:注册在 session 作用域会话插槽上的组件会收到框架 props `input: { draft: string }` 与 `inputActions: { setDraft(text: string): void }`(另有 `session`、`t` 与我们的注入面)。所有插入路径都汇聚到 `setDraft`:把 `\[latex\]` 追加到当前 draft 就是我们需要的全部写入面。

## 项目结构

```
dsh-math-input/
├── src/
│   ├── index.ts                  # Host 入口:name + apply(ctx) -> ctx.plugin(MathInputSettingsService)
│   ├── config.ts                 # MathInputSettings 接口、DEFAULT_SETTINGS、校验器
│   ├── config-schema.ts          # Schemastery 设置 schema(仅 Host,不进浏览器 bundle)
│   ├── remote-contract.ts        # Zod wire schema + wire 类型(共享)
│   ├── typert.ts                 # TYPERT 清单(host face)
│   ├── remote.ts                 # TYPERT_REMOTE 贡献 + 模块类型扩展
│   ├── about.ts                  # 已安装版本身份 + 更新检查(可选,模式来自 dsh-better-input)
│   ├── client.ts                 # Client 入口:re-export src/client/index.ts
│   ├── client/
│   │   ├── index.ts              # client apply():remote.$mount、locale.register、slots.inject 注册
│   │   ├── strings.ts            # 'math-input' 语言命名空间的类型化中英词典
│   │   ├── settings-controller.ts# remote.getSettings/updateSettings 之上的外部 store + useSyncExternalStore hooks
│   │   ├── settings.tsx          # settings.section 组件(编辑草稿、失焦保存)
│   │   ├── launcher.tsx          # conversation.input.left 上的 "+" 按钮 + 弹出菜单
│   │   ├── handwriting-pad.tsx   # portal 模态:画布、工具栏、识别流程
│   │   ├── screenshot-ocr.tsx    # portal 模态:粘贴/上传/截图 -> 识别
│   │   ├── latex-editor.tsx      # conversation.input.dock 面板:编辑器 + 符号面板 + KaTeX 预览
│   │   ├── inline-renderer.ts    # draft 中 \[...\] 检测 + 渲染块策略(见组件 6)
│   │   └── ui/                   # 共享模态框架、KaTeX 预览窗、按钮样式
│   ├── recognition/
│   │   ├── engine.ts             # ink-on InferenceEngine 单例(懒加载 + IndexedDB 缓存 + Web Worker)
│   │   ├── preprocess.ts         # 笔迹预处理(复用 ink-on preprocessStrokes)
│   │   └── image-preprocess.ts   # 截图图像 -> 编码器张量(灰度 / 反色 / 缩放至 256 高)
│   └── latex/
│       ├── render.ts             # KaTeX 渲染 + \[...\] / $$...$$ 检测
│       └── repair.ts             # 括号补全 / 参数修正(复用 ink-on repairLatex)
├── test/                         # 单元测试(node:test + tsx),仅纯逻辑模块
│   ├── latex-detect.test.ts
│   ├── latex-repair.test.ts
│   ├── preprocess.test.ts
│   ├── image-preprocess.test.ts
│   └── engine-mock.test.ts
├── docs/                         # ARCHITECTURE(中/英)、recognition-engine、local-testing
├── .github/workflows/ci.yml      # Node 20/22/24 矩阵
├── lib/                          # 构建产物(提交入库;CI 校验与新构建一致)
├── cordis.patch.yml              # `- insert: [{ id, name }]`
├── tsdown.config.ts              # Host ESM/node 入口:index、typert、remote(+ client bundle 配置)
├── tsdown.client.ts              # Client CJS/browser bundle,包裹进 window.__ModuleLoader__.load(...)
├── tsconfig.json                 # strict、jsx react-jsx、noEmit(typecheck)
├── tsconfig.build.json           # 仅输出声明到 lib/
├── eslint.config.js              # ESLint 9 flat config
├── package.json                  # dsh.bundle.patch + dsh.client + exports '.'/'./client'/'./typert'/'./remote'
├── README.md / README_CN.md
├── CONTRIBUTING.md / CONTRIBUTING.zh-CN.md
└── CHANGELOG.md
```

## Client / Host 架构

**Host 端**(`src/index.ts` + 设置服务):注册 `MathInputSettingsService`(`TypertRemoteService`),拥有 `dsh-math-input` 设置命名空间,暴露 `getSettings` / `updateSettings`。无 LLM 调用,除 `settings` 外无其他 `inject`。这就是 Host 的全部表面——识别、渲染、UI 全在 Client 端。

**Client 端**(`src/client/`):挂载 remote 贡献、注册语言词典,然后注册插槽占用者(启动器、dock 面板、设置页)以及 portal 渲染的模态窗口与内联渲染器。ONNX 引擎跑在 Web Worker 中。

**契约**(`typert.ts` / `remote.ts` / `remote-contract.ts`):上文所述的最小设置读写 Typert 表面。相比 dsh-better-input(九个调用,经 Host 路由 LLM),我们只有两个。

## 识别引擎

插件使用 [`ink-on`](https://www.npmjs.com/package/ink-on),一个框架无关的浏览器端手写数学公式识别库。

| 属性   | 值                                                                        |
| ---- | ------------------------------------------------------------------------ |
| 模型   | CoMER(Coverage-guided Multi-scale Encoder-decoder Transformer,ECCV 2022) |
| 运行时  | ONNX Runtime Web(WASM,可选 WebGPU)                                         |
| 模型大小 | 编码器 3.4 MB + 解码器 4.0 MB = 共 7.2 MB(INT8 量化)                              |
| 推理线程 | Web Worker(主线程之外,UI 保持响应)                                                |
| 延迟   | 每次识别 1–2 秒                                                               |
| 缓存   | IndexedDB——首次下载 7.2 MB,后续加载秒开                                            |
| 依赖   | `onnxruntime-web`(打进客户端 bundle),无需 Vue                                   |

引擎暴露的 API:

- `InferenceEngine`——加载 ONNX 会话,运行编码器 + 解码器(beam search)。

- `preprocessStrokes(strokes)`——以 3px 间隔重采样点,在白底黑线画布上用贝塞尔曲线渲染,缩放至 256 高,转为灰度 Float32 张量。

- `repairLatex(tokens)`——修复不平衡的括号和损坏的 `\frac`/`\sqrt` 参数,经 KaTeX 校验。

- `isStrokeMeaningful(strokes)`——过滤误触和孤立点。

- `loadVocab(url)`——加载 245 符号的词表。

**截图 OCR 复用**:同一 CoMER 编码器接受预处理后的图像张量。独立的 `image-preprocess.ts` 将截图/粘贴的图片转为相同格式(灰度、反色至白线黑底、缩放至 256 高、64px 对齐 padding),避免加载第二个模型。CoMER 训练于手写数据(CROHME),印刷体公式准确率可能偏低;若实测不足,可在同一 `recognize(input)` 接口后接入 pix2tex ONNX 导出。

## 六大组件

### 1. 输入框内联渲染器(`inline-renderer.ts`)

监听输入框 draft 中 `\[` ... `\]` 的闭合对。

- 状态机:`source`(可编辑文本) <-> `rendered`(KaTeX 渲染块)。

- 未闭合的 `\[` 保持纯文本(不提前渲染)。

- 发送时:渲染块展开回 `\[latex\]` 纯文本,让模型读到 LaTeX 源码。

- 分隔符为 `\[ ... \]`(纯 LaTeX 显示数学环境,无 `$` 歧义);也检测 `$$ ... $$` 以兼容粘贴内容,但插件产出的公式用 `\[...\]`。

**框架约束(已核验)**:输入框 draft 是经 `input.draft` / `inputActions.setDraft` 暴露的纯字符串;官方插槽系统不提供"把输入框内一段文本替换为 React 节点"的钩子。因此 v1 提供 **KaTeX 预览条**(我们自己的 `conversation.input.dock` 占用者,对 draft 中每个已闭合公式实时渲染成块;点击块可编辑其源码),而不去改动输入框 DOM。真正的原位渲染需要探测输入框 DOM 结构——见[开放问题](#开放问题),在实施期间边查边做。

### 2. 输入法启动器(`launcher.tsx`)

"+" 按钮注册在 `conversation.input.left`(已核验:官方插槽树中存在此插槽,位于输入行左侧)。点击弹出菜单(锚定按钮的绝对定位面板):

| 菜单项         | 打开                 |
| ----------- | ------------------ |
| 手写输入        | 组件 3(portal 模态)    |
| 截图并识别       | 组件 4(portal 模态)    |
| LaTeX 语法编辑器 | 组件 5(dock 面板,开合切换) |

### 3. 手写窗口(`handwriting-pad.tsx`)

React portal 模态(固定遮罩于 `document.body`),参考 AxMath 手写板。

**工具栏**(从左到右):设置、模式切换(auto / number / expression)、橡皮、清空、撤销、提交识别、确认、取消。

**画布**:Pointer Events 采集笔迹(鼠标、触摸、触控笔统一),存储为 `Stroke[]`,贝塞尔平滑曲线。

**识别流程**:停笔后可配置防抖(默认 1.5 秒) -> `isStrokeMeaningful` 过滤噪声 -> `preprocessStrokes` 归一化 -> Web Worker 运行 CoMER 编码器 + 解码器 -> `repairLatex` 修复常见错误 + KaTeX 校验 -> 取首个有效候选。

**结果区**:KaTeX 实时预览 + 可编辑 LaTeX 源码。确认时经 `inputActions.setDraft` 把 `\[latex\]` 写入 draft 并关闭模态;内联渲染器随即接管闭合对。

### 4. 截图识别窗口(`screenshot-ocr.tsx`)

portal 模态,支持三种取图方式:粘贴(Ctrl+V)、上传文件、浏览器截图。取图后:

图片 -> `image-preprocess`(灰度、反色至白线黑底、缩放至 256 高、64px 对齐 padding) -> 同一 CoMER 编码器 + 解码器 -> LaTeX -> KaTeX 预览 + 可编辑 -> 确认经 `setDraft` 插入 `\[latex\]`。

### 5. LaTeX 编辑器(`latex-editor.tsx`)

`conversation.input.dock` 占用者,由启动器切换开合(默认收起;dock 插槽使其与输入框并存,与 dsh-better-input 的 dock 布局策略一致)。左侧代码编辑区,右侧 KaTeX 实时预览。底部符号面板参考 AxMath 底栏:

- 希腊字母行:alpha、beta、gamma、delta、theta、lambda、mu、pi、sigma、phi、omega 等。

- 结构模板行:`\frac{}{}`、`\sqrt{}`、`\sum_{}^{}`、`\int_{}^{}`、`x^{}`、`x_{}`、矩阵模板。

- 点击面板项即在光标处插入对应 LaTeX 片段。

确认后经 `setDraft` 把 `\[latex\]` 写入 draft。

### 6. 设置页(`settings.tsx`)

`settings.section` 占用者(list 基数、root 作用域),侧栏标题绑定语言。Props:`{ close, t, settingsController }`。可配置项:

| 设置项        | 选项                                             |
| ---------- | ---------------------------------------------- |
| 识别模式       | auto / number / expression(vocabulary masking) |
| Beam width | 1(贪心,最快)/ 2 / 3(默认,最佳质量)                       |
| 执行后端       | wasm(默认)/ webgpu(自动探测,2–5 倍速)                  |
| 停笔防抖延迟     | 秒(默认 1.5)                                      |
| 模型缓存       | 显示 IndexedDB 状态 / 清除缓存 / 重新下载(7.2 MB)          |
| 界面语言       | 中文 / 英文(经 `ctx.locale` 跟随 DSH)                 |

模式:`SettingsController` 外部 store 架在 `remote.getSettings/updateSettings` 之上,用 `useSyncExternalStore` 观察;字段先写本地草稿、失焦/变更时保存;Host 经 `validateSettings` 校验并拒绝非法补丁。

## 数据流

### 手写路径

```
Pointer Events -> Canvas Stroke[]
  -> ink-on preprocessStrokes(重采样、贝塞尔、缩放至 256 高)
  -> Web Worker: CoMER 编码器 -> 解码器(ONNX WASM,约 1-2 秒)
  -> repairLatex(括号补全、KaTeX 校验)
  -> LaTeX 字符串 + KaTeX 预览
  -> 用户确认
  -> inputActions.setDraft(draft + \[latex\])
  -> 内联渲染器检测闭合 -> 预览条渲染
```

### 截图路径

```
粘贴 / 上传 / 截图 -> ImageBitmap
  -> image-preprocess(灰度、反色、缩放至 256 高、padding)
  -> 同一 CoMER 编码器 -> 解码器
  -> LaTeX + KaTeX 预览 -> 确认 -> setDraft -> 内联渲染
```

### LaTeX 编辑器路径

```
键盘输入 / 符号面板点击 -> LaTeX 字符串
  -> KaTeX 实时预览(每次按键)
  -> 确认 -> setDraft -> 内联渲染
```

## 构建

两阶段构建,与 dsh-better-input 完全一致:

1. **`tsdown`**——两套配置:

   - Host:入口 `{ index, typert, remote }`(来自 `src/`),`format: 'esm'`、`platform: 'node'`、`target: 'es2022'`、sourcemap。

   - Client:入口 `{ client: 'src/client.ts' }`,`format: 'cjs'`、`platform: 'browser'`,`outputOptions` 的 `banner/footer` 把 bundle 包进 `window.__ModuleLoader__.load({ id: 'dsh-math-input', factory: (require) => { ... return module.exports } })`。外部依赖(`react`、`react/jsx-runtime`、`react-dom`、`@deepseek-ai/cordis` 及各 `@deepseek-ai/dsh-client-*` 框架包)由 DSH 模块加载器的 `require` 解析;**其余全部打入**——包括 `katex`、`onnxruntime-web`、`ink-on`。
2. **`tsc -p tsconfig.build.json`**——仅输出声明到 `lib/`。

`lib/` 提交入库(与 dsh-skills-nexus / dsh-better-input 同一约定);CI 重新构建并校验无漂移。`package.json` `exports` 映射 `.`、`./client`、`./typert`、`./remote`;`files` 发布 `lib/` + `cordis.patch.yml` + README/LICENSE。

Peer 依赖(由 DSH web 应用运行时提供):`@deepseek-ai/cordis ^4.x`、`@deepseek-ai/dsh-client-runtime`、`dsh-client-ui-conversation`、`dsh-client-ui-slots`、`dsh-client-locale`、`dsh-settings`、`dsh-typert-protocol`、`dsh-api-remotes`、`@deepseek-ai/schemastery ^3.18`、`zod ^4`。开发/运行时:`react 18`、`tsdown`、`typescript`、`katex`、`ink-on`、`onnxruntime-web`。

## 测试与 CI

### 质量门(本地可跑)

```
npm run typecheck   # tsc --noEmit(strict)
npm run lint        # ESLint 9 flat config
npm test            # node:test + tsx,无额外框架
npm run build       # tsdown && tsc -p tsconfig.build.json -> lib/
```

### 单元测试

测试位于 `test/`,针对纯逻辑模块。不加载真实 ONNX 模型——引擎用 mock。

| 测试文件                       | 验证内容                               |
| -------------------------- | ---------------------------------- |
| `latex-detect.test.ts`     | `\[...\]` 闭合检测、未闭合保持纯文本、嵌套处理       |
| `latex-repair.test.ts`     | 括号补全、`\frac`/`\sqrt` 参数修正、KaTeX 校验 |
| `preprocess.test.ts`       | 笔迹重采样间隔、张量形状(256 x 64 对齐)、空笔迹过滤    |
| `image-preprocess.test.ts` | 图像 -> 灰度 / 反色 / 缩放 / padding 形状正确性 |
| `engine-mock.test.ts`      | mock InferenceEngine 返回 -> 候选选择逻辑  |

### CI(`.github/workflows/ci.yml`)

push 和 pull request 触发。矩阵跨 Node 20 / 22 / 24。运行:typecheck -> lint -> 单元测试 -> build。并校验提交的 `lib/` 与新构建一致(防漂移)。

### 本地测试(双安装模式)

**Overlay(快速迭代)**——对任意 `dsh web` 安装:

1. `npm install && npm run build`(生成 `lib/`)。
2. 创建 `overlay.yml`,以**绝对路径**插入构建好的 Host 入口:

   ```yaml
   - insert:
       - id: dsh-math-input
         name: '/abs/path/to/dsh-math-input/lib/index.js'
   ```
3. `npx @deepseek-ai/dsh web --patch overlay.yml`——patch 层挂载插件;客户端经包的 `dsh.client` 清单被发现(patch 文件不会改变加载器解析模块路径所用的 profile 目录,所以必须绝对路径)。
4. 在 DSH Web 界面(默认 `http://127.0.0.1:3080`)验证 "+" 按钮、三个输入界面与设置页。

**安装插件**:

1. 推送到 GitHub。
2. `dsh plugin --profile web add github:<owner>/dsh-math-input`(发布后用 npm 包名)。
3. 重启 profile,验证同等功能。

## 关键技术决策

| 决策        | 选择                                                       | 理由                                                               |
| --------- | -------------------------------------------------------- | ---------------------------------------------------------------- |
| 识别引擎      | `ink-on`(CoMER,浏览器 ONNX)                                 | 零 token,模型极小(7.2 MB),框架无关 core,内置 LaTeX 自动修复。训练于手写数学,契合用例。       |
| 截图 OCR    | 复用 CoMER(一个模型)                                           | 避免加载第二个模型。若印刷体准确率不足,在同一接口后接入 pix2tex ONNX。                       |
| 模型托管      | 从 ink-on GitHub Releases 下载 + IndexedDB 缓存               | 无需自建 CDN。首次加载 7.2 MB;后续秒开。                                       |
| LaTeX 分隔符 | `\[ ... \]`(主),`$$ ... $$`(兼容检测)                         | 纯 LaTeX,无 `$` 歧义,模型原生理解。渲染器也检测 `$$` 以兼容粘贴内容。                     |
| 启动器位置     | `conversation.input.left` 插槽                             | 已在官方插槽树中核验存在;无需 CSS 技巧(早期草稿中 `conversation.input.right` 回退方案作废)。 |
| 窗口形态      | 手写/截图:portal 模态。LaTeX 编辑器:`conversation.input.dock` 占用者。 | DSH 无模态插槽;`document.body` portal 是浮动插件 UI 的既有模式。dock 使编辑器与输入框并存。 |
| 输入框写入     | 仅用 `inputActions.setDraft`                               | session 作用域输入插槽的已核验写入面;v1 不做输入框 DOM 改动。                          |
| 内联渲染      | v1:闭合公式的 dock 预览条;原位渲染延后                                 | 输入框 draft 是纯字符串;插槽系统不支持把文本范围替换为 React 节点。见开放问题。                  |
| Host 厚度   | 薄:仅设置的 `TypertRemoteService`(2 个调用)                      | 所有识别在浏览器端。无 `ctx.llm`,除 `settings` 外无 `inject`。                  |
| 契约风格      | 手写 typert/remote/remote-contract 三件套 + zod               | harness 的 Typert 代码生成是内部的;dsh-better-input 证明手写模式可正常发布。          |
| 构建工具链     | tsdown(Host ESM + 包裹的 Client CJS)+ tsc 声明                | `window.__ModuleLoader__` 客户端打包所必需;纯 tsc 产不出包裹后的客户端 bundle。      |
| 测试框架      | `node:test` + tsx                                        | 无额外依赖,与 dsh-skills-nexus 一致。                                     |

## 开放问题

实施期间解决(按约定边查边写):

1. **输入框 DOM 与真正的原位内联渲染**——v1 先交付 dock 预览条。实施期间用浏览器开发者工具检查运行中 `dsh web` 的输入框 DOM,判断是否存在安全、跨版本容忍的原位渲染方案(例如按 draft 偏移对齐的覆盖层),而不与框架对抗。
2. **ink-on 发布资产 URL**——`engine.ts` 中要钉住的编码器/解码器/词表工件的确切 URL 与校验和;核实 7.2 MB 大小与当前 `onnxruntime-web` 的 WebGPU 后端可用性。

## 兼容性

- DeepSeek Harness `>= 0.1.1-rc.2`(Web profile);客户端包按 `@deepseek-ai/dsh-client-*` `0.1.0-rc.8` 的 peer 区间开发(`>=0.0.1-rc.1 <0.1.0 || >=0.1.0-rc.1 <0.2.0-0`)。

- 构建需 Node.js `>= 20.0.0`(harness 本体面向 22.19+/24+)。

- Chromium 内核浏览器(Chrome / Edge),用于 ONNX WASM + WebGPU。

- SharedArrayBuffer 需 COOP/COEP 头以启用多线程 WASM(无则回退单线程)。

## 许可证

插件代码采用 **MIT** 许可证。

第三方依赖及其许可证详见 [THIRD\_PARTY\_NOTICES.md](../THIRD_PARTY_NOTICES.md)。摘要:

- **ink-on**(识别引擎):Apache-2.0 — 宽松许可证,与 MIT 兼容。条件:保留版权与许可声明、标注修改。

- **KaTeX**(LaTeX 渲染):MIT。

- **onnxruntime-web**(推理运行时):MIT。

- **DSH / Cordis**(插件框架):MIT。

- **CoMER 模型权重**(运行时下载,不打包):源仓库无显式许可证。见 THIRD\_PARTY\_NOTICES.md 的来源与风险评估。

- **pix2tex**(可选截图 OCR 备选):MIT。

避免使用:**lia-canvas-ocr**(AGPL-3.0) — 强 copyleft 会强制整个插件变为 GPL。

## 调研来源

本文档已对照以下一手资料核验(2026-08-31):

- `deepseek-ai/deepseek-harness` @ master:`docs/architecture.md`、`docs/development.md`、`docs/subsystems/slots.md`、`docs/subsystems/typert.md`、`docs/subsystems/web-client.md`、`docs/subsystems/client-modules.md`、`docs/user/develop/basic/{index,config}.md`。

- `DIAG5/dsh-better-input` @ v0.1.8(完整源码):`package.json`、`cordis.patch.yml`、`src/index.ts`、`src/config.ts`、`src/config-schema.ts`、`src/remote-contract.ts`、`src/typert.ts`、`src/remote.ts`、`src/about.ts`、`src/polish/service.ts`、`src/client.ts`、`src/client/{index,settings,settings-controller,strings}.ts(x)`、`src/client/{MicrophoneButton,OptimizeButton,VoiceRecognitionBar,conversion-controller}.ts(x)`、`tsdown.config.ts`、`tsdown.client.ts`、`tsconfig{,.build}.json`。

