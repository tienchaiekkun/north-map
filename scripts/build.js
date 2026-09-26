#!/usr/bin/env node
// Build index.html from src/index.template.html + data/*.json (same output as build.py).
// Usage: node scripts/build.js   (run from anywhere)
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const css = read('src/leaflet.css').replace(/\/\*[\s\S]*?\*\//g, '');
// replacement via function so `$` in data is not treated as a pattern
const html = read('src/index.template.html')
  .replace('__LEAFLET_CSS__', () => css)
  .replace('__DATA__',  () => read('data/districts.json'))
  .replace('__PROV__',  () => read('data/provinces.json'))
  .replace('__ROADS__', () => read('data/roads.json'));
fs.writeFileSync(path.join(ROOT, 'index.html'), html);
console.log('index.html', Buffer.byteLength(html), 'bytes');
