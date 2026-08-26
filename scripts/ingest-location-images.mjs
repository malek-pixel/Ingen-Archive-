/**
 * Ingests location imagery.
 *
 * Reads any image dropped into incoming/locations/, converts it to WebP at the
 * same 1200px cap the record plates use, writes it to public/media/locations/,
 * and records the path in src/data/location-images.json keyed by record id.
 *
 * Partial coverage is expected and supported: a location with no file keeps its
 * technical plate. Re-running is safe — already-ingested files are replaced.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync, unlinkSync } from "node:fs";
import { join, dirname, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const inbox = join(root, "incoming/locations");
const outDir = join(root, "public/media/locations");
const mapPath = join(root, "src/data/location-images.json");

const locations = JSON.parse(readFileSync(join(root, "src/data/locations.json"), "utf8"));
const validIds = new Set(locations.map((l) => l.id));

mkdirSync(outDir, { recursive: true });

const ACCEPTED = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const files = existsSync(inbox) ? readdirSync(inbox).filter((f) => ACCEPTED.has(extname(f).toLowerCase())) : [];

const map = existsSync(mapPath) ? JSON.parse(readFileSync(mapPath, "utf8")) : {};
const unknown = [];
let before = 0;
let after = 0;

for (const file of files) {
  const id = basename(file, extname(file));
  if (!validIds.has(id)) {
    unknown.push(file);
    continue;
  }
  const src = join(inbox, file);
  const out = join(outDir, `${id}.webp`);
  before += statSync(src).size;
  // The written dimensions are recorded, not the source's: the frame that
  // displays this plate takes its shape from the image, so the ratio has to be
  // the one that actually ships.
  const { width, height } = await sharp(src)
    .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 6 })
    .toFile(out);
  after += statSync(out).size;
  map[id] = { src: `/media/locations/${id}.webp`, w: width, h: height };
  unlinkSync(src);
}

// Drop entries whose file has since been deleted, so the map never lies.
for (const [id, entry] of Object.entries(map)) {
  if (!existsSync(join(root, "public", entry.src))) delete map[id];
}

// Repair entries written before dimensions were recorded, so an existing
// archive picks them up without re-ingesting every source file.
for (const [id, entry] of Object.entries(map)) {
  if (entry.w && entry.h) continue;
  const meta = await sharp(join(root, "public", entry.src)).metadata();
  map[id] = { src: entry.src, w: meta.width, h: meta.height };
}

writeFileSync(mapPath, `${JSON.stringify(map, null, 2)}\n`);

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
if (files.length) console.log(`ingested ${files.length - unknown.length} file(s): ${kb(before)} → ${kb(after)}`);
if (unknown.length) {
  console.warn(`\nignored — filename is not a location record id:\n  ${unknown.join("\n  ")}`);
  console.warn(`\nvalid ids:\n  ${[...validIds].join("\n  ")}`);
}

const withImage = Object.keys(map);
const withoutImage = [...validIds].filter((id) => !map[id]);
console.log(`\n${withImage.length}/${validIds.size} locations have imagery`);
if (withoutImage.length) console.log(`technical plate: ${withoutImage.join(", ")}`);
