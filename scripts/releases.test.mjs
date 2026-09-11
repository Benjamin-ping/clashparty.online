import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRelease,explainRelease} from './releases.mjs';
import {withReleaseUpdates} from './article-updates.mjs';

test('manual updates cover multiple topics, unknown additions, and source revisions without mutating articles',()=>{
  const base=['dns','tun'].map(slug=>({group:'manual',slug,path:`/manual/${slug}/`,title:slug,sections:[]}));
  const r=normalizeRelease({...release,body:'- 新增 TUN DNS 配置\n- 新增全新实验能力 <button>'});
  const first=withReleaseUpdates(base,[r]);
  assert.equal(first[0].sections.length,0);
  assert.equal(first[1].sections.length,0);
  assert(first.at(-1).sections[0].html.includes('全新实验能力 &lt;button&gt;'));
  assert(first.at(-1).sections[0].html.includes(r.url));
  assert.equal(base[0].sections.length,0);
  const revised=withReleaseUpdates(base,[{...r,changes:['修复 DNS 解析']}]);
  assert(!revised.at(-1).sections[0].html.includes('新增 TUN'));
  assert.equal(revised[1].sections.length,0);
  assert.equal(withReleaseUpdates(base,[{...r,prerelease:true}])[0].sections.length,0);
});
const release={tag_name:'v2.0.2',published_at:'2026-08-14T15:07:21Z',html_url:'https://github.com/mihomo-party-org/clash-party/releases/tag/v2.0.2',prerelease:false,draft:false,body:'# 2.0.2\n- 修复 Linux 无法注册托盘图标的问题\n- 修复数字小键盘快捷键问题\n### 下载地址：\n- 广告不进入变更记录',assets:[{name:'clash-party-linux-2.0.2-amd64.deb',size:100,browser_download_url:'https://github.com/mihomo-party-org/clash-party/releases/download/v2.0.2/clash-party-linux-2.0.2-amd64.deb'}]};
test('only notes enter interpretation; download and promotional sections are excluded',()=>{const r=normalizeRelease(release);assert.equal(r.changes.length,2);assert(!r.body.includes('广告'));assert.equal(explainRelease(r).length,2);});
test('unknown change does not invent an explanation',()=>{const r=normalizeRelease({...release,body:'- 某个未识别的变化'});assert.deepEqual(explainRelease(r),[]);assert.equal(r.changes[0],'某个未识别的变化');});
test('draft and invalid tags excluded; prerelease preserved',()=>{assert.equal(normalizeRelease({...release,draft:true}),null);assert.equal(normalizeRelease({...release,tag_name:'../../invalid'}),null);assert.equal(normalizeRelease({...release,prerelease:true}).prerelease,true);});
test('unexpected release or asset origins rejected',()=>{assert.throws(()=>normalizeRelease({...release,html_url:'https://example.com'}));assert.throws(()=>normalizeRelease({...release,assets:[{...release.assets[0],browser_download_url:'https://example.com/installer.exe'}]}));});
test('edited notes change content hash; identical notes do not',()=>{assert.equal(normalizeRelease(release).hash,normalizeRelease(release).hash);assert.notEqual(normalizeRelease(release).hash,normalizeRelease({...release,body:release.body.replace('托盘','托盘菜单')}).hash);});
