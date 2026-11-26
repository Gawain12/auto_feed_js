# Auto-Feed Refactor 功能对照表

更新时间：2026-11-26

2026-11-26（`v5.2.0` 全站对齐与现网实测）：
- 音乐站（`RED` / `OPS` / `DIC` / `OpenCD`）双向转发实测完成，并支持单碟/多碟 CD `.log` 自动透传；新增 `jpop` / `lztr` 仅源站。
- 新增并实测 `BTN`、`AvistaZ` / `CinemaZ` / `PrivateHD`、`CG`、`HDT`、`FileList`、`bib` 及 `HDChina` / `HDfans` / `TLFbits` / `FRDS` / `PThome` / `BTSchool` / `HDArea` / `HDTime` / `HDDolby` / `TCCF` 等站；对齐原版 `v2.1.1.6` 全部活跃站（未实测小站折叠至实验性分组，已永久关站站点归档为 `🗄️`）。
- 新增站点内容类型智能隔离（音乐/电影/剧集/书籍/游戏，保留 `PTP ↔ BTN` 迷你剧互通）；恢复豆瓣详情页一键复制完整 PTGen BBCode；Tik / Hostik 助手固定英文并接入 Wikidata + 一键从 IMDb 读取电影画幅比；修复外站转内站 PTGen、`CMCT` 表单重复填充与 4K 杜比视界原盘分辨率误判。

2026-10-13：补齐英文快捷工具、图床弹窗、远程客户端侧边栏及状态提示；Tik 改为不预填海报和截图，说明可从目标页打开 Hostik 并使用转种携带的图片。Film Aspect Ratio 自动读取 IMDb 技术规格 DOM / JSON 字段，不以视频 DAR 代替；页面显示自动读取结果，不再提供手动跳转或重读按钮。

2026-10-13（结构整理）：legacy 对照改为固定上游 master 提交（`scripts/legacy.lock.json`），新增公共规则与 legacy 的自动对比测试。据此修复：标题中音频声道被拆成 `DDP5 1` 的回归；同步上游的 UHD 压制识别为 Encode、副标题优先取中文片名且无译名时回退片名。站点识别改为只匹配域名；上传/查重地址改为站点配置模板（全部站点 URL 由快照测试锁定，未变化）。

本文档对照原版 Wiki（`auto_feed_js.wiki/支持的站点.md`）并同步当前重构进度：
- 标题 `✅` = 该模块核心能力已可用
- 列表项 `~~删除线~~` = 该功能点已实现/已还原
- 列表项 `✨` = 重构版新增/独有功能
- 文字 `**加粗**` = 仍缺失或仍在补齐的细节

---

## 📖 1. 安装与准备

### ✅ 安装与基础
- ~~安装油猴~~
- ~~安装脚本 (从 Releases 安装)~~
- ~~支持的站点（架构层面）~~
- ~~更新日志~~

**同步说明**:
- 主流影视站与四大音乐站（`RED` / `OPS` / `DIC` / `OpenCD`）均已实测可用；未实测站点在设置页默认折叠至「实验性适配站点」。

---

## ⚙️ 2. 界面与设置

### 设置界面
- ~~转发站点设置~~
- ~~脚本设置站点（独立面板）~~
- ~~常用站点（收藏）设置~~
- ~~远程推送配置面板~~
- ✨ 简约风格设置 UI
- ✨ 中英文切换
- ✨ 保存设置状态反馈（Saving / Saved / Failed）
- ✨ 站点搜索筛选与「仅看已启用」切换（自动区分仅源站）

### 🚧 细节差距
- **快搜模板编辑体验**: 已有基础编辑；默认预设已按 legacy 源码模板对齐（含 `nzbs.in` / 字幕站等独立站点），**编辑交互细节仍可继续打磨**。
- **站点排序能力**: **未实现**（目前按现有顺序/字母展示）。

---

## 📄 3. 源种子页面

