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

/**
 * Not every record was photographed. The archive covers those with a drawn
 * technical plate, which is a designed state rather than a gap — so an absent
 * plate is recorded as an empty path rather than left undefined, and the
 * loader's "every record has an image mapping" rule still holds.
 */
const withGaps = (images, records) => Object.fromEntries(records.map((r) => [r.id, images[r.id] ?? ""]));

const out = {
  specimens: raw.D,
  personnel: raw.P,
  specimenImages: withGaps(remap(raw.dImg, "dinos"), raw.D),
  personnelImages: withGaps(remap(raw.pImg, "personnel"), raw.P),
};

writeFileSync(join(root, "src/data/ingen.json"), JSON.stringify(out, null, 2));
const plated = (m) => Object.values(m).filter(Boolean).length;
console.log(
  `wrote ${out.specimens.length} specimens (${plated(out.specimenImages)} with photography), ` +
    `${out.personnel.length} personnel (${plated(out.personnelImages)} with photography)`
);
