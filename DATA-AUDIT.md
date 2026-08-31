# InGen Archive — source-traceability audit

Audited against the four supplied reference archives (85 .docx profiles):

| Source set                             | Files | Scope                |
| -------------------------------------- | ----- | -------------------- |
| `Ingen Archive Character files.zip`    | 22    | personnel, original  |
| `ingen archive charcter expansion.zip` | 12    | personnel, expansion |
| `Ingen Archive Dinosaurs.zip`          | 34    | specimens, original  |
| `Ingen_Archive_Dinosaur_Expansion.zip` | 17    | specimens, expansion |

Standard applied: every field must trace to a source document or to existing
archive data that the sources support. Unverifiable content is reported, not
rewritten from outside knowledge.

## 1. Divisions with no source material at all

These records cannot be verified against anything supplied. No reference file
covers them.

| Division    | Records              |
| ----------- | -------------------- |
| Locations   | 12 (ING-LOC-001…012) |
| Facilities  | 20 (ING-FAC-001…020) |
| Operations  | 12 (ING-OPS-001…012) |
| Paleobotany | 11 (ING-FLR-001…011) |

**55 of 131 records — 42% of the archive — rest on no supplied source.**
Every field in them (dates, purposes, coordinates, participants, relationships)
is currently unsupported. Reference files for these four divisions are the
single largest thing the archive needs.

## 2. Specimen File IDs — BLOCKED, needs a decision

The two dinosaur sets assign **different File IDs to the same species**, and the
archive uses a third numbering matching neither.

| Species           | Original set | Expansion set | Archive     |
| ----------------- | ------------ | ------------- | ----------- |
| Tyrannosaurus rex | ING-DIN-001  | ING-DIN-025   | ING-DIN-001 |
| Velociraptor      | ING-DIN-006  | ING-DIN-026   | ING-DIN-002 |
| Spinosaurus       | ING-DIN-002  | ING-DIN-027   | ING-DIN-005 |
| Triceratops       | ING-DIN-011  | ING-DIN-032   | ING-DIN-022 |
| Stegosaurus       | ING-DIN-012  | ING-DIN-031   | ING-DIN-020 |
| Therizinosaurus   | ING-DIN-020  | ING-DIN-034   | ING-DIN-025 |
| Parasaurolophus   | ING-DIN-016  | ING-DIN-030   | —           |
| Sinoceratops      | ING-DIN-023  | ING-DIN-033   | —           |
| Quetzalcoatlus    | ING-AVI-003  | ING-AVI-005   | ING-AIR-001 |
| Plesiosaurus      | ING-MAR-002  | ING-MAR-003   | ING-MAR-003 |
| Indoraptor        | ING-HYB-002  | ING-HYB-004   | —           |

Comparing the two T. rex profiles, the substance is identical; only the ID and
phrasing differ. The expansion set therefore reads as a **renumbering of
profiles that already existed**, not as new information.

Further problems in the numbering:

- **13 archive specimens carry a File ID that belongs to a different species in
  the sources.** Archive `ING-DIN-011` is Atrociraptor; the original set assigns
  `ING-DIN-011` to Triceratops. Same for Velociraptor, Spinosaurus, Pyroraptor,
  Stegosaurus, Apatosaurus, Nasutoceratops, Stygimoloch, Attenborosaurus.
- **The original set collides with itself**: Attenborosaurus and Plesiosaurus
  are both `ING-MAR-002`.
- Quetzalcoatlus uses prefix `ING-AIR-` in the archive, `ING-AVI-` in both docs.
- Stygimoloch is `ING-HRB-014` (original) and `ING-HRB-015` (expansion).

**RESOLVED (owner ruling, 2026-08-31): the original set governs.**
"Ingen Archive Dinosaurs" numbering was applied to all 38 specimens. Eleven
records were renumbered:

