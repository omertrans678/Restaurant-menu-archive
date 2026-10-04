"""Build static restaurant summaries, on-demand menus and product search shards."""
import argparse,json,re,hashlib
from pathlib import Path

def write(path,data):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf-8')

def lean_product(p):
    out={k:p[k] for k in ('id','name','price','imageUrl','active','description') if k in p}
    out['productScore']={k:(p.get('productScore') or {}).get(k) for k in ('likePercentageInfo','ratingDescription')}
    return out

def build(root):
    folders=sorted((p for p in root.iterdir() if p.is_dir() and re.fullmatch(r'\d{4}-\d{2}-\d{2}_\d{2}-\d{2}_[^/\\]+',p.name)),reverse=True)
    if not folders: raise ValueError(f'No dated folders in {root}')
    folder=folders[0]; output=root/'_texgo'/folder.name
    regions=[]; winners={}; total_bytes=0
    for file in sorted(folder.glob('*.json')):
        raw=json.loads(file.read_text(encoding='utf-8-sig')); stamp=raw.get('collectedAt',''); ids=[]
        for r in raw['restaurants']:
            info=r['info']; rid=str(info['id']); ids.append(rid)
            if rid in winners and winners[rid]['collectedAt']>=stamp: continue
            info={k:info[k] for k in ('id','name','imageUrl','status','closed','tempClosed','commentCount','commentDeeplink','kitchens','deliveryInfo','score','workingHours','workingHoursInterval','location','paymentMethods','attributes','highlightedCampaigns','deliveryFees','pickUpModel') if k in info}
            info['kitchens']=[{'name':k['name']} for k in (info.get('kitchens') or [])]
            info['score']={k:info.get('score',{}).get(k) for k in ('overall','ratingText')} if info.get('score') else None
            info['deliveryInfo']={k:info.get('deliveryInfo',{}).get(k) for k in ('eta','minPrice')}
            info['location']={k:info.get('location',{}).get(k) for k in ('point','address','neighborhoodName')}
            info['paymentMethods']=[{'text':p['text'],'isOnDelivery':p.get('isOnDelivery',False)} for p in (info.get('paymentMethods') or [])]
            info['attributes']=[{'text':a['text']} for a in (info.get('attributes') or [])]
            info['highlightedCampaigns']=[{'title':a['title']} for a in (info.get('highlightedCampaigns') or [])]
            sections=[{'name':c['name'],'products':[lean_product(p) for p in c['products']]} for c in r['sections']]
            count=sum(len(c['products']) for c in sections)
            info['productCount']=count
            info['hasDiscount']=any(p.get('price',{}).get('marketPrice',0)>p.get('price',{}).get('salePrice',float('inf')) for c in sections for p in c['products'])
            info['categories']=list(dict.fromkeys(c['name'] for c in sections))
            info['maxProductPrice']=max((p.get('price',{}).get('salePrice',p.get('price',{}).get('marketPrice',0)) for c in sections for p in c['products']),default=0)
            menu={'info':info,'sections':sections}
            write(output/'menus'/f'{rid}.json',menu)
            winners[rid]={'info':info,'collectedAt':stamp}
        regions.append({'file':file.name,'address':raw.get('address',file.stem),'collectedAt':stamp,'ids':list(dict.fromkeys(ids))})
        total_bytes+=file.stat().st_size
        print(file.name,len(ids),flush=True)
    write(output/'restaurants.json',{'restaurants':[{'info':v['info'],'sections':[]} for v in winners.values()]})
    shards=[]; batch=[]; count=0; total=0
    def flush():
        nonlocal batch,count
        name=f'search/{len(shards):03d}.json'; write(output/name,{'restaurants':batch});shards.append({'path':name,'ids':[str(r['info']['id']) for r in batch]});batch=[];count=0
    for rid in winners:
        menu=json.loads((output/'menus'/f'{rid}.json').read_text(encoding='utf-8'))
        n=menu['info']['productCount']
        if batch and count+n>5000: flush()
        batch.append(menu);count+=n;total+=n
    if batch: flush()
    catalog={'version':4,'folder':folder.name,'regions':regions,'summary':'restaurants.json','search':shards,'restaurantCount':len(winners),'productCount':total}
    catalog['revision']=hashlib.sha256(json.dumps(catalog,sort_keys=True).encode()).hexdigest()[:12]
    write(output/'catalog.json',catalog)
    write(root/'datasets.json',{'folders':[{'name':folder.name,'files':[r['file'] for r in regions]}]})
    print(json.dumps({'root':str(root),'restaurants':len(winners),'products':total,'sourceBytes':total_bytes,'summaryBytes':(output/'restaurants.json').stat().st_size,'shards':len(shards)}),flush=True)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('roots',nargs='+',type=Path)
    for root in parser.parse_args().roots: build(root.resolve())
