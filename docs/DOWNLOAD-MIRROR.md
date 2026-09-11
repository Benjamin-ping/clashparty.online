# 最新稳定版本站下载

网站不需要数据库。安装包存入专用 Cloudflare R2 桶，使用自定义下载域名。代码已经接入每天北京时间 08:23 的同步任务；目前未提供 R2 配置，因此还没有真实本站下载文件。

## 一次性配置

1. 在 Cloudflare 创建专门的 R2 桶，绑定下载域名，例如 `download.clashparty.online`，等待域名可用。
2. 创建仅对此桶有对象读写权限的 R2 S3 访问凭据。
3. GitHub 仓库 Settings → Secrets and variables → Actions：

| 类型 | 名称 | 内容 |
| --- | --- | --- |
| Secret | R2_ACCOUNT_ID | Cloudflare 账户 ID |
| Secret | R2_ACCESS_KEY_ID | R2 Access Key ID |
| Secret | R2_SECRET_ACCESS_KEY | R2 Secret Access Key |
| Variable | R2_BUCKET | 专用存储桶名称 |
| Variable | R2_PUBLIC_BASE_URL | 下载域名的 HTTPS 地址，不带路径或尾部斜杠 |
| Variable | R2_MIRROR_ENABLED | true |

密钥不要发到聊天、写入代码或提交 GitHub。R2 可能需要开通计费，费用按账户实际套餐和用量计算。

4. 在 R2 桶设置添加 CORS，允许网页读取最新下载清单：

```json
[{"AllowedOrigins":["https://clashparty.online","http://127.0.0.1:4173"],"AllowedMethods":["GET","HEAD"],"AllowedHeaders":["*"],"ExposeHeaders":["Content-Length"]}]
```

5. 下载域名的 `clashparty-mirror/latest.json` 必须绕过缓存，不要使用覆盖其 `no-store` 的缓存规则。安装包可缓存。
6. 手动运行 GitHub 的 Sync official Clash Party releases 工作流，成功后部署网站。下载页面将读取 R2 最新清单，为版本匹配的文件显示“本站下载”，保留官方备用入口。

## 自动同步与清理

只选择最新可下载稳定版。官方 SHA256 不存在、文件校验不符、上传失败或公开文件不可访问时，终止任务，不删除原有版本。全部成功才原子发布 latest.json，再清理专用 `clashparty-mirror/` 前缀下不属于当前清单的文件，包括上次中断产生的临时新版文件。不会删除桶内其他前缀。同步中短暂保留新旧两份，完成后只剩最新版。

历史版本解读仍保留，历史安装包由官方 GitHub 提供。旧页面与最新镜像版本不匹配时仅显示官方链接，避免静态页面长期指向已删除的旧文件。已打开页面上的旧链接可能在切版后失效，刷新页面或使用官方备用入口即可。

关闭自动同步：将 R2_MIRROR_ENABLED 设为 false；隐藏本站入口还需将 content/download-mirror.json 的 baseUrl 清空并部署。停止同步不会自动删除存储内容。

参考：[Cloudflare R2 Python 接入](https://developers.cloudflare.com/r2/examples/aws/boto3/)、[CORS 设置](https://developers.cloudflare.com/r2/buckets/cors/)。
版本检查与下载同步使用同一个每日任务。仅首次启用、最新稳定版版本号变化、存储目标变化或上次同步未完成时执行安装包同步。同一版本仅修改发布说明时，只更新站点内容，不重新下载、上传或清理安装包。成功状态在上传、公开验证及旧文件清理全部完成后保存；失败时下次任务重试。
