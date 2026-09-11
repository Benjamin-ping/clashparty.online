import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('dist');
if (!fs.existsSync(root)) await import('./build.mjs');
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.xml':'application/xml'};
http.createServer((req,res)=>{
  let pathname;
  try { pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch {res.writeHead(400).end();return;}
  let target=path.resolve(root,'.'+pathname);
  if (target!==root && !target.startsWith(root+path.sep)) {res.writeHead(403).end();return;}
  if (fs.existsSync(target)&&fs.statSync(target).isDirectory()) target=path.join(target,'index.html');
  if (!fs.existsSync(target)) {res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(fs.readFileSync(path.join(root,'404.html')));return;}
  res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});
  fs.createReadStream(target).pipe(res);
}).listen(4173,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:4173'));
