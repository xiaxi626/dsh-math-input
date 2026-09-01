# 贡献指南

[English](CONTRIBUTING.md) | **中文**

感谢你有兴趣贡献！本指南涵盖源码结构、本地开发和质量门禁。

本地测试（编译 → overlay → DSH → 验证）请看 README 的
**[本地测试](README_CN.md#本地测试)**。
插件装载验证（file: 本地源 → 冷启动 → UI 检查 → 清理）见
**[插件装载验证](docs/verify-plugin-install.zh-CN.md)**。

## 项目结构

```
src/
├── index.ts                      # Host 插件入口 — 注册设置服务
├── config.ts                     # 设置域模型 + 验证 (zod)
├── config-schema.ts              # Host 端 schemastery 设置 schema
├── settings-service.ts           # Typert 远程服务: getSettings / updateSettings
├── typert.ts                     # Typert manifest 贡献
├── remote.ts                     # Remote 描述符 (mathInput 命名空间)
├── remote-contract.ts            # 传输类型的 zod schema
├── strings.ts                    # UI 多语言字符串 (en / zh-CN)
├── latex/
│   ├── render.ts                 # LaTeX 块检测 + KaTeX 渲染
│   └── repair.ts                 # LaTeX 自动修复启发式
├── recognition/
│   ├── preprocess.ts             # 笔触模型、边界框、噪声过滤
│   ├── image-preprocess.ts       # 图像 → 张量管道（灰度、缩放、填充、mask）
│   └── engine.ts                 # 识别引擎 facade（ink-on 懒加载、IndexedDB 缓存）
└── client/
    ├── index.tsx                 # Client 插件入口（slots、locale、settings）
    ├── ui-store.ts               # 共享 UI 状态（modal 开关）
    ├── settings.tsx              # 设置页组件
    ├── settings-controller.ts    # 设置控制器（加载、更新、语言）
    ├── modal.tsx                 # 共享 Portal 弹窗组件
    ├── launcher.tsx              # "+" 按钮菜单（手写 / 截图 / LaTeX 编辑器）
    ├── handwriting-pad.tsx       # 手写板（Canvas + 识别）
    ├── screenshot-ocr.tsx        # 截图 OCR 对话框
    ├── latex-editor.tsx          # LaTeX 编辑器 dock（希腊字母、模板、实时预览）
    └── inline-renderer.tsx       # 草稿区 LaTeX 内联渲染
```

Host 模块（`settings-service.ts`、`config-schema.ts`）运行在 Node 端，不打进 client bundle。Client 模块（`client/*.tsx`）运行在浏览器中，使用 React + DSH UI slots。

完整架构图和设计决策见 **[docs/ARCHITECTURE.zh-CN.md](docs/ARCHITECTURE.zh-CN.md)**。

## 开发：测试与 CI

质量门禁，本地全部可跑：

```bash
npm run typecheck   # tsc --noEmit（strict）
npm run lint        # ESLint 9 + typescript-eslint（flat config）
npm test            # 单元测试 — node:test + tsx
npm run build       # tsdown + tsc → lib/
```

测试位于 `test/`，覆盖纯逻辑模块：

| 模块 | 测试文件 | 覆盖内容 |
|---|---|---|
| `src/config.ts` | `test/config.test.ts` | 设置验证、默认值、patch 合并 |
| `src/latex/render.ts` | `test/latex-render.test.ts` | LaTeX 块检测、闭合/开放块规则 |
| `src/latex/repair.ts` | `test/latex-repair.test.ts` | LaTeX 修复启发式 |
| `src/recognition/preprocess.ts` | `test/preprocess.test.ts` | 笔触边界、噪声过滤、笔触采样 |
| `src/recognition/image-preprocess.ts` | `test/image-preprocess.test.ts` | 灰度、反转、缩放、填充、mask、行分割、对比度归一化 |
| `src/remote-contract.ts` | `test/remote-contract.test.ts` | 传输类型的 zod schema 验证 |

CI（`.github/workflows/ci.yml`）在 push/PR 时于 Node 20/22/24 上运行：
typecheck、lint、单元测试、build，以及「已提交的 `lib/` 是否与最新源码一致」的校验。

### 为什么 `lib/` 要提交

本插件直接从 GitHub 安装（`dsh plugin add github:owner/repo`），不是从 npm 安装。
DSH 的插件加载器期望 `lib/` 已经存在 — 安装时没有构建步骤。因此 `lib/` 必须
提交并与 `src/` 保持同步。

CI 的「Verify committed lib/ is up to date」步骤会自动检测漂移。

## 拉取请求要求

* 保持改动聚焦：一个 PR 只处理一件事。
* 提交前确保 `npm run typecheck`、`npm run build`、`npm run lint`、`npm test` 全部通过。
* 在可行的情况下，为行为变更在 `test/` 下补充或更新测试。
* 当用户可见行为发生变化时，请在 `CHANGELOG.md` 的 unreleased 条目中更新。
* 面向用户的文案必须通过 locale 文件实现本地化，不要硬编码。

## 文档

- [架构 — 模块布局、识别管道、设置流程](docs/ARCHITECTURE.zh-CN.md)
- [识别引擎 — 模型、预处理、缓存](docs/recognition-engine.md)
- [本地测试指南 — overlay.yml 配置与 DSH 启动](docs/local-testing.zh-CN.md)
- [插件装载验证 — file: 本地源安装 → 冷启动 → UI 检查 → 清理](docs/verify-plugin-install.zh-CN.md)
- [更新日志](CHANGELOG.md)
