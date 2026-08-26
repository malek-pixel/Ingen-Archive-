# InGen Archive

Production rebuild of the frozen InGen Archive design (`*.dc.html` mockups) as a
React + TypeScript + Vite SPA, expanded into a six-division archive. **The design
is frozen** — every colour, type ramp, spacing value and motion curve here is
transcribed from the mockups. The only deliberate departures are documented under
"Design deltas" below.

## Divisions

| Division       | Route          | Records | Identifier                                    |
| -------------- | -------------- | ------- | --------------------------------------------- |
| Genetic assets | `/assets`      | 21      | `ING-DIN` / `ING-MAR` / `ING-HYB` / `ING-AIR` |
| Paleobotany    | `/paleobotany` | 15      | `ING-FLR`                                     |
| Personnel      | `/personnel`   | 22      | `ING-CHR`                                     |
| Locations      | `/locations`   | 12      | `ING-LOC`                                     |
| Facilities     | `/facilities`  | 14      | `ING-FAC`                                     |
| Operations     | `/operations`  | 10      | `ING-OPS`                                     |

Counts are illustrative of the current data — the application never hardcodes
them. `src/data/divisions.ts` is the single source of truth for the taxonomy:
navigation, routing, identifiers, search labelling and every dashboard figure
derive from it, so adding a division means adding an entry there and a data file.

## Run

```bash
npm install
npm run dev
```

| Script              | What it does                                                            |
| ------------------- | ----------------------------------------------------------------------- |
| `npm run dev`       | Vite dev server on :5173                                                |
| `npm run build`     | Typecheck + production build to `dist/`                                 |
| `npm run preview`   | Serve the production build                                              |
| `npm run typecheck` | `tsc -b --noEmit`                                                       |
| `npm run lint`      | ESLint                                                                  |
| `npm test`          | Vitest (data, query logic, route render, interaction, motion fallbacks) |
| `npm run data`      | Regenerate `src/data/ingen.json` from `scripts/_ingen_data.raw.json`    |

## Routes

| Path             | Screen                                                         |
| ---------------- | -------------------------------------------------------------- |
| `/`              | Archive index (master directory)                               |
| `/dashboard`     | Overview — metrics, security intelligence, incident chronology |
| `/assets`        | Genetic asset index — search / filter / sort                   |
| `/assets/:id`    | Asset dossier                                                  |
| `/assets/all`    | Full asset dossier run (`#id` deep links scroll to a record)   |
| `/personnel`     | Personnel index                                                |
| `/personnel/:id` | Personnel file                                                 |
| `/personnel/all` | Full personnel run                                             |
| `/states`        | Interface states reference                                     |
| `*`              | Designed 404                                                   |

Deploying behind a static host requires an SPA history fallback (rewrite all
paths to `/index.html`) — see `public/_redirects` and `vercel.json`.

## Structure

```
src/
  routes/       one module per screen, all lazily loaded
  components/   Header, cards, dossier bodies, toolbar, states, chrome primitives
  data/         ingen.json + typed loader + structural validator
  lib/          derive.ts (frozen semantics), query.ts (search/filter/sort), hooks
  styles/       tokens.css, base.css
```

**Why inline styles.** The mockups are the pixel source of truth and express
layout as inline style attributes. Components carry those values inline verbatim
so a diff against the frozen markup stays readable. `styles/tokens.css` records
the same palette and type stack as CSS custom properties, and `base.css` carries
what inline styles cannot express: keyframes, the `prefers-reduced-motion` guard,
the responsive header rules, and every hover/focus state.

## Data

`src/data/ingen.json` holds the original 43 dossiers (21 specimens, 22 personnel),
generated from the source export by `scripts/build-data.mjs`, which only rewrites
image paths onto `public/media/`. **That file is not hand-edited.**

The expansion divisions live alongside it as `locations.json`, `flora.json`,
`facilities.json` and `operations.json`.

### Relationships

Records link across divisions. Links are declared once — on the expansion record
— and read in both directions through a lazily built reverse index in
`src/lib/archive.ts`, so a specimen dossier shows the incidents and facilities
that reference it without its own record changing. The seven incident slugs the
original specimen and personnel records already carried are resolved into the
Operations division the same way, which is why the two oldest divisions gained a
full set of cross-links with no edits to their data.

Validation is referential: a link pointing at a record that does not exist, or a
facility sited at an unknown location, fails at load rather than rendering a dead
link. `getRelatedRecords()` is exercised across every record in the archive by
`test/expansion.test.tsx`, asserting no self-links and no unresolvable targets.

Every load runs `validateArchive()`: field types, required keys, duplicate ids and
a mapped image for each record. Failures throw `ArchiveDataError` — logged in dev,
and caught by the app error boundary in prod, which renders the designed
"index integrity failure" state rather than a partial index.

## Accessibility

- `header` / `nav` / `main` landmarks on every screen; a skip link to `#main`.
- Icons are `aria-hidden` and always paired with a text label.
- Visible `:focus-visible` ring (2px `#2E9BD6`) on every interactive element.
- **Focus moves to the route wrapper on navigation** (not on first paint), so
  screen-reader and keyboard users follow the page change instead of staying on
  the link they activated.
- **Every text token clears WCAG AA (4.5:1) on all three dark surfaces**, and
  semantic status inks clear the 3:1 non-text floor. Enforced by
  `test/contrast.test.ts`, which measures the palette rather than trusting it.
