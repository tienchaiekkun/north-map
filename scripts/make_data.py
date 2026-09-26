#!/usr/bin/env python3
"""Regenerate data/districts.json, data/provinces.json, data/roads.json from data/raw/.
Requires: mapshaper (npm i -g mapshaper).
Usage: python3 scripts/make_data.py
"""
import json, subprocess, pathlib, collections
ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT/'data/raw'
PROVS = ["50","51","52","54","55","56","57","58","64"]   # add province codes here

# --- districts (simplify 50%, keep shapes) ---
flt = 'JSON.stringify(%s).indexOf("\\""+pro_code+"\\"")>=0' % json.dumps(PROVS)
subprocess.run(['mapshaper', str(RAW/'districts_north17_full.geojson'), '-filter', flt,
                '-simplify','50%','keep-shapes','-clean','-o','precision=0.0001', str(ROOT/'data/_d.geojson')], check=True)
d = json.load(open(ROOT/'data/_d.geojson', encoding='utf-8'))
for f in d['features']:
    p = f['properties']; f['properties'] = {'c':p['amp_code'],'th':p['amp_th'],'en':p['amp_en'],'p':p['pro_code']}
json.dump(d, open(ROOT/'data/districts.json','w',encoding='utf-8'), ensure_ascii=False, separators=(',',':'))
subprocess.run(['mapshaper', str(ROOT/'data/districts.json'), '-dissolve','p','-o', str(ROOT/'data/provinces.json')], check=True)
(ROOT/'data/_d.geojson').unlink()

# --- roads: merge all raw tsv (ref \t class \t "lat,lon lat,lon ...") ---
roads = collections.defaultdict(list)
for fn in sorted(RAW.glob('roads_*.tsv')):
    for ln in open(fn, encoding='utf-8'):
        ln = ln.rstrip('\n')
        if not ln: continue
        ref, hw, pts = ln.split('\t')
        coords = [[float(a), float(b)] for a, b in (p.split(',') for p in pts.split(' '))]
        if hw == 'r' and 'sukhothai' not in fn.name:   # thin tertiary of the 8-province pull (was 300 m spacing)
            coords = coords[::2] + ([coords[-1]] if len(coords) % 2 == 0 else [])
        roads[(ref, hw)].append(coords)
out = [{'r':k[0],'h':k[1],'g':v} for k, v in roads.items()]
json.dump(out, open(ROOT/'data/roads.json','w',encoding='utf-8'), separators=(',',':'), ensure_ascii=False)
print('districts', len(d['features']), 'roads', len(out))
