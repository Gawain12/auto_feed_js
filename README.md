# Auto-Feed Refactored｜PT一键转种助手

原作者：**tomorrow505**  
当前维护：**gawaint**

仓库地址：<https://github.com/Gawain12/auto_feed_js/tree/refactor-dev>

这是原版 **Auto-Feed**（tomorrow505）的重构版本，目前由 **gawaint** 维护。当前处于功能迁移和兼容适配阶段，正在逐步迁移原版的站点支持、自动填表、图片处理与远程推送能力；现阶段与原版并行使用。

This is a refactored version of the original **Auto-Feed** script by **tomorrow505**, currently maintained by **gawaint**. It is currently in feature migration and compatibility adaptation, gradually bringing the original site support, form filling, image handling, and remote pushing features into the new implementation. It is intended to be used alongside the original script for now.

## 当前进度（2026-09-13）
- 重构版已进入 `v5.0.0`，当前开发发布以 `refactor-dev` 为准；近期提交主要集中在兼容性和稳定性修复，而不是增加新的大功能。
- 非音乐站点主链路（解析 -> 缓存 -> 预填）已基本稳定，Tik 的标题、编码和目标站填充逻辑也已按实际流程持续修正。
- HDB / PTP 的媒体信息、海报和源信息位置已补齐多种页面场景；SC / HDT / TJUPT 已补充源站与目标站链路，但仍需要更多站点实测。
- Monika（MDU）转发链路已按上游源码规则对齐修复（上传路径、搜索参数、关键表单映射）。
- 图片托管与远程推送持续完善，已覆盖 Hostik / hdbimg 等桥接场景，以及 qBittorrent / Transmission / Deluge 推送。
- 音乐站点（RED / OPS / DIC / OpenCD）已接入，但仍在持续补齐双向转发字段和边缘规则；部分小站和历史功能仍处于迁移或待回归阶段。
- 快速搜索已按 `archive/auto_feed.legacy.user.js` 对齐（含 `nzbs.in`、字幕站等独立搜索站点）。
- 详细状态见：[`docs/wiki/FEATURE_PARITY.md`](docs/wiki/FEATURE_PARITY.md)

## 核心功能
- 源站详情页一键转发到目标站上传页
- 自动预填标题、简介、媒体信息、图片等字段
- IMDb -> 豆瓣 / PTGen 信息补全
- 页面增强（PTP/HDB 等）与快速搜索入口
- 图片转存与图床桥接（PTPIMG / Pixhost / Freeimage / ImgBB / Hostik / hdbimg）
- 远程推送（qBittorrent / Transmission / Deluge）
- 种子清洗（Source/Announce/date/comment 等处理）

## 界面截图

### 设置面板
![设置面板](docs/images/settings.png)

### 站点选择
![站点选择](docs/images/sites.png)

### 图片处理工具
![图片处理工具](docs/images/image_tools.png)

## 安装（Release）
1. 安装 Tampermonkey。
2. 安装脚本：
   - Dev（随本项目 `refactor-dev` 分支自动更新）
     <https://github.com/Gawain12/auto_feed_js/releases/download/dev/auto_feed.user.js>
   - Stable（打 Tag `v*` 后）  
     <https://github.com/Gawain12/auto_feed_js/releases/latest/download/auto_feed.user.js>

## GreasyFork 自动同步（重构版新脚本）

可以自动同步，但 GreasyFork 不是通过 Token/API 接收发布：GreasyFork 官方提供的是“从 GitHub 同步脚本 + Webhook 触发更新”。本项目已有 `Dev Release (refactor-dev)` Actions：每次推送 `refactor-dev` 后，会构建并更新 `dev` 预发布包。

这次重构版使用独立的 `@namespace`，会作为新的 GreasyFork 脚本发布，与原作者的旧版 `auto_feed`（脚本 424132）并行使用。

首次启用时：

1. 在 GreasyFork 脚本的 `管理 / 同步` 中设置 GitHub Release 地址：
   `https://github.com/Gawain12/auto_feed_js/releases/download/dev/auto_feed.user.js`
   介绍同步地址填写：
   `https://raw.githubusercontent.com/Gawain12/auto_feed_js/refactor-dev/docs/GreasyFork.md`
   英文介绍在 GreasyFork 管理页添加一个 `English (en)` 的本地化同步项，地址填写：
   `https://raw.githubusercontent.com/Gawain12/auto_feed_js/refactor-dev/docs/GreasyFork.en.md`
2. 打开 GreasyFork 的 Webhook 设置页，复制它生成的 Payload URL 和 Secret。
3. 在 GitHub 仓库 `Settings → Webhooks → Add webhook` 中填写 Payload URL，Content type 选 `application/json`，填入 Secret；事件选择 `Releases`，不要勾选 `Pushes`。

重构版版本从 `5.0.0` 开始独立维护，不跟随原脚本版本号。`refactor-dev` 的每次 Actions 构建会自动追加递增的构建号（如 `5.0.0.123`），保证代码有变化时 GreasyFork 和脚本管理器都能识别为新版本。GreasyFork 会接管脚本最终的 `@downloadURL/@updateURL`，不需要把 GreasyFork Token 放进 GitHub Actions。

## 邀请共同管理者

- 管理 GreasyFork 脚本：进入脚本 `管理 → Authors/作者`，填写对方的 GreasyFork 个人主页完整 URL（形如 `https://greasyfork.org/users/123456`）并发送邀请；对方接受后即可共同管理脚本。

本次重构版只新增 GreasyFork 共同管理者；GitHub 合作权限不在本次发布配置中修改。

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
- `npm run build` 只用于发布前构建检查；正式使用统一安装 GreasyFork 版本。

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