- Search is labelled; `/` focuses it, `Escape` clears it. Filter chips expose
  `aria-pressed`; the sort button announces the current field and direction.
- Result counts are in an `aria-live="polite"` region.
- The `prefers-reduced-motion` guard from the mockups is preserved verbatim and
  also disables the skeleton sweep.

## Motion

Motion is a thin layer over the frozen design: `src/styles/motion.css` (one
duration ladder, one easing set, one stagger step) plus `src/lib/motion.ts`
(three hooks). **No animation library** — everything asked for here is
`transform`/`opacity`/`box-shadow`, which CSS drives on the compositor. The
whole system costs ~1.6 kB gzipped CSS and ~0.9 kB JS; Framer Motion would have
added ~35 kB gzipped for capability that is not needed.

| Surface            | Behaviour                                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------------------------- |
| Page entry         | `data-enter` + `--ig-step`: eyebrow → heading → text → controls, 55ms apart                                    |
| Scroll reveal      | `data-reveal` + one shared `IntersectionObserver`; unobserved once revealed, so nothing replays                |
| Card / row stagger | `--i` per item, 26ms step capped at 11 (a 21-card grid completes in ~290ms)                                    |
| Cards              | 2px lift, border, restrained blue bloom, one-shot cyan read head over the media well                           |
| Controls           | Hover lift + press (`scale(.984)`, 90ms); search glow; sort arrow and filter dots react                        |
| Nav                | Active rule scales in rather than snapping between items                                                       |
| Data               | Threat/clearance/competency meters fill left-to-right; chronology bars draw; figures count up once             |
| Ambient            | Plate grids drift one cell over 44s — the only continuous motion, confined to surfaces already drawn as a grid |
| Sticky             | Index toolbar and full-run header gain a hairline and blur once scrolled                                       |
| Route change       | 160ms fade-and-rise, keyed on pathname                                                                         |

### The one rule that matters

**Content visibility never depends on an animation succeeding.**

The CSS only applies a hidden start state under `html.ig-motion`, which the
runtime adds _only_ when it can actually drive the sequence. No JavaScript, no
`IntersectionObserver`, or `prefers-reduced-motion` set → nothing is ever
hidden. A watchdog then covers the harder case where the class is set but frames
never advance (a tab that is never composited): after 3s everything is forced
visible, and `useCountUp` falls back to the real figure rather than leaving a
`0` on screen. `test/motion.test.tsx` pins all four failure modes.

Reduced motion is handled twice over: the inherited global guard collapses every
duration, and `motion.css` additionally neutralises the _starting_ states, so
nothing can be left invisible or mid-transform. On touch (`hover: none`)
elevation and the read head are dropped and the stagger halves; the press state
stays, so every control still confirms the touch.

The one property animated outside `transform`/`opacity` is `padding-left` on
`.ig-index-row` / `.ig-sev-row` — that slide is part of the frozen design and
predates this pass, so it was left alone.

## Design deltas

Three, and no more. The motion pass added no visual redesign.

1. **Muted greys lifted for contrast (accessibility remediation).**
   `--ig-text-6..9` were `#5A6878` / `#54626F` / `#4E5D6E` / `#414F5C`, measuring
   2.29–3.37:1 on `#0B0F14` — all four failed AA for text and two failed even
   the 3:1 non-text floor. Hue and the four-step quiet-to-loud hierarchy are
   preserved; only luminance moved, and the ramp still sits below `--ig-text-5`
   so the ordering reads as designed. This is the one change that alters the
   frozen palette, and it was made because the palette did not meet the
   accessibility bar the brief itself set.
2. **Dossier layout below 900px** — the two-column record grid collapses to one
   column and the sticky aside becomes static. The mockups only render at 1440px,
   where the second column otherwise resolves to `0px` and forces page overflow.
3. **Personnel identity block below 560px** — the portrait/name grid stacks and
   the portrait is capped at 200px.

Nothing else was re-themed, re-spaced, or added.

## Imagery across divisions

Only genetic assets and personnel carry photography. The four expansion divisions
render a **technical plate** instead — the engineering grid already used behind
specimen plates, with a division glyph and the record identifier. This is a
designed state, not a fallback: those records were never photographed for the
archive, and drafting language is a more honest answer than a stand-in image.
`hasImagery` on each division records which is which, and `verify:assets` only
demands files for the divisions that have them.

## Media pipeline

Record imagery is WebP, capped at 1200px on the long edge (`npm run images`).
The 43 referenced files total ~325 KB, down from ~1.37 MB of source JPG/PNG.
`npm run verify:assets` fails the build in both directions — a missing file
breaks a dossier, an orphan file ships dead weight — and runs in CI.

A plate that fails to load renders a labelled `IMAGE UNAVAILABLE` placeholder
rather than an empty box, so an absent asset is reported, not hidden.

## Known limitations

- **No visual-regression pass against `screenshots/v4/`.** The brief names this
  as the per-screen acceptance criterion. Structure, computed layout, contrast
  and behaviour are all verified; pixel fidelity is not. It needs a run on a
  machine with a compositing browser.
- **The 404 route returns HTTP 200.** The designed error state renders, but a
  static SPA cannot set a status code. Fixing it properly needs prerendering or
  a host-level rule.
- **Full-run galleries are not windowed.** They rely on `content-visibility:
auto` with a reserved intrinsic size, which skips layout and paint for
  off-screen records. That is enough here at 21/22 records; a much larger
  archive would want real virtualisation.
