import type { RecordKind } from "../data/types";
import { PlateFrame } from "./Chrome";

/**
 * The plate shown for divisions that hold no photography.
 *
 * This is a designed state, not a fallback: locations, facilities, botanical
 * records and operational files were never photographed for the archive, and
 * saying so in the archive's own drafting language is more honest than an empty
 * frame or a stand-in image. It reuses the engineering grid already used behind
 * specimen plates, so it reads as the same system.
 */

const GLYPHS: Record<RecordKind, { title: string; draw: () => JSX.Element }> = {
  location: {
    title: "Site plan",
    draw: () => (
      <>
        <path d="M12 44 L34 20 L56 34 L84 14" />
        <path d="M12 62 L40 54 L64 66 L84 58" />
        <circle cx="48" cy="42" r="7" />
        <path d="M48 28 v-8 M48 64 v8 M34 42 h-8 M62 42 h8" />
      </>
    ),
  },
  facility: {
    title: "Structure elevation",
    draw: () => (
      <>
        <rect x="16" y="30" width="64" height="40" />
        <path d="M16 30 L48 12 L80 30" />
        <rect x="30" y="46" width="14" height="24" />
        <rect x="54" y="46" width="12" height="12" />
      </>
    ),
  },
  flora: {
    title: "Botanical figure",
    draw: () => (
      <>
        <path d="M48 76 V26" />
        <path d="M48 46 C34 42 28 32 28 22 C40 24 46 34 48 46 Z" />
        <path d="M48 56 C62 52 68 42 68 32 C56 34 50 44 48 56 Z" />
        <path d="M38 76 h20" />
      </>
    ),
  },
  incident: {
    title: "Event record",
    draw: () => (
      <>
        <path d="M48 16 L82 74 H14 Z" />
        <path d="M48 38 v18" />
        <circle cx="48" cy="64" r="2.5" />
      </>
    ),
  },
  // Most specimens and personnel carry photography; these stand in for the
  // ones that do not, in the same drafting language as the divisions that were
  // never photographed at all.
  specimen: {
    title: "Reference plate",
    draw: () => (
      <>
        <path d="M18 60 C26 40 40 30 56 30 C68 30 76 36 80 44" />
        <path d="M80 44 C74 46 68 45 64 42" />
        <path d="M56 30 C52 22 44 18 36 20" />
        <path d="M18 60 C24 64 34 66 44 64" />
        <path d="M44 64 l6 12 M58 60 l5 13" />
        <circle cx="72" cy="39" r="1.6" />
      </>
    ),
  },
  person: {
    title: "Personnel plate",
    draw: () => (
      <>
        <circle cx="48" cy="32" r="12" />
        <path d="M26 74 C26 58 36 50 48 50 C60 50 70 58 70 74" />
        <path d="M30 74 h36" />
      </>
    ),
  },
};

export function TechnicalPlate({
  kind,
  fileId,
  caption,
  grid = 36,
  compact = false,
}: {
  kind: RecordKind;
  fileId: string;
  caption?: string;
  grid?: number;
  /** Card-sized rendering: smaller glyph, no caption rule. */
  compact?: boolean;
}) {
  const glyph = GLYPHS[kind];
  return (
    <PlateFrame grid={grid} inset={compact ? 44 : 90}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width={compact ? 76 : 118}
          height={compact ? 76 : 118}
          viewBox="0 0 96 88"
          fill="none"
          stroke="#5A7085"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.5"
          aria-hidden="true"
        >
          {glyph.draw()}
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          left: compact ? 12 : 16,
          bottom: compact ? 10 : 13,
          font: `500 ${compact ? 9 : 11}px 'IBM Plex Mono',monospace`,
          letterSpacing: ".06em",
          color: "#5A7085",
        }}
      >
        {caption ?? glyph.title} · {fileId}
      </div>
    </PlateFrame>
  );
}

/**
 * The plate reduced to a mark, for places too small to carry a caption — the
 * 24×30 portrait cells in the overview and dashboard lists.
 *
 * Those cells used to render RecordImage's "image unavailable" state for any
 * record without photography, which put a shouted line of monospace into a
 * thumbnail barely wide enough for three characters. This says the same thing
 * quietly: the drafting ground, the division's glyph, nothing else.
 */
export function PlateMark({ kind }: { kind: RecordKind }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: "#D8DEE4",
      }}
    >
      <svg
        width="70%"
        height="70%"
        viewBox="0 0 96 88"
        fill="none"
        stroke="#7C8FA1"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.65"
      >
        {GLYPHS[kind].draw()}
      </svg>
    </span>
  );
}
