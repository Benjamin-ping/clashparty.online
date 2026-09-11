import fs from 'node:fs/promises';
import {normalizeRelease} from './releases.mjs';
const headers={'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'clashparty-online-guide'};
if(process.env.GITHUB_TOKEN) headers.Authorization=`Bearer ${process.env.GITHUB_TOKEN}`;
let raw;
const fixture=process.argv.indexOf('--from-file');
if(fixture!==-1) raw=JSON.parse(await fs.readFile(process.argv[fixture+1],'utf8'));
else {
  const response=await fetch('https://api.github.com/repos/mihomo-party-org/clash-party/releases?per_page=100',{headers,signal:AbortSignal.timeout(30000)});
  if(!response.ok) throw Error(`Official release fetch failed: HTTP ${response.status}. Previous data retained.`);
  raw=await response.json();
}
if(!Array.isArray(raw)||!raw.length) throw Error('Invalid or empty upstream data; previous data retained');
const incoming=raw.map(normalizeRelease).filter(Boolean);
if(!incoming.some(r=>!r.prerelease&&r.assets.length)) throw Error('No downloadable stable release; previous data retained');
let old=[]; try{old=JSON.parse(await fs.readFile('content/releases.json','utf8'));}catch(e){if(e.code!=='ENOENT') throw e;}
const merged=new Map(old.map(r=>[r.tag,r]));
for(const r of incoming) merged.set(r.tag,r);
const releases=[...merged.values()].sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));
const payload=JSON.stringify(releases,null,2)+'\n';
if(payload===JSON.stringify(old,null,2)+'\n'){console.log('No release changes.');process.exit(0);}
await fs.writeFile('content/releases.json.tmp',payload);
await fs.rename('content/releases.json.tmp','content/releases.json');
console.log(`Saved ${releases.length} official releases. Changed notes are refreshed; history is retained.`);
