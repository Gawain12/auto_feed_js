# Feature Gap

本页记录当前待社区实测验证与持续打磨的重点，全量明细见 [`FEATURE_PARITY.md`](./FEATURE_PARITY.md)。

## 当前待验证与打磨项
- **实验性站点真机反馈**：未逐一实测的小站（含教育网、国内新框架 SPA `ZHUQUE` / `YemaPT` / `RouSi` 以及部分外站 `IPT` / `HDSpace` / `ANT` / `TVV` / `NBL` / `HDRoute`）均已按上游 legacy 规则接入并折叠在实验性分组中，欢迎提供现网反馈微调。
- **标题重建极端样本**：少量边缘 MediaInfo / BDInfo 样本仍可能出现声道或特殊标签偏差，发现后补充至自动化测试集。
- **扩展功能**：原版一键签到、视频处理等非核心转种功能暂未纳入重构版。
