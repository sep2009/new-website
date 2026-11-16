// MapLibre's web worker is a standalone file the bundler doesn't pick up (it fails with
// "Worker failed to load"). Serve it from /public so the map can load it by URL.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";

const src = "node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs";
if (!existsSync(src)) {
  console.warn("[maplibre] worker file not found; skipping copy.");
  process.exit(0);
}
mkdirSync("public", { recursive: true });
copyFileSync(src, "public/maplibre-gl-worker.mjs");
console.log("[maplibre] copied worker to public/maplibre-gl-worker.mjs");
