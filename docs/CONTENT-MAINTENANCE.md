# 内容维护

## 补充截图

原始资料来自用户指定目录。公开目录仅复制已挑选素材，没有改动原始目录。

使用有意义的英文文件名，把新图放入 `public/assets/screenshots/`，在 `content/articles.mjs` 相应文章内插入 figure 或使用现有 img helper。不要把截图临时绝对路径写入网页。图片原始宽高与正文一致即可，CSS 自动适配。

需要检查：订阅完整链接与令牌、可识别账号、个人网络 IP、日志中的敏感域名、访问密钥、密码。当前排除了带链接片段的订阅输入图、个人网络信息图与日志图。不要未经核查把整批原图上传 GitHub。

## 入门教程结构

仅四篇：Windows 11、Windows 7、Linux、Mac。Mac 在一篇内区分 M 系列与 Intel；Linux 在一篇内区分 DEB、RPM / CentOS 和 PACMAN。旧 Mac / Linux 子教程地址通过 301 跳转，搜索索引只保留合并后的文章。

新增 mac-subscription.png、mac-modes.png 和 win7-download.png。Mac 图为旧版 Mihomo Party 界面，文中已注明。mac 文件夹中另外两张带 Windows 窗口按钮的图，已分别以 subscription-success-reference.png、node-selection-reference.png 接入 Mac 教程，明确标注为旧版 Windows 的跨平台状态示意，不能作为 Mac 实机核验证据；后续获得对应 Mac 实机截图时替换。

## 待补充清单

- Windows 7：已补齐 PowerShell 版本提示、WMF 下载、权限入口、欢迎引导、空白配置、导入成功、机场组及 GLOBAL 测试截图。继续补充 WMF 安装完成后的版本检查与退出恢复结果，并确认实测系统位数。未使用订阅输入涂抹不完整的 Capture2.PNG。
- CentOS：明确发行版版本、架构、桌面环境、依赖安装结果；不能把 RPM 包的存在当成全版本兼容证明。
- Mac：现有订阅入口和模式图已接入，继续补充安装授权、具体节点选择、TUN、退出恢复。
- Linux DEB 与 Arch：安装、托盘、代理、权限与连接测试。
- 功能截图：Sub-Store、WebDAV 备份恢复、外观、快捷键、URL Scheme；网络信息与日志需要重新准备脱敏图。

页面不展示素材收录或待补充状态。`guideVersion` 不能跟随新 Release 自动升级，否则会虚假标记教程已适配。

## 服务推荐

统一维护 `content/services.json`。目前只推荐 99吧和 FlyBit，来源为用户提供的找梯子服务页。首页卡片、推荐对比页与独立介绍页均由这份数据生成。新增服务可复制现有条目并填写唯一 slug，以下为字段结构示意：

```json
{
  "slug": "service-name",
  "name": "已确认的服务商名称",
  "url": "https://example.com/",
  "source": "https://example.com/plans",
  "description": "已核实的定位与使用限制",
  "label": "适合人群",
  "price": "月付入门价格",
  "allowance": "每月流量",
  "checkedAt": "YYYY-MM-DD",
  "sourceDate": "YYYY-MM-DD",
  "plans": [{"name":"套餐名称","price":"实际付款金额与周期","traffic":"流量","period":"月付 / 年付 / 不限时","note":"限制说明"}]
}
```

还应参照现有条目填写 trial、devices、routes、protocol、nodes、billing、refund、payment、tags、suitable、notes、coupon。只填写已确认数据。外链自动标记 sponsored / nofollow，并提示推广关系。不要把年付折算价写成月付，也不要将资料中的评分、线路或解锁宣称改写成本站实测。

2026-09-11 核对的推广入口：99吧的邀请码已按用户于 2026-09-12 的要求改为 `nmRLD9kD`；FlyBit 使用 `ckrpv0zT`。套餐来源页更新时间为 2026-09-02，页面明确提示以结算页为准。此数据不随软件版本定时任务自动刷新，套餐变化时更新 JSON 和查阅日期。

## 更新记录解读

`scripts/releases.mjs` 的 explainRelease 保留每个分类对应的原文证据。新增分类要提供稳健的匹配规则、适用范围与相关教程，不能以模糊的“性能改进”推导某个故障已解决。详尽 AI 解读目前未接入，现有自动解读为来源绑定的规则说明。

## 发布检查

运行 `npm test`、`npm run build`、`npm run check`；检查本次改动页面的真实截图和外部下载链接。有真实 GitHub 仓库后可以接入 feedbackUrl；在此之前帮助评价只保存本机，网站已说明这一限制。

## 自动补充功能变化
 scripts/article-updates.mjs 在构建时按主题关联官方变更，多主题同时收录。所有稳定版本记录进入 /manual/release-features/，未识别的新能力也不会丢失。新增主题映射可以改善归类，但不阻塞自动发布。补充内容进入文章目录、侧栏与搜索索引，随官方说明修订一起重建。不要求人工审核；操作示例版本仍表示原图文基础版本。


2026-09-11 调整：文章不再附加「相关版本变化」，变更统一展示在版本更新和功能更新页；每 24 小时同步任务保留。问题排查不再使用统一的「恢复与回退」栏目。