### ✅ 界面识别与按钮注入
- ~~NexusPHP 界面识别~~
- ~~Unit3D / Unit3D Classic 界面识别~~
- ~~Gazelle 界面识别~~
- ~~详情页转发入口注入~~

### 🚧 细节差距
- **音乐站点源页字段提取**: **仍在补齐边缘场景**。
- **少量站点页面改版兼容**: **需持续回归**。

---

## 🔄 4. 转载功能（核心链路）

### NexusPHP 转载
- ~~MTeam / HDSky / CHDBits / HDB / TTG / PTer / CMCT / HDHome / OurBits / Audiences / HDChina / FRDS / TJUPT~~（已实测）
- ~~PThome / BTSchool / HDArea / HDTime / HDDolby / TCCF / HDfans / TLFbits~~（已实测）
- ~~OpenCD~~（已实测，含 CD `.log` 透传）

### Unit3D / Unit3D Classic / AvistaZ 转载
- ~~BHD / BLU / Tik / Monika / KG / AvistaZ / CG / HDT~~（已实测）
- **ACM / HDF / CinemaZ / PrivateHD**（已实现，同框架复核）

### Gazelle 转载
- ~~PTP / GPW / BTN~~（已实测）
- ~~RED / OPS / DIC~~（已实测，含 CD `.log` 透传）

### 🚧 缺失站点/功能
- **大量历史站点**目前仍是“旧版 Wiki 记录存在，但重构版未实现或未测试”，请以下方全量站点表为准。

---

## 🌐 5. 辅助功能

### ✅ 图片转存与处理
- ~~单图转存（PTPIMG / PIXhost / Freeimage）~~
- ~~多图到 PIXhost（批量识别）~~
- ~~拉取图像跳转上传（HDBits / imgbox / pixhost 等）~~
- ~~截图提取与链接清洗~~
- ✨ HDB 保留原始 JPG 浏览体验，需要转存时再按 legacy 方式本地下载 PNG
- ✨ Hostik / hdbimg 桥接支持（Hostik 根据原资源标题免点击创建/复用相册，完成上传后自动弹出结果）

### ✅ 信息增强
- ~~IMDb -> 豆瓣基础获取~~
- ~~PTGen 基础获取~~
- ~~PTP / HDB 页面增强（评分、快搜入口，含 PTP 豆瓣延迟恢复）~~
- ~~豆瓣详情页一键复制完整 BBCode（复制 / 复制并转存海报 / 转存封面）~~

### 🚧 缺失辅助功能
- **部分站点中文信息覆盖**: **尚未全覆盖**。
- ~~禁转规则库~~（已同步上游 `v2.1.1.6` 跨站禁转提示规则）
- **一键签到 / 视频处理等旧版扩展能力**: **未实现**。

---

## 🧰 6. 种子清洗与推送

### ✅ 远程推送
- ~~qBittorrent~~
- ~~Transmission~~
- ✨~~Deluge~~
- ✨~~远程推送路径映射~~
- ✨~~客户端连接测试~~

### ✅ 种子清洗
- ~~移除 comment / created by~~
- ~~随机化 date~~
- ~~Source 注入~~
- ~~Announce 替换~~

### 🚧 细节差距
- **自动下载链路**: 已有基础能力，但 **仍需持续回归不同站点场景**。

---


## 全量站点清单（来自旧 Wiki）

