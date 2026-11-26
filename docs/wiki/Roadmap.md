# Roadmap

## 已完成（v5.2.0）
- 音乐站（`RED` / `OPS` / `DIC` / `OpenCD`）双向实测完成并支持单碟/多碟 CD `.log` 自动透传；接入 `jpop` / `lztr` 仅源站。
- 实测接入 `BTN`、`AvistaZ` / `CinemaZ` / `PrivateHD`、`CG`、`HDT`、`FileList`、`bib` 及 `HDChina` / `HDfans` / `TLFbits` / `FRDS` / `PThome` / `BTSchool` / `HDArea` / `HDTime` / `HDDolby` / `TCCF` 等站，并对齐旧版全部活跃站（未实测小站折叠至实验性分组）。
- 新增站点内容类型智能隔离（音乐/电影/剧集/书籍/游戏，保留 `PTP ↔ BTN` 迷你剧互通）、恢复豆瓣详情页一键复制 PTGen BBCode，升级 Tik 英文助手与 Wikidata/IMDb 电影画幅比读取。

## 后续重点
- 按社区反馈逐批将实验性适配站点提升为真机实测状态（尤其国内新框架 `ZHUQUE` / `YemaPT` / `RouSi` 与教育网）。
- 持续扩充 MediaInfo / BDInfo 边界用例与自动化回归覆盖。
- 跟踪上游 legacy 变更，保持 `scripts/legacy.lock.json` 与核心规则同步。
