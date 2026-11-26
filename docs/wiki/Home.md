# Auto-Feed Wiki

## 当前状态（2026-11-26）
- **核心影视与四大音乐站**：主流程及 `RED` / `OPS` / `DIC` / `OpenCD` 均已完成现网 DOM / 上传表单核对与修复。
- **全量 legacy 活跃站对齐**：覆盖旧版 Wiki 活跃站点并经 DNS / 发布路径全量扫描去死链（147 站配置，旧版活跃站 `❌` 清零）；102 个未实测站点默认归入设置页「实验性适配站点」折叠分组，不影响既有默认启用站点。
- **维护基准**：`.legacy/auto_feed.user.js`（上游 `master` `4035eac` / `v2.1.1.6`，`npm run legacy:fetch` 拉取）。

## 分支关系
- 原项目 `main`：旧版 legacy，作为行为和兼容规则参考。
- 原项目 `dev`：新版主线，相对稳定，经过验证的修复再合入。
- `refactor-dev`：快速开发与验证分支，优先完成适配和回归测试。

## 快速入口
- 使用说明：[`Usage.md`](Usage.md)
- 设置说明：[`Settings.md`](Settings.md)
- 站点支持：[`Site-Support.md`](Site-Support.md)
- 功能对照：[`FEATURE_PARITY.md`](FEATURE_PARITY.md)
- 开发说明：[`Development.md`](Development.md)
- 重构适配教程：[`Refactor-Adaptation-Tutorial.md`](Refactor-Adaptation-Tutorial.md)

## 常用链接
- GreasyFork 新版项目：<https://greasyfork.org/scripts/595185>
- 快速开发验证包：<https://github.com/Gawain12/auto_feed_js/releases/download/dev/auto_feed.user.js>
- 新版主线：<https://github.com/tomorrow505/auto_feed_js/tree/dev>
- 旧版 legacy：<https://github.com/tomorrow505/auto_feed_js/tree/main>