| 站点 | 链接 | 支持转入 | 支持转出 | 当前实现 | 测试状态 | 原始备注 |
| --- | --- | --- | --- | --- | --- | --- |
| 1PTBA | https://1ptba.com/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 壹PT吧 |
| 52PT | https://52pt.site/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 吾爱PT |
| ACM | https://asiancinema.me/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 亚洲影视站点，unit3d |
| AGSV | https://www.agsvpt.com/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 末日种子库 |
| Aither | https://aither.cc/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 外站，unit3d |
| ANT | https://anthelion.me/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 实验性（待测试） | 国外GZ影视，活跃度较低 |
| avz | https://avistaz.to/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已实测（源/上传页） | 亚洲影视，较为活跃 |
| Audiences | https://audiences.me/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已测试 | 观众，官组活跃 |
| BHD | https://beyond-hd.me/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已测试 | 国外高清影视站点，unit3d |
| bib | https://bibliotik.me/ | :x: | :heavy_check_mark: | ✅ | 已实测（仅源站） | 世界第一电子书站 |
| bit-hdtv | https://www.bit-hdtv.com/ | :x: | :heavy_check_mark: | ✅ | 实验性（仅源站） | 乍一看像个NP架构的外站 |
| BLU | https://blutopia.xyz/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已测试 | 国外高清影视站点，unit3d |
| BlueBird | https://bluebird-hd.org/ | :x: | :heavy_check_mark: | ✅ | 实验性（仅源站） | 蓝鸟，俄罗斯站点，保种易活 |
| BTN | https://broadcasthe.net/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已实测（源/上传页） | 鼻涕妞，世界第一剧集站 |
| BTSchool | https://pt.btschool.club/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已实测（上传表单） | 学校 |
| bwtorrents | https://bwtorrents.tv/ | :x: | :heavy_check_mark: | ✅ | 实验性（仅源站） | 印度影视站，不清楚 |
| BYR | https://byr.pt/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 实验性（待测试） | 北邮教育站 |
| CarPt | https://carpt.net/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 车PT |
| CG | https://cinemageddon.net/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已实测（上传页） | 小众低分影视，逼格站 |
| CMCT | https://springsunday.net/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已测试 | 不可说，请进 |
| CNZ | https://cinemaz.to/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试（同 AvistaZ 引擎） | avz姐妹站，欧洲/老旧影视 |
| CHDBits | https://ptchdbits.co/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已测试 | 彩虹岛 |
| CrabPt | https://crabpt.vip/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 蟹黄堡 |
| Cyanbug | https://cyanbug.net/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 大青虫 |
| DarkLand | https://darkland.top/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 外站，unit3d |
| DICMusic | https://dicmusic.club/ | :x: | :heavy_check_mark: | ✅ | 已实测修复（双向） | 海豚，音乐站，GZ架构 |
| digitalcore | https://digitalcore.club/ | :x: | :heavy_check_mark: | ✅ | 实验性（仅源站） | 国外影视站，不是很清楚 |
| DiscFan | https://discfan.net/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 碟粉 |
| Dragon | https://www.dragonhd.xyz/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 龙之家 |
| FileList | https://filelist.io/ | :x: | :heavy_check_mark: | ✅ | 已实测（仅源站） | 宇宙第二影视站，罗马尼亚站 |
| FNP | https://fearnopeer.com/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 外站，unit3d |
| FRDS | https://pt.keepfrds.com/ | :x: | :heavy_check_mark: | ✅ | 待测试 | 月月，x265压制 |
| FreeFarm | https://pt.0ff.cc/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 自由农场 |
| GGPT | https://www.gamegamept.com/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 实验性（待测试） | 国内游戏站，不了解 |
| GPW | https://greatposterwall.com/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已测试 | 海豹，狗屁王，国内GZ影视 |
| HaiDan | https://www.haidan.video/ | :heavy_check_mark: | :x: | ✅ | 实验性（待测试） | 海胆 |
| ~~HD4FANS~~ | ~~https://pt.hd4fans.org/~~ | :heavy_check_mark: | :heavy_check_mark: | 🗄️ | 已关站/上游移除 | 兽站，难入 |
| HDArea | https://hdarea.club/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已实测（上传表单） | 高清地带，好大啊 |
| ~~HDAtmos~~ | ~~https://hdatmos.club/~~ | :heavy_check_mark: | :heavy_check_mark: | 🗄️ | 已关站/上游移除 | 阿童木 |
| HDB | https://hdbits.org/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已测试 | 海德堡，世界第一高清影视 |
| HDChina | https://hdwing.org/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已实测修复（上传表单） | 瓷器（回归新域 hdwing.org，含转载规则与复合分类） |
| HDCity | https://hdcity.city/ | :heavy_check_mark: | :x: | ✅ | 实验性（待测试） | 城市，不活跃 |
| HDDolby | https://www.uhddolby.com/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已实测（上传表单） | 高清杜比 |
| HDF | https://hdf.world/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 实验性（已切至 Gazelle 引擎） | 法国站点，保种即活 |
| HDfans | http://hdfans.org/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 红豆饭 |
| HDHome | https://hdhome.org/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已测试 | 家园 |
| ~~HDMaYi~~ | ~~http://hdmayi.com/~~ | :heavy_check_mark: | :heavy_check_mark: | 🗄️ | 已关站/上游移除 | ~~蚂蚁PT~~【已关站】 |
| HDOli | https://hd-olimpo.club/ | :x: | :heavy_check_mark: | ✅ | 待测试 | 盗版HDO，哈哈~ |
| ~~HDPost~~ | ~~https://pt.hdpost.top/~~ | :heavy_check_mark: | :heavy_check_mark: | 🗄️ | 已关站/上游移除 | 普斯特国内unit3d，界面好看 |
| ~~HDPt~~ | ~~https://hdpt.xyz/~~ | :heavy_check_mark: | :heavy_check_mark: | 🗄️ | 已关站/上游移除 | 明教，新小站 |
| HDRoute | http://hdroute.org/ | :heavy_check_mark: | :x: | ✅ | 待测试 | 不能说 |
| HDSky | https://hdsky.me/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已测试 | HDSky |
| HDSpace | https://hd-space.org/ | :heavy_check_mark: | :x: | ✅ | 实验性（待测试） | 不是很了解 |
| HDT | https://hd-torrents.org/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已实测（源/上传页） | 核弹头；已修复 40 位 hex infohash 识别与详情页嵌入锚点 |
| HDTime | https://hdtime.org/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已实测（上传表单） | 高清时光 |
| HDU | https://pt.hdupt.com/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 好多油 |
| HDVideo | https://hdvideo.one/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 国内新站 |
| HD-Only | https://hd-only.org/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 实验性（待测试） | 法国站点，不活跃ban |
| HHClub | https://hhanclub.top/ | :x: | :heavy_check_mark: | ✅ | 实验性（待测试） | 憨憨club，WEB站 |
| HITPT | https://www.hitpt.com/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 实验性（待测试） | 百川 |
| HUDBT | https://hudbt.hust.edu.cn/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 实验性（待测试） | 华科蝴蝶教育站 |
| ICC | https://www.icc2022.com/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | ICC |
| iloli | https://share.ilolicon.com/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 国内新站，iloli |
| IPT | https://iptorrents.com/ | :x: | :heavy_check_mark: | ✅ | 实验性（仅源站） | 宇宙第一，HR长 |
| ITZMX | https://pt.itzmx.com/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 新小站，不温不火 |
| iTS | https://shadowthein.net/ | :heavy_check_mark: | :x: | ✅ | 实验性（仅源站） | 逼格站，曾经PTP跳板 |
| JoyHD | https://www.joyhd.net/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 小站，不明 |
| jpop | https://jpopsuki.eu/ | :x: | :heavy_check_mark: | ✅ | 已实测（仅源站） | 亚洲音乐站，保种即可 |
| ~~JPTV~~ | ~~https://jptv.club/~~ | :heavy_check_mark: | :heavy_check_mark: | 🗄️ | 已关站/上游移除 | 日本影视站，unit3d |
| KG | https://karagarga.in/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已测试 | 外站，小众影视站点 |
| KuFei | https://kufei.org/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 库非，新站 |
| LemonHD | https://lemonhd.club/torrents.php | :heavy_check_mark: | :heavy_check_mark: | ✅ | 实验性（待测试） | 柠檬，重开 |
| lztr | https://lztr.me/ | :x: | :heavy_check_mark: | ✅ | 已实测（仅源站） | GZ音乐站，支持图标与 AJAX 解析 |
| Monika | https://monikadesign.uk/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已测试 | 国内unit3d，动漫 |
| MTeam | https://kp.m-team.cc/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已测试 | 馒头，内站高性价比 |
| ~~MTV~~ | ~~https://www.morethantv.me/~~ | :heavy_check_mark: | :heavy_check_mark: | 🗄️ | 已关站（2026-08） | 曾经剧集站，已永久关站 |
| NanYang | https://nanyangpt.com/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 实验性（待测试） | 西交教育站 |
| ~~NapQAQ~~ | ~~https://pt.napqaq.top/~~ | :heavy_check_mark: | :heavy_check_mark: | 🗄️ | 已关站/上游移除 | ~~新小站~~【已关站】 |
| NBL | https://nebulance.io/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 实验性（待测试） | 欧美剧集站，FL可入 |
| NJTUPT | https://njtupt.top/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 实验性（待测试） | 南工大教育站 |
| NPUPT | https://npupt.com/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 实验性（待测试） | 蒲公英教育站，外网不开放 |
| OKPT | https://www.okpt.net/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 国内新站 |
| OnlyEncodes | https://onlyencodes.cc/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 外网影视站，unit3d |
| OpenCD | https://open.cd/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已实测修复（双向） | 皇后，国内音乐佼佼者 |
| OPS | https://orpheus.network/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已实测修复（双向） | GZ音乐站，已适配 |
| Oshen | http://www.oshen.win/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 欧神 |
| OurBits | https://ourbits.club/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已测试 | 我堡 |
| PHD | https://privatehd.to/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试（已切至 AvistaZ 引擎） | avz姐妹站，英语影视 |
| Panda | https://pandapt.net/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 熊猫站 |
| PigGo | https://piggo.me/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 猪猪网 |
| PTcafe | https://ptcafe.club/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 咖啡，国内新站 |
| PTer | https://pterclub.com/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已测试 | 猫站，通天下 |
| PTFans | https://ptfans.cc/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 国内新站 |
| PThome | https://www.pthome.net/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已实测（上传表单） | 铂金 |
| PTLGS | https://ptlgs.org/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 国内新站，劳改所 |
| ~~PTMSG~~ | ~~https://pt.msg.vg/~~ | :heavy_check_mark: | :heavy_check_mark: | 🗄️ | 已关站/上游移除 | ~~买水果，已关站~~【已关站】 |
| ~~PTNIC~~ | ~~https://www.ptnic.net/~~ | :heavy_check_mark: | :heavy_check_mark: | 🗄️ | 已关站/上游移除 | ~~小站~~【已关站】 |
| PTP | https://passthepopcorn.me/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已测试 | 皮，世界第一电影站 |
| PTsbao | https://ptsbao.club/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 烧包 |
| PTT | https://www.pttime.org/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 5元神站 |
| PTZone | https://ptzone.xyz/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 国内新站 |
| PuTao | https://pt.sjtu.edu.cn/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 实验性（待测试） | 上交葡萄教育站 |
| QingQa | https://qingwapt.com/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 青蛙 |
| RED | https://redacted.sh/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已实测修复（双向） | 红，世界第一音乐站 |
| ReelFlix | https://reelflix.xyz/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 外网影视站，unit3d |
| RouSi | https://rousi.pro/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 实验性（待测试） | 新版 React 表单 |
| RS | https://resource.xidian.edu.cn/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 实验性（待测试） | 西电教育站，外网不开 |
| SC | https://secret-cinema.pw/ | :heavy_check_mark: | :heavy_check_mark: | ⚠️ | 本地流程验证 | 小众电影外站，GZ架构；已补 source/target tracker，支持 group-only 源页注入与 SC 上传字段 |
| SoulVoice | https://pt.soulvoice.club/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 铃音 |
| TCCF | https://et8.org/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已实测（上传表单） | 教育资源站 |
| Tik | https://www.cinematik.net/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已测试 | 题库，小众原盘站点，逼格站 |
| TJUPT | https://www.tjupt.org/ | :heavy_check_mark: | :heavy_check_mark: | ⚠️ | 本地流程验证 | 北洋，天大教育站；已补 source/target tracker，拆分通用 name 与专用 ename/cname 填充 |
| TLFbits | http://pt.eastgame.org/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 吐鲁番，小体积 |
| ~~TorrentDB~~ | ~~https://torrentdb.net/~~ | :x: | :heavy_check_mark: | 🗄️ | 已关站/上游移除 | ~~已关站~~ |
| TorrentLeech | https://www.torrentleech.org/ | :x: | :heavy_check_mark: | ✅ | 待测试（仅源站） | 0day站，HR时间长 |
| TTG | https://totheglory.im/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 已测试 | 听听歌，老牌必进 |
| TVV | http://tv-vault.me/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 实验性（待测试） | 欧美剧集站 |
| U2 | https://u2.dmhy.org/ | :x: | :heavy_check_mark: | ✅ | 实验性（仅源站） | 幼儿园，二刺猿 |
| UBits | https://ubits.club/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 你堡，可期 |
| ~~UHD~~ | ~~https://uhdbits.org/~~ | :heavy_check_mark: | :heavy_check_mark: | 🗄️ | 已关站/上游移除 | 越南堡，易活 |
| UltraHD | https://ultrahd.net/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 高清韩剧，谢绝收割机 |
| WT-Sakura | https://resources.wintersakura.org/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 冬樱 |
| ~~xthor~~ | ~~https://xthor.tk/~~ | :heavy_check_mark: | :heavy_check_mark: | 🗄️ | 已关站 | 法国站点，已永久关站 |
| YDY | https://pt.hdbd.us/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 伊甸园 |
| YemaPT | https://www.yemapt.org/ | :heavy_check_mark: | :x: | ✅ | 实验性（待测试） | 野马，国内新站，新框架 |
| ZHUQUE | https://zhuque.in/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 实验性（待测试） | 朱雀，国内新站，新框架 |
| ZMPT | https://zmpt.cc/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 织梦PT |
| 海棠 | https://www.htpt.cc/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 相声戏曲等 |
| ~~红叶~~ | ~~https://leaves.red/~~ | :heavy_check_mark: | :heavy_check_mark: | 🗄️ | 已关站/上游移除 | 特色有声小说 |
| 麒麟 | https://www.hdkyl.in/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 待测试 | 国内新站 |
| ~~象岛~~ | ~~https://ptvicomo.net/login.php~~ | :heavy_check_mark: | :heavy_check_mark: | 🗄️ | 已关站/上游移除 | 国内新站 |
| 杏林 | https://xingtan.one/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 实验性（待测试） | 医学等教育资源 |
| 影 | https://star-space.net/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 实验性（待测试） | 一般用户无发布权限 |
| 雨 | https://raingfh.top/ | :heavy_check_mark: | :heavy_check_mark: | ✅ | 实验性（待测试） | 国内新站 |



## 📝 总结

- ✅ 核心影视与四大音乐站（`RED` / `OPS` / `DIC` / `OpenCD`）转发链路已实测打通
- ✅ 图片转存 / 远程推送 / 种子清洗 / 豆瓣一键复制 BBCode
- ✨ 统一设置面板（多语言、站点搜索、实验性站点折叠分组、客户端连接测试）
- **统计（旧 Wiki 活跃站）**：`✅` 117 / `⚠️` 2 / `❌` 0（全部活跃站均已逐站对齐 legacy 并适配，另 15 个已关站/上游移除归档为 `🗄️`） 
