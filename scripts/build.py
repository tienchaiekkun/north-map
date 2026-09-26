#!/usr/bin/env python3
"""Build index.html from src/index.template.html + data/*.json.
Usage: python3 scripts/build.py   (run from repo root)
"""
import json, re, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
tpl = (ROOT/'src/index.template.html').read_text(encoding='utf-8')
css = re.sub(r'/\*.*?\*/', '', (ROOT/'src/leaflet.css').read_text(encoding='utf-8'), flags=re.S)
html = (tpl.replace('__LEAFLET_CSS__', css)
           .replace('__DATA__',  (ROOT/'data/districts.json').read_text(encoding='utf-8'))
           .replace('__PROV__',  (ROOT/'data/provinces.json').read_text(encoding='utf-8'))
           .replace('__ROADS__', (ROOT/'data/roads.json').read_text(encoding='utf-8')))
(ROOT/'index.html').write_text(html, encoding='utf-8')
print('index.html', len(html.encode()), 'bytes')