| Specimen        | Was         | Now         |
| --------------- | ----------- | ----------- |
| Quetzalcoatlus  | ING-AIR-001 | ING-AVI-003 |
| Velociraptor    | ING-DIN-002 | ING-DIN-006 |
| Spinosaurus     | ING-DIN-005 | ING-DIN-002 |
| Atrociraptor    | ING-DIN-011 | ING-DIN-028 |
| Pyroraptor      | ING-DIN-012 | ING-DIN-029 |
| Stegosaurus     | ING-DIN-020 | ING-DIN-012 |
| Triceratops     | ING-DIN-022 | ING-DIN-011 |
| Therizinosaurus | ING-DIN-025 | ING-DIN-020 |
| Apatosaurus     | ING-DIN-026 | ING-DIN-035 |
| Nasutoceratops  | ING-DIN-027 | ING-DIN-036 |
| Stygimoloch     | ING-DIN-028 | ING-HRB-014 |

Six species appear only in the expansion set (Apatosaurus, Atrociraptor,
Ichthyosaurs, Nasutoceratops, Pyroraptor, Stygimoloch). The original set says
nothing about them, so they take the expansion value — the only number any
document gives them.

### Two things the ruling could not settle

**Plesiosaurus keeps ING-MAR-003.** The original set assigns it ING-MAR-002,
but that number is already Attenborosaurus in the same set — the collision noted
above. Honouring it would create a duplicate id, so Plesiosaurus retains
ING-MAR-003 (its expansion value). This is the one specimen not numbered from
the governing set. **Both records need a ruling on which is ING-MAR-002.**

**Aerial records carry two prefixes.** The original set numbers Quetzalcoatlus
`ING-AVI-003` while filing Pteranodon, Dimorphodon and Geosternbergia under
`ING-AIR`. Both were applied as written rather than normalised, since the file
id is the record's catalogue number. `register()` in `src/lib/query.ts` now
folds AVI into AIR so the "Flying" filter still returns all four; without that
the renumbering would have silently dropped Quetzalcoatlus from it.

## 3. Missing and unsourced specimens

- **Majungasaurus (ING-DIN-005)** — a full profile and image exist in the
  original set, but there is **no archive record**. Missing entirely.
- **Pteranodon (ING-AIR-002)** — the archive record is titled _Pteranodon_; the
  source document is titled _"Pterodactyl" (Common Name)_, same File ID.

## 4. Personnel — conflicts NOT applied

### Ramsay Cole (ING-CHR-023) — the two describe different people

| Field       | Archive                                  | Source doc                                           |
| ----------- | ---------------------------------------- | ---------------------------------------------------- |
| Occupation  | Head of Communications — Biosyn Genetics | Mercenary / Wildlife Poacher                         |
| Status      | ALIVE                                    | **DECEASED**                                         |
| Nationality | British                                  | American                                             |
| Affiliation | Biosyn Genetics                          | Independent Contractor – Black Market Dinosaur Trade |

The doc's body describes a poacher who raids the Biosyn valley and dies there.
This is not a field-level discrepancy — it is a different character under the
same name.

**RESOLVED (owner ruling, 2026-08-31): the archive record is correct.** Ramsay
Cole is a British Biosyn Genetics executive, alive. `Ramsay Cole File.docx` is
misnamed: it profiles some other, unidentified individual and must not be used
as a source for this record. The archive record stands unchanged.

The subject of that document is not identified anywhere in the supplied
material, so no record is created for it.

### Other substantive conflicts

