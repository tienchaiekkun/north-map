// Run in a browser console (e.g. on https://overpass-api.de/api/status) to pull roads for one province.
// Output: gzip+base64 string in window.__b64 -> decode to TSV and save as data/raw/roads_<name>.tsv
// Class codes: m=motorway t=trunk p=primary s=secondary r=tertiary
const ISO = 'TH-64'; // <- province ISO 3166-2 code
const q = `[out:json][timeout:170];area["ISO3166-2"="${ISO}"]->.a;(way["highway"~"^(motorway|trunk|primary)$"](area.a);way["highway"~"^(secondary|tertiary)$"]["ref"](area.a););out tags geom;`;
const j = await (await fetch('https://overpass-api.de/api/interpreter',{method:'POST',body:'data='+encodeURIComponent(q)})).json();
function ds(g,d0){const o=[];let l=null;for(let i=0;i<g.length;i++){const p=g[i];if(i===0||i===g.length-1){o.push(p);l=p;continue;}if(Math.hypot((p.lat-l.lat)*111,(p.lon-l.lon)*105)>=d0){o.push(p);l=p;}}return o;}
const lines=[];for(const w of j.elements){const ref=(w.tags.ref||'').split(';')[0];const hw=w.tags.highway;const c=hw==='tertiary'?'r':hw[0];const d0=(c==='s')?0.3:(c==='r')?0.6:0.15;
  lines.push(ref+'\t'+c+'\t'+ds(w.geometry,d0).map(p=>p.lat.toFixed(4)+','+p.lon.toFixed(4)).join(' '));}
const enc=lines.join('\n');
const cs=new CompressionStream('gzip');const w=cs.writable.getWriter();w.write(new TextEncoder().encode(enc));w.close();
const u8=new Uint8Array(await new Response(cs.readable).arrayBuffer());let s='';for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));
window.__b64=btoa(s); console.log(j.elements.length,'ways', window.__b64.length,'b64 chars');
// python: import base64,gzip; open('roads_x.tsv','w').write(gzip.decompress(base64.b64decode(B64)).decode())
