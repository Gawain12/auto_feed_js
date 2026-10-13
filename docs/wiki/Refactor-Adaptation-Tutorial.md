# Refactor Adaptation Tutorial

本教程用于指导开发者在重构版中新增站点支持或修复站点回归。  
目标是让你用最短路径完成一条可提交、可复现、可回归验证的适配链路。

核心原则：
1. 先对齐 `.legacy/auto_feed.user.js`（上游 master，`npm run legacy:fetch` 拉取） 的已验证行为。
2. 不要只改 DOM 选择器。真正要打通的是 `parse -> normalize -> storage -> fill -> forward`。
3. 站点特例必须放在站点独立文件，避免把站点逻辑塞回模板。

## 1. 准备开发环境

```bash
git clone <your-fork-or-repo-url>
cd auto_feed_js
npm install
npm run dev
```

本地安装脚本入口：
- `http://127.0.0.1:5174/auto-feed-refactor.user.js`

构建检查：

```bash
npm run build
```

## 2. 先确认开发目标

建议先打开：
1. `docs/wiki/FEATURE_PARITY.md`
2. `docs/wiki/Site-Support.md`

选一个你有账号、能真实登录、可实际上传测试的站点。  
没有真实环境的“盲改”成功率很低，且容易引入模板回归。

## 3. 用源码定位“真规则”

### 3.1 先找 legacy 对应片段

所有适配以 `.legacy/auto_feed.user.js`（上游 master，`npm run legacy:fetch` 拉取） 为基线。  
推荐先用 `rg` 定位，再局部阅读：

```bash
rg -n "站点名|set_jump_href|default_search_list|add_search_urls|autotype|autores|browsecat|source_sel" .legacy/auto_feed.user.js
```

你需要确认 4 类规则：
1. 上传页跳转规则（upload URL / category 参数）
2. 查重搜索规则（search URL / imdb/name 参数）
3. 表单字段规则（标题、副标题、描述、IMDb、torrent 文件输入）
4. 下拉与标签规则（type / medium / codec / resolution / tags）

### 3.2 如何从 legacy 反推新架构落点

把 legacy 中的规则映射到当前项目：
1. 站点识别：`src/config/sites_*.ts` 的 `keywords`（按 hostname 匹配）
2. 上传 URL / 查重 URL：同一配置里的 `uploadPath` / `search`（不写则用 `src/config/frameworks.ts` 的框架默认值）
3. 通用模板逻辑：`src/templates/*`
4. 站点特例逻辑：`src/trackers/<Site>.ts`（详情页判定 `isSourcePage`、填表完成判定 `isFillComplete` 也在这里）
5. 快速搜索：`src/common/quickSearch.ts`

### 3.3 快速定位常见关键词

按问题类型搜关键词：
1. 转发 URL 问题：`rg -n "uploadPath|search:" src/config`（快照见 `tests/fixtures/forward-links.snapshot.txt`）
2. 预填字段问题：`rg -n "nameInput|descrInput|imdbInput|torrent" src`
3. 站点识别问题：`rg -n "keywords|match|siteEngineMap" src/config src/core`
4. 快搜问题：`rg -n "DEFAULT_QUICK_SEARCH_TEMPLATES|buildQuickSearchItems" src/common`

## 4. 按“一站一文件”实现

### 4.1 创建或更新站点引擎文件

规范：
1. 每个站点有独立 tracker 文件：`src/trackers/<Site>.ts`
2. 站点绑定在 `siteEngineMap` 一一对应
3. 模板只保留通用能力，不写 `if (siteName === ...)` 的站点分支

最小实施步骤：
1. 在 `src/config/sites_*.ts` 增加或更新站点配置：`keywords`、`baseUrl`，以及和框架默认值不同的 `uploadPath` / `search`
2. 只有配置不够时才新增 `src/trackers/<Site>.ts`，并在 `src/core/SiteRegistry.ts` 的 `siteEngineMap` 注册
3. 把站点特有逻辑写到该 tracker：parse/fill 钩子；详情页 URL 特殊时覆写 `isSourcePage`；上传页要等特定字段时覆写 `isFillComplete`
4. 运行 `npm test`，确认 `forward-links` 快照只出现该站点的新增行，然后 `UPDATE_SNAPSHOTS=1 npm test -- forward-links` 刷新

示例（只靠配置接入的 Unit3D 站）：

```ts
{
    name: 'Example',
    type: SiteType.Unit3DClassic,
    keywords: ['example.cc'],
    baseUrl: 'https://example.cc/',
    search: { imdb: 'torrents?imdbId={imdb}', name: 'torrents?name={name}' }
}
```

### 4.2 parse 端建议

parse 端至少稳定拿到：
1. `title`
2. `description`
3. `imdbId/imdbUrl`（若可取）
4. `doubanId/doubanUrl`（若可取）
5. `torrentUrl` 或 `torrentBase64`

建议做法：
1. 先写“稳定拿到信息”，再做“精细清洗”
2. 对复杂页面做多选择器兜底
3. 统一在 `normalizeMeta` 链路验证字段是否被改写

### 4.3 fill 端建议

fill 端优先保证：
1. 标题、描述、IMDb、torrent 文件能成功入框
2. 必填下拉（type/source/resolution）能被正确设置
3. 触发 `input/change` 事件，兼容站点二次渲染

避免常见错误：
1. 只 `el.value=...` 不触发事件
2. 忽略站点动态重渲染导致值被清空
3. 把单站逻辑写进模板影响其他站

## 5. 本地编译与实测

### 5.1 编译与自动测试

```bash
npm run legacy:fetch   # 第一次运行时
npm run check
npm run build
```

`npm run check` 里的 legacy 对比测试会检查公共规则（媒介、编码、标签等）有没有偏离上游脚本，没有站点账号也能跑。

### 5.2 端到端实测（必须）

至少完成 1 条真实链路：
1. 在源站详情页触发 `转发/Reupload`
2. 打开目标上传页
3. 验证标题/描述/IMDb/torrent 是否正确
4. 验证关键下拉与标签是否符合站点要求

### 5.3 同架构回归

如果你改了模板或公共逻辑，至少再测 1 个同架构站点：
1. Nexus 相关改动：再测一个 Nexus 站
2. Gazelle 相关改动：再测一个 Gazelle 站
3. Unit3D 相关改动：再测一个 Unit3D 站

## 6. 提交 PR

建议流程：

```bash
git checkout -b feature/<site>-support
git add .
git commit -m "feat: add <site> support"
git push origin feature/<site>-support
```

先在 `refactor-dev` 完成真实站点验证和同架构回归；确认稳定后，再将整理好的修复或适配提交到原项目 `dev` 主线。

PR 描述建议包含：
1. 改动站点与架构类型
2. 对齐的 legacy 规则片段（关键词即可）
3. 实测结果（源站 -> 目标站）
4. 回归测试范围

## 7. 常见问题排查

1. 转发按钮能开页但填充为空：先查 storage 与字段名映射
2. IMDb 明明有却没填：检查 parse 提取与 fill 输入框 name/id
3. torrent 没注入：检查 file input 选择器和事件触发
4. 下拉总是错误：确认站点使用 value、text 还是 index 映射
5. 改了一个站，其他站坏了：检查是否把特例写进模板

## 8. 新人上手最短路径

如果你是第一次参与，推荐这条顺序：
1. 选一个你可登录测试的站点
2. 在 legacy 中先找 upload/search/type 规则
3. 复制一个同架构 tracker 做最小改造
4. 跑通一条真实转发链路
5. 补回归测试并提交 PR

只要严格执行“先对齐源码规则，再做实测”，适配效率会明显提升。
