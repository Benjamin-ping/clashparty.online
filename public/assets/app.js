const menuButton=document.querySelector('.menu-toggle');
const mobileNav=document.querySelector('.mobile-nav');
menuButton?.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')==='true';menuButton.setAttribute('aria-expanded',String(!open));mobileNav.hidden=open;});
const searchDialog=document.querySelector('#search-dialog');
const searchInput=document.querySelector('#search-input');
const searchResults=document.querySelector('#search-results');
const searchStatus=document.querySelector('#search-status');
let indexPromise,searchSequence=0;
const loadIndex=()=>indexPromise??=(fetch('/search-index.json').then(r=>{if(!r.ok)throw Error('search unavailable');return r.json();}).catch(e=>{indexPromise=null;throw e;}));
function openSearch(){searchDialog.showModal();searchInput.focus();}
document.querySelectorAll('.search-toggle').forEach(b=>b.addEventListener('click',openSearch));
document.addEventListener('keydown',e=>{if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)&&!document.activeElement.isContentEditable&&!document.querySelector('dialog[open]')){e.preventDefault();openSearch();}});
document.querySelectorAll('dialog [data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
const synonyms=[['tun','虚拟网卡'],['mac','macos','苹果'],['订阅','机场链接'],['dns','解析'],['win','windows'],['超时','timeout'],['备份','迁移']];
searchInput?.addEventListener('input',async()=>{
 const sequence=++searchSequence,q=searchInput.value.trim().toLowerCase();searchResults.replaceChildren();
 if(!q){searchStatus.textContent='输入功能名称，或你遇到的问题。';return;}
 searchStatus.textContent='正在查找…';
 try{const pages=await loadIndex();if(sequence!==searchSequence)return;const tokens=q.split(/\s+/).filter(Boolean);const sets=tokens.map(t=>[t,...synonyms.filter(g=>g.includes(t)).flat()]);
 const matches=pages.map(p=>{const title=p.title.toLowerCase(),desc=p.description.toLowerCase(),body=p.text.toLowerCase();const score=sets.reduce((n,terms)=>n+Math.max(...terms.map(t=>title.includes(t)?10:desc.includes(t)?5:body.includes(t)?1:0)),0);return {p,score};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,15);
 searchStatus.textContent=matches.length?`找到 ${matches.length} 条相关内容`:'没有找到匹配内容。试试“订阅”“TUN”或“无法上网”。';
 for(const {p}of matches){const a=document.createElement('a');a.href=p.path;const strong=document.createElement('strong');strong.textContent=p.title;const span=document.createElement('span');span.textContent=p.description;a.append(strong,span);searchResults.append(a);}
 }catch{if(sequence===searchSequence)searchStatus.textContent='搜索暂时不可用，请通过导航浏览教程，或稍后重试。';}
});
const imageDialog=document.querySelector('#image-dialog');
document.querySelectorAll('.zoom-image').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const img=imageDialog.querySelector('img');img.src=a.href;img.alt=a.querySelector('img')?.alt||'操作界面';imageDialog.showModal();}));
document.querySelectorAll('[data-platform]').forEach(button=>button.addEventListener('click',()=>{const platform=button.dataset.platform;document.querySelectorAll('[data-platform]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.querySelectorAll('[data-platform-section]').forEach(s=>s.hidden=platform!=='all'&&s.dataset.platformSection!==platform);}));
document.querySelectorAll('[data-feedback]').forEach(button=>{
 const key='guide-feedback:'+button.dataset.page;
 try{button.setAttribute('aria-pressed',String(localStorage.getItem(key)===button.dataset.feedback));}catch{}
 button.addEventListener('click',()=>{const panel=button.closest('.feedback');let saved=true;try{localStorage.setItem(key,button.dataset.feedback);}catch{saved=false;}panel.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));const status=panel.querySelector('.feedback-message');status.textContent=saved?'已在本机记录，未发送给维护者。':'当前浏览器无法保存选择，未发送任何反馈。';if(button.dataset.feedback!=='yes'){const a=document.createElement('a');a.href='/troubleshoot/';a.textContent=' 查看问题排查 →';status.append(a);}});
});
