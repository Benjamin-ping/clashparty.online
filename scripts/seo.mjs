import {createHash} from 'node:crypto';
export function pageMetadata(previous, title, description, body, now=new Date().toISOString()) {
  const hash=createHash('sha256').update(JSON.stringify([title,description,body])).digest('hex');
  return previous?.hash===hash ? previous : {hash,lastmod:now};
}
export function seoHead(site,title,description,current,isArticle,escape) {
  if(current==='/404.html')return '<meta name="robots" content="noindex,follow">';
  const url=site.origin+current;
  const categories={guide:'小白入门',manual:'功能手册',learn:'工作原理',troubleshoot:'问题排查',changelog:'版本更新',services:'机场推荐',download:'下载中心',about:'关于本站'};
  const parts=current.split('/').filter(Boolean);
  const graph=[{'@type':'WebSite','@id':site.origin+'/#website',url:site.origin+'/',name:site.name,inLanguage:'zh-CN'},
    {'@type':isArticle?'TechArticle':'WebPage','@id':url+'#page',url,name:title,...(isArticle?{headline:title}:{}),description,inLanguage:'zh-CN',isPartOf:{'@id':site.origin+'/#website'}}];
  if(parts.length){
    const crumbs=[{name:'首页',item:site.origin+'/'}];
    if(parts.length>1&&categories[parts[0]])crumbs.push({name:categories[parts[0]],item:site.origin+'/'+parts[0]+'/'});
    crumbs.push({name:title,item:url});
    graph.push({'@type':'BreadcrumbList',itemListElement:crumbs.map((c,i)=>({'@type':'ListItem',position:i+1,...c}))});
  }
  const image=site.origin+'/assets/screenshots/system-proxy.png';
  return `<meta name="robots" content="index,follow,max-image-preview:large"><meta property="og:site_name" content="${escape(site.name)}"><meta property="og:locale" content="zh_CN"><meta property="og:image" content="${image}"><meta property="og:image:alt" content="Clash Party 规则模式与系统代理操作示例"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="${image}"><script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@graph':graph}).replace(/</g,'\\u003c')}</script>`;
}
