# Site Support

本页概览“代码中已接入”与“真机实测结论”，全量站点清单及上游对照见 [FEATURE_PARITY.md](./FEATURE_PARITY.md)。

## 已人工验证（既有主力站）
- **Nexus / 类 Nexus**：TTG、HDB、CHDBits、PTer、HDSky、CMCT、HDHome、OurBits、Audiences、MTeam
- **Gazelle（影视）**：PTP、GPW
- **Unit3D / Classic**：BHD、BLU、Tik、KG、Monika
- **专项回归**：SC、TJUPT

## 本轮新增/修复并已完成真机实测（v5.2.0）
- **音乐站全面修复（双向 + CD `.log` 透传）**：`RED`、`OPS`、`DIC`、`OpenCD`（含单碟/多碟 CD 抓轨 `.log` 自动提取与上传表单注入）
- **外站双向实测**：`BTN`、`AvistaZ` / `CinemaZ` / `PrivateHD`、`CG`、`HDT`
- **仅源站实测**：`FileList`、`bib`（电子书）、`jpop`、`lztr`
- **中文 NexusPHP 现网核对与修复**：`HDChina`、`PThome`、`BTSchool`、`HDArea`、`HDTime`、`HDDolby`、`TCCF`、`HDfans`、`TLFbits`、`FRDS`、`Audiences`、`CMCT`、`PTer`、`HDSky`、`HDHome`、`OurBits`、`CHDBits`、`TTG`

## 已实现（待真机测试 / 实验性折叠分组）
设置页默认折叠实验性站点并支持关键词搜索按需开启（已覆盖原版 `v2.1.1.6` 全部活跃站，移除已永久关站的 `MTV` / `xthor` / `SugoiMusic`）：
- **中文 NexusPHP / 教育网**：全量声明式 `NexusFillProfile` 站点 + `NPUPT` / `HaiDan` / `BYR` / `HDCity` 专用引擎（含 `影`、`慕雪阁`、`NJTUPT`、`HUDBT`、`NanYang`、`PuTao`、`HITPT`、`RS`、`LemonHD`、`GGPT`、`UBits`、`HDVideo`、`HDU`、`PigGo`、`QingWa`、`PTLGS`、`ZMPT`、`ICC`、`AGSV`、`SoulVoice`、`PTT`、`PTsbao`、`WT-Sakura`、`CrabPt`、`DiscFan`、`FreeFarm`、`Panda`、`CarPt`、`1PTBA`、`52PT`、`PTCafe`、`PTFans`、`CyanBug`、`Dragon`、`OKPT`、`KuFei`、`iloli`、`Oshen`、`JoyHD`、`UltraHD`、`YDY`、`麒麟`、`海棠`、`杏林`、`雨`、`PTzone` 及 `HHClub`、`U2` 仅源站等）
- **中文新框架 SPA**：`ZHUQUE`、`YemaPT`、`RouSi`
- **外站与 Unit3D / Gazelle 家族**：`HDRoute`、`HDSpace`、`TorrentLeech`、`IPT`、`bit-hdtv`、`BlueBird`、`bwtorrents`、`digitalcore`、`iTS`、`OnlyEncodes`、`DarkLand`、`ReelFliX`、`FNP`、`HDOli`、`HONE`、`DesiTorrents`、`Aither`、`ACM`、`HDF`、`ANT`、`TVV`、`NBL`、`HD-Only`

## 代码位置
- 站点配置：`src/config/`（含声明式映射 `src/config/nexus_profiles.ts`）
- 站点逻辑：`src/trackers/`（一站一文件）
- 框架模板：`src/templates/`
- 通用规则：`src/common/rules/`
