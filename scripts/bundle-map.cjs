const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const leafletRoot = path.dirname(require.resolve("leaflet/package.json"));
const target = path.join(root, "data", "map", "leaflet-runtime.json");
fs.mkdirSync(path.dirname(target), { recursive: true });
const runtime = {
  version: "1.9.4",
  license: fs.readFileSync(path.join(leafletRoot, "LICENSE"), "utf8"),
  css: fs.readFileSync(path.join(leafletRoot, "dist", "leaflet.css"), "utf8"),
  js: fs.readFileSync(path.join(leafletRoot, "dist", "leaflet.js"), "utf8"),
};
fs.writeFileSync(target, JSON.stringify(runtime));
console.log(`Bundled Leaflet ${runtime.version}; no remote script required.`);
