# Clash Party 中文指南

域名：`https://clashparty.online`。第三方独立中文指南，面向新手，覆盖桌面安装、功能手册、工作原理、问题排查和版本解读。

## 本地运行

需要 Node.js 22 或更新版本。静态构建使用 Node 内置模块，部署依赖 Wrangler；首次部署前运行 `npm ci`。

```sh
npm run build
npm run check
npm test
npm run dev
```

预览地址为 `http://127.0.0.1:4173`。修改内容后重新运行 build，刷新预览即可。所有页面在构建时生成完整 HTML，阅读和导航不依赖 JavaScript；搜索、下载筛选和图片放大使用少量浏览器脚本。

## 主要文件

- `content/articles.mjs`：平台教程、功能手册、原理、故障排查。
- `content/site.json`：域名、基准版本和反馈入口配置。
- `content/releases.json`：已核验来源的官方发布数据；不要在每次构建时联网获取。
- `public/assets/screenshots/`：已选取的公开教程截图。
- `public/assets/style.css`：全站样式。
- `scripts/build.mjs`：生成页面、下载中心、搜索索引与 sitemap。
- `.github/workflows/`：验证及定时同步流程。
- `docs/CONTENT-MAINTENANCE.md`：补图、内容核验、推广配置与待办清单。

## 上传 GitHub

创建自己的 GitHub 仓库后，将本目录源文件上传，默认分支用 `main`。不上传 `dist/`、环境变量、原始订阅凭据和未经检查的截图。`.gitignore` 已排除构建产物与临时文件。

远程仓库为 https://github.com/Benjamin-ping/clashparty.online ，默认分支 `main`。文章帮助度选择仍仅保存在本机；问题排查页的公开评论通过 GitHub Discussions 保存。

## Cloudflare Workers 部署

当前使用 Workers 静态资源托管，项目为 `clashparty-online`，自定义域为 `clashparty.online`。配置位于 `wrangler.jsonc`。

本地运行 `npm run deploy` 会先构建和检查，再上传 `dist`。GitHub 每日同步任务使用加密 Secret `CLOUDFLARE_ACCOUNT_ID`、`CLOUDFLARE_API_TOKEN`，并由 Variable `CLOUDFLARE_WORKERS_DEPLOY=true` 启用部署。凭据不能提交到仓库。

文档：https://developers.cloudflare.com/workers/static-assets/

## 版本定时任务

上传到默认分支、允许 Actions 写入内容后，`sync-releases.yml` 每 24 小时检查一次（北京时间每天 08:23），也可手动触发。GitHub 定时任务不是精确计时器，可能延迟；长期不活跃的公开仓库可能被平台停用定时任务，应定期查看 Actions 状态。

流程：抓取官方 Releases → 校验来源、版本与资产 → 合并历史 → 测试、构建、链接检查 → 按需同步最新稳定版安装包至 R2 → 有变化才提交 → 部署 Cloudflare Workers。安装包版本不变时跳过下载、上传和清理；每日仍部署当前内容，失败部署可在下次任务重试。

- 稳定版与预发布分开，下载中心只使用可下载的稳定版。
- 发布说明后续修改也会同步；历史版本不会因超出 API 最近记录范围而删除。
- 网络错误、空响应或无可下载稳定版会失败退出，旧数据不会被覆盖。
- 同步失败通过 GitHub Actions 原生失败状态呈现；请在 GitHub 自己的通知设置中启用工作流失败通知。
- 同步产生的提交不依赖另一个 GitHub 工作流做校验，校验在同步工作流中已经执行。
- 可配置仓库 Secret `CLOUDFLARE_PAGES_DEPLOY_HOOK` 触发 Pages 构建。该 Secret 是私密部署 URL，不能写进源代码或日志。使用 Git 集成已能触发部署时无需重复配置。
- 网站不提供 RSS 和邮件订阅，也不与其他站联动。

自动解读采用**可审计的主题规则**，附对应的原始变化与保守的影响说明；不需要付费 AI API，不虚构实测。未知变化保留官方文本，不强行解读。它不是逐条自由生成的 AI 深度分析；如需生成全新的详细操作步骤，需要另接模型与官方文档数据源。当前流程不设人工审核。

参考：https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule

## 当前限制

入门教程仅保留 Windows 11、Windows 7、Linux、Mac 四篇；Mac 芯片差异和 Linux 包格式在各自文章内说明。Windows 11 已接入维护者截图；Mac 有两张旧版 Mac 图和两张明确标注的 Windows 状态示意。Windows 7 已补齐 PowerShell 提示、WMF 下载、启动、订阅与节点测速图，并附微软官方更新步骤。仅 Windows 11 入门教程保留 GLOBAL 测试说明，其他平台可按功能手册操作。安装与连接的进一步实机核验仍需补充，特别是 CentOS 具体版本兼容性。教程版本标记是编写基准，不代表已经执行全平台测试。机场推荐目前为 99吧与 FlyBit，资料统一维护在 content/services.json，已按用户指定页面整理套餐并确认跳转入口；价格以服务商结算页为准。

功能更新自动化：每次构建从同一份 releases.json 更新首页版本与摘要、下载中心、更新解读、功能更新页；手册和教程不再重复插入「相关版本变化」。一条变化可同时关联多个功能；未知功能完整进入功能更新页，不遗漏。预发布仅保留在版本更新区，不进入稳定版手册补充。官方修订说明后，下次同步会重建相应内容，不重复追加。基础操作示例保留原版本，新增变化注明来源版本；不会生成未经操作的图片或把旧步骤冒充新版实测。检查通过后直接提交 main 并部署，不创建待审核 PR。


## GitHub 登录评论
仅问题排查页底部接入 giscus，评论按 pathname 严格匹配，改标题不会丢失讨论。已配置本站公开仓库的 Announcements 分类，用户通过 GitHub 账号登录评论。小白入门、功能手册与工作原理页不显示评论。
启用：公开 GitHub 仓库开启 Discussions，安装 https://github.com/apps/giscus ，在 https://giscus.app/zh-CN 选择仓库及公告类型分类。将生成的 repo、repoId、category、categoryId 填入 content/site.json 的 comments，并设 enabled 为 true，重新构建部署。无需填写任何私钥或访问令牌。评论可在 GitHub Discussions 管理、删除或锁定。


