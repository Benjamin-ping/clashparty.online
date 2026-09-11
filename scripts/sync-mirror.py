"""Latest stable only. Publish manifest last; never clean up on failed publication."""
import hashlib
import json
import os
import re
import tempfile
import urllib.request
from pathlib import Path

PREFIX = 'clashparty-mirror/'

def needs_sync(state, version, base, bucket):
    target=hashlib.sha256(bucket.encode()).hexdigest()
    return state.get('version')!=version or state.get('baseUrl')!=base or state.get('target')!=target

def plan(releases):
    stable = sorted((r for r in releases if not r['prerelease'] and any(not a['name'].endswith('.sha256') for a in r['assets'])), key=lambda r:r['date'], reverse=True)
    if not stable:
        raise ValueError('No stable release')
    release = stable[0]
    assets = release['assets']
    for a in assets:
        if not re.fullmatch(r'clash-party-[A-Za-z0-9._-]+', a['name']) or not a['url'].startswith('https://github.com/mihomo-party-org/clash-party/releases/download/'+release['tag']+'/'):
            raise ValueError('Unexpected official asset')
    return release, [a for a in assets if not a['name'].endswith('.sha256')]

def download(url, target):
    digest = hashlib.sha256()
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent':'clashparty-online-mirror'}), timeout=120) as response, open(target,'wb') as output:
        while chunk := response.read(1024*1024):
            output.write(chunk)
            digest.update(chunk)
    return digest.hexdigest()

def publish(client, bucket, manifest, verify):
    # All assets must already be present and publicly accessible.
    for entry in manifest['assets']:
        verify(entry)
    client.put_object(Bucket=bucket, Key=PREFIX+'latest.json', Body=json.dumps(manifest).encode(), ContentType='application/json', CacheControl='no-store')

def cleanup(client, bucket, keep):
    # Only the dedicated managed prefix may be deleted. Never touch other objects.
    keys=[]
    for page in client.get_paginator('list_objects_v2').paginate(Bucket=bucket, Prefix=PREFIX):
        keys.extend(item['Key'] for item in page.get('Contents',[]) if item['Key'].startswith(PREFIX) and item['Key'] not in keep)
    for key in keys:
        client.delete_object(Bucket=bucket,Key=key)

def main():
    if os.environ.get('R2_MIRROR_ENABLED') != 'true':
        print('Mirror disabled; official downloads retained.')
        return
    import boto3
    from botocore.config import Config
    account=os.environ['R2_ACCOUNT_ID']
    if not re.fullmatch('[a-fA-F0-9]{32}',account):
        raise ValueError('Invalid account ID')
    bucket=os.environ['R2_BUCKET']
    base=os.environ['R2_PUBLIC_BASE_URL'].rstrip('/')
    if not re.fullmatch(r'https://[a-zA-Z0-9.-]+',base):
        raise ValueError('Public base URL must be an HTTPS origin')
    release,assets=plan(json.loads(Path('content/releases.json').read_text(encoding='utf-8-sig')))
    config=Path('content/download-mirror.json')
    state=json.loads(config.read_text(encoding='utf-8-sig')) if config.exists() else {}
    if not needs_sync(state,release['version'],base,bucket):
        print('Stable version unchanged; skip download, upload and cleanup.')
        return
    client=boto3.client('s3',endpoint_url=f'https://{account}.r2.cloudflarestorage.com',region_name='auto',aws_access_key_id=os.environ['R2_ACCESS_KEY_ID'],aws_secret_access_key=os.environ['R2_SECRET_ACCESS_KEY'],config=Config(retries={'max_attempts':5,'mode':'standard'}))
    entries=[]
    with tempfile.TemporaryDirectory(prefix='clashparty-mirror-') as directory:
        for asset in assets:
            name=asset['name']; target=Path(directory)/name
            expected=asset.get('digest') or ''
            if expected.startswith('sha256:'): expected=expected[7:]
            if not re.fullmatch('[a-fA-F0-9]{64}',expected):
                sidecar=next((a for a in release['assets'] if a['name']==name+'.sha256'),None)
                if not sidecar: raise ValueError('No official SHA256 for '+name)
                download(sidecar['url'],str(target)+'.sha256')
                match=re.match(r'^\s*([a-fA-F0-9]{64})(?:\s|$)',Path(str(target)+'.sha256').read_text())
                if not match: raise ValueError('Invalid official checksum')
                expected=match[1]
            key=PREFIX+release['version']+'/'+expected.lower()+'/'+name
            try:
                head=client.head_object(Bucket=bucket,Key=key)
                exists=head['ContentLength']==asset['size'] and head.get('Metadata',{}).get('sha256')==expected.lower()
            except client.exceptions.ClientError as error:
                if error.response['Error']['Code'] not in ('404','NoSuchKey','NotFound'): raise
                exists=False
            if not exists:
                actual=download(asset['url'],target)
                if actual!=expected.lower() or target.stat().st_size!=asset['size']:
                    raise ValueError('Official checksum/size mismatch: '+name)
                with target.open('rb') as body:
                    client.put_object(Bucket=bucket,Key=key,Body=body,ContentLength=asset['size'],Metadata={'sha256':actual},ContentType='application/octet-stream',ContentDisposition=f'attachment; filename="{name}"',CacheControl='public, max-age=31536000, immutable')
                target.unlink()
            checksum=(expected.lower()+'\n').encode()
            client.put_object(Bucket=bucket,Key=key+'.sha256',Body=checksum,ContentType='text/plain',CacheControl='public, max-age=31536000, immutable')
            entries.extend([{'name':name,'key':key,'size':asset['size'],'sha256':expected.lower()},{'name':name+'.sha256','key':key+'.sha256','size':len(checksum)}])
            print('Prepared '+name)
    manifest={'version':release['version'],'assets':entries}
    origin=json.loads(Path('content/site.json').read_text(encoding='utf-8-sig'))['origin']
    def verify(entry):
        with urllib.request.urlopen(urllib.request.Request(base+'/'+entry['key'],headers={'Origin':origin,'User-Agent':'clashparty-online-mirror'},method='HEAD'),timeout=60) as response:
            if int(response.headers.get('Content-Length','-1'))!=entry['size']:
                raise ValueError('Public file verification failed')
            if response.headers.get('Access-Control-Allow-Origin') not in (origin,'*'):
                raise ValueError('Configure bucket CORS before publishing')
    publish(client,bucket,manifest,verify)
    with urllib.request.urlopen(urllib.request.Request(base+'/'+PREFIX+'latest.json',headers={'Origin':origin,'User-Agent':'clashparty-online-mirror'}),timeout=60) as response:
        if json.load(response)!=manifest: raise ValueError('Public manifest stale; no old files deleted')
        if response.headers.get('Access-Control-Allow-Origin') not in (origin,'*'):
            raise ValueError('Manifest CORS check failed; no old files deleted')
    cleanup(client,bucket,{PREFIX+'latest.json',*(e['key'] for e in entries)})
    config.write_text(json.dumps({'baseUrl':base,'version':release['version'],'target':hashlib.sha256(bucket.encode()).hexdigest()})+'\n',encoding='utf-8')
    print('Latest stable mirror published; older managed files removed.')

if __name__=='__main__':
    main()