| Record          | Field       | Archive                         | Source doc                                          |
| --------------- | ----------- | ------------------------------- | --------------------------------------------------- |
| Roland Tembo    | Nationality | Kenyan                          | **British**                                         |
| Lex Murphy      | Occupation  | Endorsement Tour Visitor        | Student                                             |
| Tim Murphy      | Occupation  | Endorsement Tour Visitor        | Student                                             |
| Paul Kirby      | Occupation  | Civilian — Private Search Party | Sporting Goods Store Owner                          |
| Eric Kirby      | Occupation  | Civilian — Recovered Survivor   | Student / Isla Sorna Survivor                       |
| Ken Wheatley    | Occupation  | Mercenary Team Leader           | Big-Game Mercenary / Trophy Hunter                  |
| Eli Mills       | Occupation  | Foundation Operations Director  | Estate Manager / Asset Broker                       |
| Lowery Cruthers | Occupation  | Systems Analyst                 | Park Control Room Technician                        |
| Roland Tembo    | Occupation  | Expedition Field Leader         | Big-Game Hunter                                     |
| Billy Brennan   | Occupation  | Graduate Assistant              | Paleontology Graduate Student                       |
| Donald Gennaro  | Occupation  | Attorney — Cowan, Swain & Ross  | Attorney / Investor Representative                  |
| Lewis Dodgson   | Occupation  | **CEO — Biosyn Genetics**       | Corporate Executive, Genetic Acquisition Specialist |

"Cowan, Swain & Ross" and Dodgson's CEO title do not appear in the sources.

### Unsupported additions to affiliation

Values the archive asserts that no source states:

- **Henry Wu** — archive adds `/ Independent`; doc lists only InGen (Former)
  and Biosyn Genetics (Former).
- **Benjamin Lockwood** — archive marks InGen `(Former)`; doc does not.
- **Eli Mills** — archive says _Lockwood Foundation_; doc says _Lockwood Estate_.

### Detail dropped from affiliation

Archive truncates documented affiliation for Alan Grant, Ellie Sattler, Ian
Malcolm, Sarah Harding, Nick Van Owen (all lose "Former Consultant to InGen"),
Owen Grady (loses "InGen Security Division (formerly)" and Navy service),
Zia Rodriguez, Franklin Webb, and Maisie Lockwood.

## 5. Corrections applied

- **12 personnel File IDs** corrected to the source assignment. The archive's
  023–034 ordering was a permutation of the documents'; the source values form a
  complete, collision-free set, so this was unambiguous.

  | Record          | Was         | Now         |
  | --------------- | ----------- | ----------- |
  | Ramsay Cole     | ING-CHR-034 | ING-CHR-023 |
  | Eli Mills       | ING-CHR-023 | ING-CHR-024 |
  | Gerry Harding   | ING-CHR-032 | ING-CHR-025 |
  | Donald Gennaro  | ING-CHR-025 | ING-CHR-026 |
  | Billy Brennan   | ING-CHR-028 | ING-CHR-027 |
  | Ken Wheatley    | ING-CHR-033 | ING-CHR-028 |
  | Lowery Cruthers | ING-CHR-031 | ING-CHR-029 |
  | Roland Tembo    | ING-CHR-024 | ING-CHR-030 |
  | Eric Kirby      | ING-CHR-030 | ING-CHR-031 |
  | Lex Murphy      | ING-CHR-026 | ING-CHR-032 |
  | Paul Kirby      | ING-CHR-029 | ING-CHR-033 |
  | Tim Murphy      | ING-CHR-027 | ING-CHR-034 |

- **5 full names** completed from the documents' `Full Name` field:
  John Alfred Hammond, Raymond "Ray" Arnold, Victor "Vic" Hoskins,
  Alexis "Lex" Murphy, Timothy "Tim" Murphy.

Honorifics were left alone: the documents are inconsistent (Sarah Harding's
`Full Name` carries "Dr.", Alan Grant's and Ian Malcolm's do not, though their
bodies use it), so removing them would lose supported detail.

## 6. Pipeline defect

`npm run data` regenerates `src/data/ingen.json` from
`scripts/_ingen_data.raw.json`, but the raw file is missing Plesiosaurus
(ING-MAR-003) and Ichthyosaurs (ING-MAR-004) and 17 specimen image paths.
Running it drops 2 specimens and 17 images. Backfill the raw file before using
that command again.
