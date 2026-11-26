# Auto-Feed 重构版｜PT一键转种助手

当前重构分支：<https://github.com/Gawain12/auto_feed_js/tree/refactor-dev>

原项目新版主线：<https://github.com/tomorrow505/auto_feed_js/tree/dev>

这是从原版 **Auto-Feed** 演进而来的新版重构项目。当前开发重点是重新整理站点适配、信息提取、自动填表、图片处理和远程推送等模块，让结构更清晰、功能更容易维护和扩展；原版脚本主要作为现有功能和兼容行为的参考。欢迎更多开发者一起参与新版的站点适配和功能完善。

This is the refactored version evolved from the original **Auto-Feed** project. Current work focuses on reorganizing site adapters, metadata extraction, form filling, image handling, and remote pushing into clearer, more maintainable modules. The original script is mainly used as a reference for existing behavior and compatibility. Contributions to the refactored version are welcome.

## 分支关系
- 原项目 `main`：旧版 legacy，主要作为行为和兼容规则的参考。
- 原项目 `dev`：新版主线，相对稳定；经过验证的修复和适配再向这里提交 PR。
- `refactor-dev`：更快的开发与验证分支，先在这里完成适配、测试和问题修复。

## 当前进度（v5.2.0｜2026-11-26）
- **站点覆盖与分层（155 站，本版 +126 站）**：已对齐原版 `v2.1.1.6` 全部活跃站点。核心影视站（`PTP` / `HDB` / `BTN` / `GPW` / `BLU` / `BHD` / `Tik` / `KG` / `SC` / `CG` / `AvistaZ` / `HDT` / `MTeam` / `PTer` / `HDSky` / `CHDBits` / `CMCT` / `HDChina` / `HDHome` / `OurBits` / `Audiences` / `TTG` / `TJUPT` / `FRDS` / `PThome` / `BTSchool` / `HDArea` / `HDTime` / `HDDolby` / `TCCF` / `HDfans` / `TLFbits` 等）与四大音乐站（`RED` / `OPS` / `DIC` / `OpenCD`）均已完成现网实测；其余 110 个未逐一实测的小站默认折叠在设置页「实验性适配站点」中，按需搜索启用。
- **四大音乐站 & CD `.log`**：支持 `RED` / `OPS` / `DIC` / `OpenCD` 双向转发以及单碟/多碟 CD 抓轨 `.log` 自动透传，同时支持 `jpop` / `lztr` 音乐仅源站。
- **站点类型智能隔离**：转发栏默认按内容类型隔离音乐、电影、剧集、书籍与游戏站（保留 `PTP ↔ BTN` 迷你剧互通），旁侧可一键展开其他站点。
- **信息补全与图床**：支持外站转内站 PTGen 补全、豆瓣详情页一键复制 BBCode、Tik 英文助手与 Wikidata/IMDb 电影画幅比读取，以及 PTPIMG / Pixhost / Freeimage / ImgBB / Hostik / hdbimg 图床与 qBittorrent / Transmission / Deluge 远程推送。
- 详细站点与功能状态见：[`docs/wiki/Site-Support.md`](docs/wiki/Site-Support.md) 与 [`docs/wiki/FEATURE_PARITY.md`](docs/wiki/FEATURE_PARITY.md)。

## 核心功能
- 源站详情页一键转发到目标站上传页（支持按站点类型智能过滤）
- 自动预填标题、简介、媒体信息、图片、种子文件及音乐站 CD `.log`
- IMDb / 豆瓣 / PTGen 信息补全与豆瓣详情页一键复制
- 页面增强（PTP/HDB 等）与快速搜索入口
- 图片转存与图床桥接（PTPIMG / Pixhost / Freeimage / ImgBB / Hostik / hdbimg）
- 远程推送（qBittorrent / Transmission / Deluge）
- 种子清洗（Source / Announce / date / comment 等处理）

## 界面截图

### 设置面板
![设置面板](docs/images/settings.png)

### 站点选择
![站点选择](docs/images/sites.png)

### 图片处理工具
![图片处理工具](docs/images/image_tools.png)

## 安装与版本
1. 安装 Tampermonkey。
2. 安装脚本：
   - GreasyFork 新版项目：<https://greasyfork.org/scripts/595185>
   - 快速开发验证版（`refactor-dev`，更新更快，可能包含待验证改动）
     <https://github.com/Gawain12/auto_feed_js/releases/download/dev/auto_feed.user.js>
   - 发布版（打 Tag `v*` 后）
     <https://github.com/Gawain12/auto_feed_js/releases/latest/download/auto_feed.user.js>
   - 新版主线源码（原项目 `dev`）
     <https://github.com/tomorrow505/auto_feed_js/tree/dev>

## 参与开发

新版欢迎 contributor 参与站点适配、问题修复和功能完善。建议先在 `refactor-dev` 完成开发与真实站点回归，确认稳定后再向原项目 `dev` 提交 PR。

## 使用引导
1. 打开支持站点的种子详情页。
2. 点击标题附近的 `转发/Reupload`。
3. 需要补信息时点击 `点击获取`。
4. 选择目标站跳转上传页，脚本自动预填。
5. 按 `Alt + S` 打开设置面板。

## 本地开发
环境：
- Node.js 18.20.x+
- npm 10+

命令：
```bash
npm install
npm run dev
```

本地只保留一个动态调试入口：
- `http://127.0.0.1:5174/auto-feed-refactor.user.js`
- 启动：`npm run dev`
- 停止：终端按 `Ctrl+C`

说明：
- `npm run dev` 会监听 `src/` 和构建配置，自动重新构建。
- 调试入口是独立的 `[Local Debug]` 脚本，会通过本地 loader 加载完整 bundle，不会覆盖正式版。
- `dist/auto_feed.user.js` 和 `dist/auto-feed-refactor.user.js` 都是构建产物，不要再分别安装成第三个长期版本。
- `npm run build` 只用于发布前构建检查；日常使用安装已发布的 GreasyFork 脚本，需要验证最新改动时使用动态调试入口。

发布前不需要额外拷贝一份全量测试版。需要验证最终构建时，先运行 `npm run build`，再用动态调试入口测试；如果必须同时对比正式版，请使用另一个浏览器配置文件。

后台常驻（screen）：
```bash
npm run dev:screen
npm run dev:screen:attach
npm run dev:screen:stop
```

## 项目结构
- `src/trackers/`：站点级 parse/fill（一站一文件）
- `src/templates/`：框架级模板（NexusPHP、Unit3D、Unit3DClassic）
- `src/common/rules/`：通用纯规则（标题重建、分组名、字段规整）
- `src/services/`：运行时服务（嵌入、增强、图床、远程推送、设置/存储）
- `docs/wiki/`：使用文档、功能对照、开发说明

## 文档导航
- Wiki 首页：[`docs/wiki/Home.md`](docs/wiki/Home.md)
- 使用教程：[`docs/wiki/Usage.md`](docs/wiki/Usage.md)
- 设置说明：[`docs/wiki/Settings.md`](docs/wiki/Settings.md)
- 功能对照：[`docs/wiki/FEATURE_PARITY.md`](docs/wiki/FEATURE_PARITY.md)
- 站点支持：[`docs/wiki/Site-Support.md`](docs/wiki/Site-Support.md)
- 适配教程：[`docs/wiki/Refactor-Adaptation-Tutorial.md`](docs/wiki/Refactor-Adaptation-Tutorial.md)

## License
GPL-3.0
