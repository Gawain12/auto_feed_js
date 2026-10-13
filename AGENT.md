# Auto-Feed Maintainer Guide

本文件用于统一协作约束，避免重复回归。

## 目标
- 第一优先级：行为对齐上游 legacy 脚本（`.legacy/auto_feed.user.js`，版本固定在 `scripts/legacy.lock.json`，`npm run legacy:fetch` 拉取）。
  - 注意：本地 `archive/auto_feed.legacy.user.js` 实际是重构版 4.0.3 的构建产物，不是 legacy，不要再用它做对照。
- 第二优先级：在不破坏现有功能前提下简化结构，减少重复逻辑。

## 当前共识
- 非音乐站点：以可用和稳定为主，优先修回归。
- 音乐站点（RED / OPS / DIC / OpenCD）：继续按旧版规则补齐 parse/fill 与转发链路。
- 新站适配：优先“源码对齐 + 实测验证”，而不是只拼 DOM 选择器。
- 本地命令习惯： shell 命令统一通过 `rtk` 前缀执行。

## 代码组织（当前）
- `src/config/sites_*.ts`：站点配置清单。能用数据表达的站点差异写在这里：`uploadPath`、`search`（查重 URL 模板）、`baseUrlSetting`、`preferCurrentHost`、`groupUpload`、表单 `selectors`。
- `src/config/frameworks.ts`：各框架（Nexus / Unit3D / Gazelle）的默认上传路径与查重模板。
- `src/trackers/*`：站点单独实现（一站一文件）。需要代码的站点差异通过 engine 钩子覆写：
  - `parse` / `fill`（Nexus 系另有 `afterParse` / `beforeFill` / `afterFill`）
  - `isSourcePage(url)`：哪些 URL 是详情页（转发 UI、远程推送侧栏都用它）
  - `isFillComplete()`：上传表单是否已填好（未完成时 SiteManager 会重试 fill）
  - `onForwardReceived()` / `recoverForwardMeta()` / `onNonUploadPage()`：多步上传流程（参考 KG）
- `src/templates/*`：站点框架通用实现，不写 `siteName === 'X'` 分支
- `src/common/rules/*`：可复用纯逻辑（无副作用），由 legacy 对比测试覆盖
- `src/common/dom/*`：DOM 小工具（`repeat`、`readFieldValue`、表单赋值）
- `src/services/*`：运行时副作用（DOM/网络/缓存/UI 注入），不写站点分支；需要站点信息时读 config 或调 engine 钩子
- `src/core/*`：站点识别（按 hostname 匹配 `keywords`）、生命周期调度

## 源码对齐适配方法（强制）
1. 先找“上游真规则”
- 先查 `.legacy/auto_feed.user.js`（上游 master，`npm run legacy:fetch` 拉取）。
- 不先写新逻辑，先定位：该站 `uploadPath`、`search` 参数、关键表单 selector、字段映射（category/type/resolution）。

2. 先抄稳定规则，再做最小改造
- 站点级差异优先落在 `trackers/*` 或 `config/*`。
- 模板层只放“多个站共用”的逻辑，避免把单站特例塞进模板导致回归扩散。
- Nexus / Gazelle / Unit3D 均遵循“一站一 tracker + SiteRegistry 一一映射”。

3. 用“链路”思维排查
- 源站 parse -> normalize -> Storage -> 目标站 fill。
- 任何一段字段缺失，后面都必然失败；禁止只看目标页填充代码。

4. 做真实页面验证
- 必做至少 1 条端到端（源站到目标站）。
- 至少覆盖：标题、简介、关键 ID（IMDb/TMDB/Douban）、种子文件注入、发布页关键下拉。

## 改动原则
1. 先在旧脚本确认规则，再改当前实现。
2. 能复用就复用，但不要把站点特例硬塞进通用层。
3. 站点行为必须可追踪到对应 `tracker/config`，避免“看不出逻辑在哪”。
4. 不引入“为了重构而重构”的抽象；优先减少重复代码与行为漂移。
5. 默认不做破坏性 git 操作，不回滚与当前任务无关的用户改动。

## 排错顺序
1. 源站 parse 是否拿到字段。
2. `normalize`/清洗是否改坏。
3. `StorageService` 是否写入/读取一致。
4. 目标站 fill 是否被页面二次渲染覆盖。

## 验收清单
- `npm run check` 通过（typecheck + 全部测试；先 `npm run legacy:fetch`，否则 legacy 对比测试会被跳过）。
- `npm run build` 通过。
- 改了站点 URL 规则时，`tests/fixtures/forward-links.snapshot.txt` 的 diff 只包含预期变化（`UPDATE_SNAPSHOTS=1 npm test -- forward-links` 刷新）。
- 修了规则类 bug 时，把触发样本加进 `tests/fixtures/rules-corpus.ts` 或 `tests/rules.test.ts`。
- 至少做 1 条源站 -> 目标站端到端验证（包含标题、简介、媒介字段、关键 ID、torrent 注入）。
- 若改动站点逻辑，同步更新 `docs/wiki/FEATURE_PARITY.md` 状态说明。

## 近期进度
- 2026-05-18：SC / HDT / TJUPT 完成第二轮稳定性修复。重点包括上传页等待选择器补齐、SC group-only 源页注入、HDT details/torrents 源页兼容、TJUPT 通用 name 与专用 ename/cname 填充分离，以及 Unit3D/Gazelle 统一使用 `targetTitle` 防止标题被通用逻辑覆盖。
- 2026-05-19：修复旧设置未自动启用 SC / TJUPT / HDT 的迁移问题；PTP / SC 发布跳转按 legacy 先检索并附加 `groupid`；SC 目标页改为直接调用 `/imdb.php?code=` 填充 group 字段；HDT / TJUPT 源页增加稳定挂载点。
