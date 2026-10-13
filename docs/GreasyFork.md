# Auto-Feed｜PT一键转种助手（重构版）

项目地址：<https://github.com/tomorrow505/auto_feed_js/tree/dev>

这是从原版 Auto-Feed 演进而来的重构版本。我们保留原版熟悉的一键转种流程，把站点适配、信息提取、自动填表、图片处理和远程推送整理成更清晰、可解耦的功能模块，让后续维护和扩展更容易。

目前仍有部分小站、站点细节和边缘流程在迁移适配中，功能会持续补齐。需要适配其他站点时，可以参考仓库现有源码和适配方式提交 PR。

## 已实现功能

- 源站详情页一键转发到目标站上传页
- 自动填写标题、简介、媒体信息和图片
- IMDb、豆瓣、PTGen 等信息补全
- 快速搜索与页面增强
- 图片转存与图床处理（PTPIMG、Pixhost、Freeimage、ImgBB、Hostik、hdbimg）
- 远程推送到 qBittorrent、Transmission、Deluge
- 种子信息清洗与常用字段处理

## 英文界面与可选增强

在详情页点击“脚本设置”或按 **Alt+S**，通过 **中/en** 切换语言。语言会自动保存；刷新站点及图床页面后，快捷工具、图片弹窗和远程侧边栏会使用新语言。豆瓣信息、发布组名、快速搜索等增强可分别关闭，调整后保存并刷新即可。

Tik 发布页可根据现有信息填写英文模板，但不预填任何海报或截图链接，也不会自动转存到 Pixhost。请单独将图片转存到 Hostik，再把生成的“全尺寸封面 + 带原图链接的截图缩略图”BBCode 粘贴回简介开头。电影画幅比优先读取 IMDb 技术规格，不用片源视频显示比例代替；获取失败时留空，可打开 IMDb 技术规格后单独重新读取，不覆盖手工编辑的图片和简介。

“转载后自动下载种子”会在发布成功后下载目标站的 .torrent；推送到 qBittorrent、Transmission 或 Deluge 仍需在详情页侧边栏手动选择客户端与目录，不会发布后自动推送做种。

## 界面预览

![设置面板](https://raw.githubusercontent.com/tomorrow505/auto_feed_js/dev/docs/images/settings.png)

![站点选择](https://raw.githubusercontent.com/tomorrow505/auto_feed_js/dev/docs/images/sites.png)

![图片处理工具](https://raw.githubusercontent.com/tomorrow505/auto_feed_js/dev/docs/images/image_tools.png)

## Tik 填写示例

以下为当前适配器使用示例数据生成的界面，未向真实站点提交发布。

![Tik 图片转存提示和 IMDb 电影画幅比](https://raw.githubusercontent.com/Gawain12/auto_feed_js/refactor-dev/docs/images/tik-upload-hostik.zh.jpg)
