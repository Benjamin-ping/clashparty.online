import crypto from 'node:crypto';
export function normalizeRelease(r) {
  if(!/^v?\d+\.\d+\.\d+(?:[-.][\w.-]+)?$/.test(r.tag_name)||r.draft) return null;
  if(!r.html_url?.startsWith('https://github.com/mihomo-party-org/clash-party/releases/tag/')) throw Error('Unexpected release source');
  const date=r.published_at;
  if(!date||!Number.isFinite(Date.parse(date))) throw Error('Invalid release date');
  const body=(r.body||'').split(/\n#{1,6}\s*(?:下载地址|Downloads?|机场推荐)/i)[0].trim();
  const changes=body.split('\n').map(x=>x.trim()).filter(x=>/^[-*] /.test(x)).map(x=>x.slice(2).replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/`/g,''));
  const assets=(r.assets||[]).filter(a=>a.name?.startsWith('clash-party-')&&/\.(exe|7z|pkg|deb|rpm|zst)(\.sha256)?$/.test(a.name)).map(a=>{
    if(!a.browser_download_url?.startsWith(`https://github.com/mihomo-party-org/clash-party/releases/download/${r.tag_name}/`)) throw Error('Unexpected asset source');
    return {name:a.name,url:a.browser_download_url,size:a.size,digest:a.digest||null};
  });
  const result={tag:r.tag_name,version:r.tag_name.replace(/^v/,''),date,prerelease:!!r.prerelease,url:r.html_url,body,changes,assets};
  return {...result,hash:crypto.createHash('sha256').update(JSON.stringify(result)).digest('hex')};
}
export function explainRelease(r) {
  const rules=[
    [/Linux.*(?:托盘|tray)/i,'Linux 托盘','如果你在 Linux 桌面遇到托盘不显示，可重点核对这项修复；其他原因造成的托盘缺失仍需单独排查。','guide/linux'],
    [/Linux.*(?:ARM64|交叉编译)/i,'Linux ARM64','这项改动涉及部分 Linux 架构的构建与系统代理模块，使用相应安装包的用户更值得关注。','guide/linux'],
    [/快捷键|小键盘/,'快捷键','如果你的按键组合不能生效，可按修复描述更新后重新注册并验证快捷键。','manual/appearance'],
    [/欢迎|引导.*(?:提示|弹层)/,'首次使用','这项变化涉及首次使用界面，不应据此推断节点速度或连通性得到改善。','guide/windows'],
    [/订阅|Sub-Store/i,'订阅管理','涉及订阅获取、配置或管理流程。遇到导入或更新问题时，请对照原文中的触发条件；订阅到期仍需单独处理。','manual/subscription'],
    [/DNS|nameserver|fake-ip/i,'DNS 与解析','涉及解析或配置处理。更新后先核对原设置并测试常用网站，不需要无依据地重配全部 DNS。','manual/dns'],
    [/TUN|虚拟网卡|路由/i,'TUN 与路由','使用虚拟网卡的用户可重点检查这项变化。是否解决当前故障，需要对照平台、条件并实际验证。','manual/tun'],
    [/Smart|智能|覆写/i,'内核与覆写','涉及内核策略或配置合并。更新前保留现有配置，更新后检查实际生效的代理组与覆写。','manual/smart'],
    [/启动|退出|崩溃|白屏/,'启动与退出','涉及应用运行过程。若此前有对应症状，可更新后复现相同步骤；正常退出后也应检查系统网络是否恢复。','troubleshoot/update'],
    [/规则|代理组|分流/,'规则与代理组','涉及流量如何选择出口。更新后观察目标请求命中的规则和策略，不要只看节点延迟。','manual/rules'],
    [/内核|mihomo/i,'内核更新','内核版本与应用版本不同。更新后保留原配置进行验证；仅看到内核升级不能断言某个具体问题已经解决。','manual/kernel']
  ];
  const groups=[];
  for(const change of r.changes){const rule=rules.find(([pattern])=>pattern.test(change)); if(rule){let g=groups.find(x=>x.title===rule[1]); if(!g){g={title:rule[1],explanation:rule[2],related:`/${rule[3]}/`,evidence:[]};groups.push(g);} g.evidence.push(change);}}
  return groups;
}
