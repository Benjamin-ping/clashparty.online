import test from 'node:test';
import assert from 'node:assert/strict';
import {pageMetadata,seoHead} from './seo.mjs';
test('lastmod changes only when page content changes',()=>{
 const original=pageMetadata(null,'Title','Description','Body','2026-09-10T00:00:00Z');
 assert.deepEqual(pageMetadata(original,'Title','Description','Body','2026-09-11T00:00:00Z'),original);
 assert.equal(pageMetadata(original,'Title','Description','Changed','2026-09-11T00:00:00Z').lastmod,'2026-09-11T00:00:00Z');
});
test('structured data uses real hierarchy and escapes script delimiters',()=>{
 const site={origin:'https://clashparty.online',name:'Clash Party 中文指南'};
 const html=seoHead(site,'标题 </script>','描述','/manual/modes/',true,s=>s.replace(/</g,'&lt;'));
 const json=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1]);
 const crumbs=json['@graph'].find(x=>x['@type']==='BreadcrumbList').itemListElement;
 assert.deepEqual(crumbs.map(x=>x.item),[site.origin+'/',site.origin+'/manual/',site.origin+'/manual/modes/']);
 assert.equal(json['@graph'][1].headline,'标题 </script>');
 assert.equal((html.match(/<\/script>/g)||[]).length,1);
 assert.match(seoHead(site,'404','Missing','/404.html',false,String),/noindex/);
});
