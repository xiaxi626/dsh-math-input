# 参与贡献 dsh-math-input

感谢考虑为 dsh-math-input（DeepSeek Harness 的零 token 离线数学输入插件）做出贡献。

## 开发环境准备

要求：Node.js >= 20。

```bash
npm install
```

## 常用命令

```bash
npm run typecheck   # TypeScript 类型检查（不产出文件）
npm run build       # 先用 tsdown 打包，再用 tsc 生成类型声明
npm run lint        # 对仓库运行 ESLint
npm run lint:fix    # 运行 ESLint 并自动修复
npm test            # 通过 tsx 使用 Node.js 测试运行器执行测试
```

`lib/` 下的构建产物会提交到仓库（它是 DeepSeek Harness 实际加载的产物），
因此请在提交拉取请求前运行 `npm run build`，并把更新后的 `lib/` 文件一并提交。

## 拉取请求要求

* 保持改动聚焦：一个拉取请求只处理一件事。

* 提交前确保 `npm run typecheck`、`npm run build`、`npm run lint` 全部通过。

* 在可行的情况下，为行为变更在 `test/` 下补充或更新测试。

* 当用户可见行为发生变化时，请在 `CHANGELOG.md` 的 unreleased 条目中更新。

* 面向用户的文案必须通过 locale 文件实现本地化，不要硬编码。

