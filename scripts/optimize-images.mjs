/**
 * Converts every referenced record image to WebP and rewrites the data file to
 * point at it. Idempotent: already-converted files are skipped.
 *
 * Alpha matters here — the two "alpha cutout" specimens composite normally
 * while the rest multiply onto a white plate, so transparency must survive.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync, unlinkSync } from "node:fs";
import { join, dirname, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = join(root, "src/data/ingen.json");
const data = JSON.parse(readFileSync(dataPath, "utf8"));

let before = 0;
let after = 0;
let converted = 0;

async function convert(folder) {
  const dir = join(root, "public/media", folder);
  for (const file of readdirSync(dir)) {
    if (extname(file).toLowerCase() === ".webp") {
      after += statSync(join(dir, file)).size;
      continue;
    }
    const src = join(dir, file);
    const out = join(dir, `${basename(file, extname(file))}.webp`);
    before += statSync(src).size;
    await sharp(src)
      // Cap the longest edge: the largest plate renders at ~640px CSS, and 1200
      // covers 2x displays with room to spare.
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 6 })
      .toFile(out);
    after += statSync(out).size;
    unlinkSync(src);
    converted++;
  }
}

const rewrite = (map) =>
  Object.fromEntries(Object.entries(map).map(([id, p]) => [id, p.replace(/\.(png|jpe?g|webp)$/i, ".webp")]));

await convert("dinos");
await convert("personnel");

data.specimenImages = rewrite(data.specimenImages);
data.personnelImages = rewrite(data.personnelImages);
writeFileSync(dataPath, JSON.stringify(data, null, 2));

// An empty path means the record has no photography and renders the drawn
// technical plate. Skipped explicitly: joining "" would resolve to the public
// directory itself, which exists, so the check would silently pass either way.
const references = [...Object.entries(data.specimenImages), ...Object.entries(data.personnelImages)].filter(
  ([, p]) => p
);
for (const [id, p] of references) {
  if (!existsSync(join(root, "public", p))) throw new Error(`broken image reference after convert: ${id} -> ${p}`);
}

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(`converted ${converted} files`);
console.log(
  `before ${kb(before)} → after ${kb(after)}  (${(100 - (after / (before || 1)) * 100).toFixed(0)}% smaller)`
);
console.log(`all ${references.length} references verified`);
