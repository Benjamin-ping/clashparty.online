const configElement=document.querySelector('[data-mirror-base]');
if(configElement?.dataset.mirrorBase){
  const base=configElement.dataset.mirrorBase;
  fetch(base+'/clashparty-mirror/latest.json',{cache:'no-store',signal:AbortSignal.timeout(10000)})
    .then(r=>{if(!r.ok)throw Error('unavailable');return r.json();})
    .then(manifest=>{
      if(manifest.version!==configElement.dataset.version||!Array.isArray(manifest.assets))return;
      for(const card of document.querySelectorAll('[data-mirror-name]')){
        const entry=manifest.assets.find(a=>a.name===card.dataset.mirrorName);
        if(!entry||!/^clashparty-mirror\/[\w.-]+\/[a-f0-9]{64}\/clash-party-[\w.-]+$/.test(entry.key)||entry.key.split('/').at(-1)!==entry.name)return;
        const link=document.createElement('a');link.className='download-link';link.href=base+'/'+entry.key;link.textContent='本站下载 ↗';link.rel='noopener noreferrer';link.target='_blank';
        card.querySelector('.download-link').parentElement.prepend(link);
      }
    }).catch(()=>{/* Official links remain available if the mirror cannot be reached. */});
}
