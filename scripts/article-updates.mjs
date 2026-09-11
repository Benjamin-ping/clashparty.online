// Source-bound additions are rebuilt from release data, including edited notes.
const topics = [
  [/订阅|配置文件|Sub-Store/i, ['manual/subscription','troubleshoot/import']],
  [/Sub-Store/i, ['manual/sub-store']],
  [/代理组|节点|GLOBAL/i, ['manual/groups']],
  [/全局|规则模式|直连模式/i, ['manual/modes']],
  [/系统代理/i, ['manual/system-proxy']],
  [/TUN|虚拟网卡|路由/i, ['manual/tun','troubleshoot/tun']],
  [/规则|分流/i, ['manual/rules','learn/rules']],
  [/覆写/i, ['manual/override','learn/override']],
  [/DNS|nameserver|fake-ip/i, ['manual/dns','learn/dns']],
  [/嗅探|sniff/i, ['manual/sniffer']],
  [/内核|mihomo/i, ['manual/kernel']],
  [/Smart|智能/i, ['manual/smart']],
  [/连接|日志/i, ['manual/connections']],
  [/备份|恢复配置|WebDAV/i, ['manual/backup']],
  [/快捷键|小键盘|主题|外观|托盘|界面/i, ['manual/appearance']],
  [/scheme|URL 协议|深链/i, ['manual/url-scheme']],
  [/网络信息|IP 信息/i, ['manual/network-info']],
  [/Windows|Win11|Win10|欢迎|引导/i, ['guide/windows']],
  [/Win7|Windows 7|PowerShell/i, ['guide/windows-legacy']],
  [/Linux|CentOS|Ubuntu|Debian|Arch/i, ['guide/linux']],
  [/macOS|Mac|Darwin|Apple/i, ['guide/mac']],
  [/启动|退出|崩溃|白屏|升级/i, ['troubleshoot/update']]
];
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function releaseUpdates(releases) {
  return releases.filter(r => !r.prerelease).sort((a,b) => Date.parse(b.date)-Date.parse(a.date)).map(r => ({
    ...r, entries: (r.changes.length ? r.changes : [r.body || '本次发布未提供详细功能说明。']).map(text => ({
      text, paths: [...new Set(topics.filter(([pattern]) => pattern.test(text)).flatMap(([,paths]) => paths.map(p => `/${p}/`)))]
    }))
  }));
}
function render(records) {
  return records.map(r => `<div class="insight"><h3>v${escape(r.version)} · ${escape(r.date.slice(0,10))}</h3><ul>${r.entries.map(e => `<li>${escape(e.text)}</li>`).join('')}</ul><p><a href="/changelog/${escape(r.version)}/">查看本次更新解读 →</a> · <a href="${escape(r.url)}" target="_blank" rel="noopener noreferrer">官方发布说明 ↗</a></p></div>`).join('');
}
export function withReleaseUpdates(base, releases) {
  const records = releaseUpdates(releases);
  const articles = base.map(a => ({...a,sections:[...a.sections]}));
  articles.push({group:'manual',slug:'release-features',path:'/manual/release-features/',title:'功能更新与新增能力',description:'按版本查阅新增功能、行为调整与修复，并进入对应功能手册。',releaseDate:records[0]?.date.slice(0,10),sections:records.map((r,i) => ({
    id:`release-${i}`,title:`v${r.version} 功能变化`,html:render([r])+`<p>${[...new Set(r.entries.flatMap(e=>e.paths))].map(path => articles.find(a=>a.path===path)).filter(Boolean).map(a=>`<a href="${a.path}">${escape(a.title)}</a>`).join(' · ')}</p>`
  }))});
  return articles;
}
