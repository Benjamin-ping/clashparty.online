import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
async function walk(dir){const entries=await fs.readdir(dir,{withFileTypes:true});const nested=await Promise.all(entries.map(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]));return nested.flat();}
const files=await walk(root),htmls=files.filter(f=>f.endsWith('.html'));
const errors=[];let refs=0;
for(const file of htmls){const text=await fs.readFile(file,'utf8');if(!/<html lang="zh-CN">/.test(text))errors.push(`${file}: missing language`);if((text.match(/<h1[ >]/g)||[]).length!==1)errors.push(`${file}: expected one h1`);
 const ids=[...text.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);if(new Set(ids).size!==ids.length)errors.push(`${file}: duplicate ids`);
 for(const m of text.matchAll(/(?:href|src)="([^"?]+)(?:\?[^"]*)?"/g)){
  const url=m[1];if(/^https?:|^mailto:|^data:/.test(url))continue;refs++;
  if(url.startsWith('#')){if(!ids.includes(url.slice(1)))errors.push(`${file}: missing anchor ${url}`);continue;}
  if(!url.startsWith('/')){errors.push(`${file}: non-root local URL ${url}`);continue;}
  const [pathname,anchor]=url.split('#');let target=path.join(root,decodeURIComponent(pathname));if(pathname.endsWith('/'))target=path.join(target,'index.html');
  try{await fs.access(target);if(anchor){const targetHtml=await fs.readFile(target,'utf8');if(!targetHtml.includes(`id="${anchor}"`))errors.push(`${file}: invalid anchor ${url}`);}}catch{errors.push(`${file}: broken link ${url}`);}
 }
 if(/href="(?:javascript|data):/i.test(text))errors.push(`${file}: unsafe URL`);
}
const search=JSON.parse(await fs.readFile(path.join(root,'search-index.json'),'utf8'));
for(const entry of search){if(!entry.title||!entry.path||!entry.description)errors.push('Incomplete search entry');}
const sitemap=await fs.readFile(path.join(root,'sitemap.xml'),'utf8');
if((sitemap.match(/<loc>/g)||[]).length!==search.length)errors.push('Sitemap and search page counts differ');
for(const entry of search){
 const html=await fs.readFile(path.join(root,entry.path.slice(1),'index.html'),'utf8');
 const schema=html.match(/<script type="application\/ld\+json">(.*?)<\/script>/);
 try{if(!schema||!JSON.parse(schema[1])['@graph']?.length)throw Error();}catch{errors.push(`${entry.path}: invalid structured data`);}
 if(!html.includes('<link rel="canonical"')||!html.includes('<meta name="description"'))errors.push(`${entry.path}: missing SEO metadata`);
}
if(!/name="robots" content="noindex,follow"/.test(await fs.readFile(path.join(root,'404.html'),'utf8')))errors.push('404 must not be indexed');
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`OK: ${htmls.length} HTML pages; ${refs} internal references; ${search.length} search entries. No missing assets or internal targets.`);
