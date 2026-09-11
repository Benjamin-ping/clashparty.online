# 当前线上部署

- 正式域名：https://clashparty.online
- Cloudflare Workers 静态资源项目：clashparty-online
- 配置：wrangler.jsonc
- 本地发布：npm run deploy（先构建和检查，再上传）
- 本地预览：npm run preview

2026-09-11 已直接上传当前静态网站并绑定自定义域名。当前部署工具将 Pages 命令迁移到 Workers，因此实际项目位于 Workers；后续使用 wrangler deploy，不使用 Pages 部署钩子。

GitHub 仓库尚未创建/推送，每日版本任务尚未实际启用。后续推送本项目到 main 分支后，在 Actions 配置：

- Variable：CLOUDFLARE_WORKERS_DEPLOY=true
- Secret：CLOUDFLARE_ACCOUNT_ID
- Secret：CLOUDFLARE_API_TOKEN（限定当前账户的 Workers 编辑及必要域名权限）

同步任务检查版本、校验内容并提交后，会部署当前网站；部署失败下次任务会重试。暂未开启 R2 本站下载和 GitHub 评论。不要将本机 OAuth 凭据提交到 GitHub。
