const hook=process.env.CLOUDFLARE_PAGES_DEPLOY_HOOK;
if(!hook){console.log('No deploy hook configured. Use Cloudflare Pages Git integration for deployment.');process.exit(0);}
const url=new URL(hook);
if(url.origin!=='https://api.cloudflare.com'||!url.pathname.startsWith('/client/v4/pages/webhooks/'))throw Error('Unexpected Cloudflare deploy hook origin');
const response=await fetch(url,{method:'POST',signal:AbortSignal.timeout(30000)});
if(!response.ok)throw Error(`Cloudflare hook failed (HTTP ${response.status}); synced content remains committed. Retry a deploy from Cloudflare.`);
console.log('Cloudflare Pages deployment requested. Check the deployment result in Cloudflare.');
