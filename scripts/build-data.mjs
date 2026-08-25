// One-shot transform: takes the frozen _ingen_data.json export and rewrites the
// upload-relative image paths onto the public/media tree. Re-runnable.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const raw = JSON.parse(readFileSync(join(here, "_ingen_data.raw.json"), "utf8"));

// Images are stored as WebP (see optimize-images.mjs); the raw export still
// names the original .png/.jpg, so resolve to whichever actually exists.
const remap = (map, folder) =>
  Object.fromEntries(
    Object.entries(map).map(([id, p]) => {
      const file = basename(p);
      const webp = `${file.replace(/\.[^.]+$/, "")}.webp`;
      for (const candidate of [webp, file]) {
        if (existsSync(join(root, "public", "media", folder, candidate))) {
          return [id, `/media/${folder}/${candidate}`];
        }
      }
      throw new Error(`missing asset for ${id}: ${file}`);
    })
  );

const out = {
  specimens: raw.D,
  personnel: raw.P,
  specimenImages: remap(raw.dImg, "dinos"),
  personnelImages: remap(raw.pImg, "personnel"),
  stats: raw.s,
};

writeFileSync(join(root, "src/data/ingen.json"), JSON.stringify(out, null, 2));
console.log(`wrote ${out.specimens.length} specimens, ${out.personnel.length} personnel`);
