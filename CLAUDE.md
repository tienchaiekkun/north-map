# แผนที่จัดสายส่งภาคเหนือ (north-map)

Single-file Leaflet map for planning delivery runs by อำเภอ across northern Thailand. No backend.

## Layout
- `src/index.template.html` — the app (HTML/CSS/JS). Placeholders: `__LEAFLET_CSS__`, `__DATA__`, `__PROV__`, `__ROADS__`.
- `src/leaflet.css` — Leaflet 1.9.4 CSS (inlined at build). Leaflet JS is loaded from cdnjs.
- `data/districts.json` — 112 อำเภอ, 9 provinces (50 51 52 54 55 56 57 58 64). props: c=amp_code th en p=pro_code.
- `data/provinces.json` — dissolved province polygons (for boundary + labels + road dimming).
- `data/roads.json` — `[{r:ref, h:class, g:[[ [lat,lon],... ], ...]}]`; class m/t/p/s/r = motorway/trunk/primary/secondary/tertiary.
- `data/centers.json` — `{amp_code:[lat,lon]}` "ตัวอำเภอ" point (ที่ว่าการอำเภอ) used as the distance target. Regenerate with `scripts/fetch_centers.js` (OSM townhall where tagged, else Wikidata P625; all verified inside own polygon).
- `data/raw/` — source pulls (district GeoJSON for all 17 northern provinces; road TSVs from Overpass).
- `scripts/build.js` (node) or `scripts/build.py` → writes `index.html` (≈1.45 MB); identical output. **Always rebuild after editing template or data.** (This machine has node but no Python — use `node scripts/build.js`.)
- `scripts/make_data.py` → regenerates the three data JSONs from `data/raw/` (needs `mapshaper`).
- `scripts/fetch_roads_overpass.js` → browser snippet to pull roads for a new province.

## Data sources
- Districts: Royal Thai Survey Dept via github.com/chingchai/OpenGISData-Thailand (`districts.geojson`, 928 อำเภอ). Verified counts match official.
- Roads: OpenStreetMap via Overpass (2026-09-25). Points thinned to 150 m (trunk/primary), 300 m (secondary), 600 m (tertiary), 4 dp.
- Basemaps (optional, need internet): Esri World Street Map / World Imagery. `พื้นเรียบ` mode is fully offline. Do NOT use tile.openstreetmap.org (blocks file:// / no-referer) or CARTO (needs API key now).

## Adding a province
1. Add its pro_code to `PROVS` in `scripts/make_data.py`.
2. Pull roads with `scripts/fetch_roads_overpass.js` (set `ISO`), save as `data/raw/roads_<name>.tsv`.
3. Add code/name/hue to `PROV`, `ORDER`, `PH` in the template.
4. `python3 scripts/make_data.py && node scripts/build.js`.

## UI conventions
- Header = ☰ button + title + road/label segs. ☰ opens a drawer (`#drawer`, overlays the map) holding the district search and province chips; badge on ☰ shows the active-province count when not all are selected. Drawer closes on district pick or when the user touches the map (not on programmatic zoom, so chip toggles keep it open).
- Province chips = multi-select toggles; `ทุกจังหวัด` / `ล้าง`.
- Roads: 3 levels (หลัก / +สายรอง / ทั้งหมด), default `+สายรอง`. Road numbers: ไม่มี / สายหลัก / ทุกสาย, default `ไม่มี`. Roads outside selected provinces are dimmed.
- District borders white, province border dotted navy, roads solid red/orange/brown/grey — keep these distinct.
- Labels: district names always on (zoom-dependent size); road shields rendered per viewport with overlap culling.
- Distances: selecting a district shows road distance/time from the chosen warehouse (`#dist` in the info card, warehouse `<select>`). `📏 วัดระยะ` (`.tools`) enters measure mode: tapping warehouses/districts (or search picks) chains points A→B→C; legs + total in `#mp`, route drawn in pane `route` (blue, dashed when approximated). Routing = OSRM public demo `router.project-osrm.org` (driving, geojson), cached in localStorage `nmap-rt` (≤300 routes); fallback = haversine×1.3 flagged `approx`.
- Warehouses: `WH_DEFAULT` in template (3 branches); user edits (⚙️ โกดัง in the drawer: add via Google Maps link / `lat,lng` / 📍 tap on map, delete, reset) persist in localStorage `nmap-wh`; chosen warehouse id in `nmap3.wh`. Markers (`.wh`) live in pane `lbl`, which therefore has pointer-events enabled — labels keep `pointer-events:none` via CSS.
- Panes `route` and `provl` have `pointer-events:none`: each extra canvas renderer would otherwise swallow clicks meant for the district canvas. Keep this when adding panes.
- State (selected provinces, road level, basemap, warehouse) persisted in localStorage `nmap3`.
- Must work at 390 px width; viewport meta is required.

## Deploy
GitHub Pages from repo root (`index.html`). Rebuild + commit `index.html` (it is a build artifact but is committed so Pages needs no CI).
