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
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`OK: ${htmls.length} HTML pages; ${refs} internal references; ${search.length} search entries. No missing assets or internal targets.`);
