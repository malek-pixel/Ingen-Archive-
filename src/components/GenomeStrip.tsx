import type { Specimen } from "../data/types";

/* ============================================================================
   Genome strip — the sequencing instrument on a specimen record.

   What is real and what is not, because on this project that distinction is
   the whole point:

   REAL      the integrity figure. `genome` is a recorded field (0-100) on 35 of
             the 38 specimens, and it is printed as the number it is.
   DECORATIVE the helix and the tick track. InGen never recorded base sequences,
             so none are shown. The strip is instrument chrome — the housing a
             reading sits in — and it is labelled "sequencing trace" rather than
             anything that would read as data.

   The three specimens with no figure on file get the unsequenced state: the
   trace goes flat and still, and the strip says so. Inventing a percentage to
   keep the animation lively would be exactly the fabrication this archive
   exists to avoid, and a flat line is a more honest silhouette than a busy one.

   Drawn once as an SVG pattern and translated by whole tiles, so the loop is
   seamless and the only animated property is `transform`.
   ========================================================================== */

/**
 * One helix period, as a tiling background.
 *
 * Rendered as a data-URI rather than an inline <svg> element: an inline svg
 * sized `height:100%; width:auto` collapses to its intrinsic 96px and leaves
 * the rest of the strip empty, which is exactly what it did the first time.
 * As a background it repeats across any card width for free, and the animation
 * only has to travel one tile before the pattern lines up again.
 *
 * The stroke colour is baked in because a data-URI cannot read a CSS variable.
 * It is --ig-blue-l5 from the palette; the literal is the same value.
 */
const TILE = 48;
const HELIX_INK = "%237CB9E0"; // #7CB9E0 — --ig-blue-l5, URI-encoded

const helixTile = () =>
  `url("data:image/svg+xml,` +
  `%3Csvg xmlns='http://www.w3.org/2000/svg' width='${TILE}' height='20' viewBox='0 0 ${TILE} 20'%3E` +
  `%3Cg stroke='${HELIX_INK}' fill='none' stroke-width='1'%3E` +
  `%3Cpath d='M0 10 C 12 2, 36 18, 48 10'/%3E` +
  `%3Cpath d='M0 10 C 12 18, 36 2, 48 10'/%3E` +
  `%3Cline x1='24' y1='5.5' x2='24' y2='14.5' opacity='.55'/%3E` +
  `%3Cline x1='8' y1='7.5' x2='8' y2='12.5' opacity='.3'/%3E` +
  `%3Cline x1='40' y1='7.5' x2='40' y2='12.5' opacity='.3'/%3E` +
  `%3C/g%3E%3C/svg%3E")`;

export function GenomeStrip({ d, compact = false }: { d: Pick<Specimen, "genome">; compact?: boolean }) {
  // `genome` is optional in the schema. 0 is a legitimate reading, so the test
  // is for the field being present rather than for truthiness.
  const sequenced = typeof d.genome === "number" && Number.isFinite(d.genome);
  const pct = sequenced ? Math.max(0, Math.min(100, d.genome as number)) : 0;

  // Integrity drives how present the trace is, so a degraded genome reads as a
  // fainter signal. The ceiling is deliberately well under 1: at rest this is
  // chrome at the foot of a plate, and a fully-sequenced specimen should not
  // out-shout the animal above it. Hover takes it the rest of the way.
  const strength = sequenced ? 0.2 + (pct / 100) * 0.4 : 0;

  return (
    <div
      className="ig-genome"
      data-sequenced={sequenced ? "true" : "false"}
      aria-hidden="true"
      style={{
        position: "relative",
        height: compact ? 20 : 24,
        overflow: "hidden",
        background: "linear-gradient(180deg,rgba(11,15,20,0) 0%,rgba(11,15,20,.55) 45%,rgba(11,15,20,.8) 100%)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 10px",
        pointerEvents: "none",
      }}
    >
      <div style={{ position: "relative", flex: 1, height: "100%", overflow: "hidden" }}>
        {sequenced ? (
          // One tile wider than the strip and translated by exactly one tile:
          // the seam always lands where the pattern already repeats, so the
          // loop is invisible at any card width.
          <div
            className="ig-genome-track"
            style={{
              opacity: strength,
              backgroundImage: helixTile(),
              backgroundRepeat: "repeat-x",
              backgroundSize: `${TILE}px 100%`,
            }}
          />
        ) : (
          // Unsequenced: a flat baseline, no motion. Nothing is claimed.
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              height: 1,
              background: "var(--ig-line-strong,#232D38)",
            }}
          />
        )}
      </div>

      <span
        style={{
          font: "500 9.5px 'IBM Plex Mono',monospace",
          letterSpacing: ".08em",
          color: sequenced ? "var(--ig-text-8,#6F859D)" : "var(--ig-text-10,#333F4C)",
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
          flex: "none",
        }}
      >
        {sequenced ? `${pct}%` : "NO SEQ"}
      </span>
    </div>
  );
}

/**
 * The dossier-scale strip: the same instrument with its reading spelled out.
 * The house "0 means unrated" pattern does not apply here — 0% integrity is a
 * meaningful reading, so absence is tested for rather than falsiness.
 */
export function GenomeReadout({ d }: { d: Pick<Specimen, "genome"> }) {
  const sequenced = typeof d.genome === "number" && Number.isFinite(d.genome);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <span
          style={{
            font: "400 11px 'IBM Plex Sans',sans-serif",
            letterSpacing: ".1em",
            color: "var(--ig-text-8,#6F859D)",
            textTransform: "uppercase",
          }}
        >
          Sequencing trace
        </span>
        <span
          style={{
            font: "500 12.5px 'IBM Plex Mono',monospace",
            color: sequenced ? "var(--ig-blue-l5,#7CB9E0)" : "var(--ig-text-10,#333F4C)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {sequenced ? `${d.genome}% integrity` : "Not on file"}
        </span>
      </div>
      <GenomeStrip d={d} />
    </div>
  );
}
