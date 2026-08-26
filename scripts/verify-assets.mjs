/**
 * Fails the build if any record points at an image that is not on disk, or if
 * an image on disk is not referenced by any record. Both directions matter: a
 * missing file breaks a dossier, an orphan file ships dead weight.
 *
 * Only the specimen and personnel divisions carry photography. Locations,
 * facilities, botanical records and operational files render a technical plate
 * by design, so they are not expected here.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(root, "src/data/ingen.json"), "utf8"));

const locationImages = JSON.parse(readFileSync(join(root, "src/data/location-images.json"), "utf8"));

const referenced = new Set([
  ...Object.values(data.specimenImages),
  ...Object.values(data.personnelImages),
  ...Object.values(locationImages),
]);

const missing = [...referenced].filter((p) => !existsSync(join(root, "public", p)));

// Locations are optional and partially covered, so the folder may not exist yet.
const onDisk = ["dinos", "personnel", "locations"].flatMap((folder) => {
  const dir = join(root, "public/media", folder);
  return existsSync(dir) ? readdirSync(dir).map((f) => `/media/${folder}/${f}`) : [];
});
const orphans = onDisk.filter((p) => !referenced.has(p));

if (missing.length || orphans.length) {
  if (missing.length) console.error(`Missing image files (${missing.length}):\n  ${missing.join("\n  ")}`);
  if (orphans.length) console.error(`Unreferenced image files (${orphans.length}):\n  ${orphans.join("\n  ")}`);
  process.exit(1);
}

console.log(`${referenced.size} record images, all present, no orphans.`);
