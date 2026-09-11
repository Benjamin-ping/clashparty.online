import fs from 'node:fs/promises';
const site=JSON.parse(await fs.readFile('content/site.json','utf8'));
const {key}=JSON.parse(await fs.readFile('content/indexnow.json','utf8'));
if(!/^[a-zA-Z0-9-]{8,128}$/.test(key))throw Error('Invalid IndexNow key');
if(process.env.INDEXNOW_SKIP==='true'){
  console.log('IndexNow: no content changes; submission skipped.');
}else{
  const sitemap=await fs.readFile('dist/sitemap.xml','utf8');
  const urls=[...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]))];
  if(!urls.length||urls.some(u=>new URL(u).origin!==site.origin||new URL(u).search||new URL(u).hash))throw Error('Invalid sitemap URLs');
  const keyLocation=site.origin+'/'+key+'.txt';
  if(process.argv.includes('--dry-run')){
    console.log(`IndexNow dry run: ${urls.length} canonical URLs; host ${new URL(site.origin).host}`);
  }else{
    const options={headers:{'User-Agent':'clashparty-online-indexnow'},signal:AbortSignal.timeout(30000)};
    const verification=await fetch(keyLocation,options);
    if(!verification.ok||(await verification.text()).trim()!==key)throw Error('Live IndexNow key file not ready; no submission sent');
    const live=await fetch(site.origin+'/sitemap.xml',{...options,signal:AbortSignal.timeout(30000),cache:'no-store'});
    if(!live.ok||(await live.text()).trim()!==sitemap.trim())throw Error('Live sitemap differs from this build; no submission sent');
    for(let i=0;i<urls.length;i+=10000){
      const batch=urls.slice(i,i+10000);
      const response=await fetch('https://api.indexnow.org/indexnow',{method:'POST',headers:{'Content-Type':'application/json; charset=utf-8','User-Agent':'clashparty-online-indexnow'},body:JSON.stringify({host:new URL(site.origin).host,key,keyLocation,urlList:batch}),signal:AbortSignal.timeout(30000)});
      if(![200,202].includes(response.status))throw Error(`IndexNow HTTP ${response.status}; website is already deployed. Retry npm run indexnow later.`);
      console.log(`IndexNow HTTP ${response.status}: ${batch.length} URLs received${response.status===202?' (key validation pending)':''}. This does not guarantee indexing.`);
    }
  }
}
