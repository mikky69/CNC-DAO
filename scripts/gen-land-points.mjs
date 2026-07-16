import { geoContains } from "d3-geo";
import { feature } from "topojson-client";
import land110m from "world-atlas/land-110m.json" with { type: "json" };
import fs from "fs";

const landFeature = feature(land110m, land110m.objects.land);
const points = [];
const step = 2.5;
for (let lat = -80; lat <= 80; lat += step) {
  for (let lng = -180; lng <= 180; lng += step) {
    if (geoContains(landFeature, [lng, lat])) {
      points.push([Math.round(lng * 10) / 10, Math.round(lat * 10) / 10]);
    }
  }
}
console.log("point count:", points.length);
fs.writeFileSync("./components/land-points.json", JSON.stringify(points));
