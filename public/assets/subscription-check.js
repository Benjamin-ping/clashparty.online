export function inspectSubscription(input) {
  const text=input.replace(/^\uFEFF/,'').trim();
  if(!text) return '请粘贴浏览器返回的订阅内容，或选择下载的订阅文件。';
  if(text.length>2*1024*1024) return '内容超过 2 MB，请直接使用 Clash Party 导入并查看错误信息。';
  if(/^https?:\/\/\S+$/i.test(text)) return '这是订阅地址，不是返回内容。本工具不会访问地址，请在浏览器打开后复制内容，或选择下载的文件。';
  if(/<(?:!doctype\s+html|html|head|body)\b/i.test(text)) return '检测到网页内容，可能是登录页、验证页或错误页面，不能当作 Clash 配置导入。请重新复制订阅地址或联系服务商。';
  if(/^(?:ss|ssr|vmess|vless|trojan|hysteria2?|hy2|tuic):\/\//im.test(text)) return '检测到节点分享链接。它可能是节点订阅或代理集合内容，不等同于完整 Clash 配置；请优先选择服务商提供的 Clash / Mihomo 格式。';
  const compact=text.replace(/\s/g,'');
  if(compact.length>=16&&/^[A-Za-z0-9+/]+={0,2}$/.test(compact)) {
    try {if(/(?:ss|ssr|vmess|vless|trojan|hysteria2?|hy2|tuic):\/\//i.test(atob(compact))) return '检测到 Base64 编码的节点链接集合。请优先获取 Clash / Mihomo 格式；这不代表节点本身失效。';} catch {}
  }
  let keys=[];
  if(text.startsWith('{')||text.startsWith('[')) {
    try {const data=JSON.parse(text);if(data&&typeof data==='object'&&!Array.isArray(data)) keys=Object.keys(data);}
    catch {return '内容看起来像 JSON，但无法解析。请检查文件是否下载完整，或让服务商确认返回格式。';}
  } else keys=[...text.matchAll(/^(?:["']?)(proxies|proxy-providers|proxy-groups|rules)(?:["']?)\s*:/gm)].map(m=>m[1]);
  if(keys.includes('proxies')||keys.includes('proxy-providers')) {
    return (keys.includes('proxy-groups')?'检测到 Clash / Mihomo 常见配置字段。':'检测到节点或代理集合字段，可能只是代理集合文件，未发现常见的代理组字段。')+' 这只是格式特征初检，不代表 YAML 语法、节点参数或远程代理集合一定有效；请继续用 Clash Party 导入，并按具体报错处理。';
  }
  return '未识别出常见 Clash / Mihomo 节点配置特征。可能是错误提示、其他客户端格式或特殊配置；请向服务商确认格式，不能仅凭此结果判断订阅失效。';
}
const root=typeof document!=='undefined'&&document.querySelector('#subscription-checker');
if(root) {
  const input=root.querySelector('textarea'),file=root.querySelector('input'),result=root.querySelector('[role=status]');
  let revision=0;
  root.querySelector('[data-check]').addEventListener('click',()=>{result.textContent=inspectSubscription(input.value);});
  root.querySelector('[data-clear]').addEventListener('click',()=>{revision++;input.value='';file.value='';result.textContent='内容已清空。';});
  input.addEventListener('input',()=>{revision++;result.textContent='内容已修改，请重新检查。';});
  file.addEventListener('change',async()=>{
    const current=++revision,selected=file.files[0];if(!selected)return;
    input.value='';
    if(selected.size>2*1024*1024){result.textContent='文件超过 2 MB，请直接使用 Clash Party 导入。';return;}
    try {const value=await selected.text();if(current!==revision)return;input.value=value;result.textContent=inspectSubscription(value);}
    catch {if(current===revision)result.textContent='文件读取失败，请重新选择文本格式的订阅文件。';}
  });
}
