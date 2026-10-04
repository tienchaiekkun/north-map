#!/usr/bin/env node
// Regenerate data/centers.json = { amp_code: [lat, lon] } — the "ตัวอำเภอ" point used for distances.
// Source: OSM amenity=townhall named "ที่ว่าการอำเภอ…" (Overpass) where tagged, else Wikidata P625 of the amphoe item.
// Usage: node scripts/fetch_centers.js   (needs internet; Overpass may be slow/busy — rerun if it fails)
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const D = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/districts.json'), 'utf8'));
const PROV = {'50':'เชียงใหม่','51':'ลำพูน','52':'ลำปาง','54':'แพร่','55':'น่าน','56':'พะเยา','57':'เชียงราย','58':'แม่ฮ่องสอน','64':'สุโขทัย'};
const UA = { 'User-Agent': 'north-map/1.0 (github.com/tienchaiekkun/north-map)' };
const codes = Object.keys(PROV);

function pip(lat, lng, ring) { let ins = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
  const xi = ring[i][1], yi = ring[i][0], xj = ring[j][1], yj = ring[j][0];
  if (((xi > lat) !== (xj > lat)) && (lng < (yj - yi) * (lat - xi) / (xj - xi) + yi)) ins = !ins; } return ins; }
const inside = (f, lat, lon) => { const g = f.geometry; const rings = g.type === 'Polygon' ? [g.coordinates[0]] : g.coordinates.map(p => p[0]); return rings.some(r => pip(lat, lon, r)); };

async function wikidata() {
  const vals = codes.map(c => `"จังหวัด${PROV[c]}"@th`).join(' ');
  const q = `SELECT ?th ?prov ?coord WHERE { VALUES ?prov { ${vals} } ?p rdfs:label ?prov.
    ?item wdt:P131 ?p; wdt:P625 ?coord; rdfs:label ?th. FILTER(lang(?th)="th" && STRSTARTS(?th,"อำเภอ")) }`;
  const r = await fetch('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(q), { headers: { ...UA, Accept: 'application/sparql-results+json' } });
  const j = await r.json();
  return j.results.bindings.map(b => { const m = /Point\(([-\d.]+) ([-\d.]+)\)/.exec(b.coord.value);
    return { th: b.th.value.replace(/^อำเภอ/, '').replace(/\s+/g, ''), prov: b.prov.value.replace('จังหวัด', ''), lat: +m[2], lon: +m[1] }; });
}
async function overpass() {
  const q = `[out:json][timeout:170];area["ISO3166-2"~"^TH-(${codes.join('|')})$"]->.a;nwr["amenity"="townhall"]["name"~"ที่ว่าการอำเภอ"](area.a);out center tags;`;
  for (const url of ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']) {
    try { const r = await fetch(url, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { ...UA, 'Content-Type': 'application/x-www-form-urlencoded' } });
      const t = await r.text(); if (r.ok && t.trim().startsWith('{')) return JSON.parse(t).elements.map(e => ({ th: e.tags.name.replace(/\s+/g, '').replace('ที่ว่าการอำเภอ', ''), lat: e.lat ?? e.center.lat, lon: e.lon ?? e.center.lon }));
      console.error('overpass', url, r.status); } catch (e) { console.error('overpass', url, e.message); }
  }
  console.error('Overpass unavailable — using Wikidata only'); return [];
}

(async () => {
  const [wd, th] = await Promise.all([wikidata(), overpass()]);
  const out = {}; let nOsm = 0; const miss = [];
  for (const f of D.features) { const p = f.properties;
    let w = th.find(t => t.th === p.th && inside(f, t.lat, t.lon)); if (w) nOsm++;
    if (!w) w = wd.find(t => t.th === p.th && t.prov === PROV[p.p]);
    if (!w) { miss.push(`${p.th} (${PROV[p.p]})`); continue; }
    if (!inside(f, w.lat, w.lon)) console.warn('outside own polygon:', p.th);
    out[p.c] = [+w.lat.toFixed(5), +w.lon.toFixed(5)]; }
  fs.writeFileSync(path.join(ROOT, 'data/centers.json'), JSON.stringify(out));
  console.log(`centers.json: ${Object.keys(out).length}/${D.features.length} districts (${nOsm} from OSM townhall, rest Wikidata)`);
  if (miss.length) console.warn('MISSING:', miss.join(', '));
})();
