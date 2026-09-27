// Precompute the map for the trailer: coastline path and projected places.
import {readFileSync, writeFileSync} from 'node:fs';
import {geoMercator, geoPath} from 'd3-geo';
import {feature} from 'topojson-client';

const topo = JSON.parse(readFileSync('node_modules/world-atlas/land-50m.json', 'utf8'));
const land = feature(topo, topo.objects.land);

// Fit the subcontinent (lon 66-98, lat 5.5-36) into the map box on the left of a 1920x1080 frame.
const box = [[150, 40], [1150, 1040]];
const bbox = {type: 'MultiPoint', coordinates: [[66, 5.5], [98, 36], [66, 36], [98, 5.5]]};
const projection = geoMercator().fitExtent(box, bbox).clipExtent([[0, 0], [1920, 1080]]);
const path = geoPath(projection);

const places = {
  kalinjar: [80.48, 25.0], dhara: [75.3, 22.6], devagiri: [75.21, 19.94], madurai: [78.12, 9.93],
  delhi: [77.21, 28.61], vijayanagara: [76.46, 15.33], cuttack: [85.88, 20.46], saraighat: [91.68, 26.18],
  padmanabhapuram: [77.33, 8.25], ghazni: [68.42, 33.55], kampili: [76.6, 15.4], colombo: [79.86, 6.93],
  kara: [81.35, 25.69],
};
const projected = Object.fromEntries(
  Object.entries(places).map(([k, ll]) => [k, projection(ll).map((v) => Math.round(v * 10) / 10)]),
);
const d = path(land);
writeFileSync('src/mapData.json', JSON.stringify({land: d, places: projected}));
console.log(`map: ${Object.keys(projected).length} places, ${Math.round(d.length / 1024)} KB coastline`);
