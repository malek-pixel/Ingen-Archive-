import { Link } from "react-router-dom";
import { useCountUp, stagger } from "../lib/motion";
import { TechnicalPlate } from "./TechnicalPlate";
import type { ArchiveEntry } from "../data/types";
import type { Division } from "../data/divisions";

/* ============================================================================
   Division module — one terminal in the archive command grid.

   Six of these are the overview's spine, one per division, in the order the
   navigation already uses. Everything a module states is read from the
   archive: the count is the live division count, and the backdrop is a real
   record plate drawn from that division rather than stock imagery.

   A division whose records carry no plate shows the drawn technical plate,
   exactly as those records do. Giving it a borrowed image to even up the grid
   would say something false about the archive.

   The HUD chrome (register code, status dot) is interface, not data, and is
   drawn from fields that already exist: the division's own id prefix and the
   presence of records. Nothing is invented to fill the frame.
   ========================================================================== */

export interface ModuleProps {
  division: Division;
  count: number;
  /** A real record from this division, used for the backdrop plate. */
  cover?: ArchiveEntry;
  index?: number;
}

export function DivisionModule({ division: d, count, cover, index = 0 }: ModuleProps) {
  const [shown, countRef] = useCountUp(count, 520);

  return (
    <Link
      to={`/${d.path}`}
      className="ig-module ig-bracket"
      data-reveal
      style={{
        ...stagger(index),
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        minHeight: 176,
        padding: 18,
        background: "var(--ig-surface,#0C1117)",
        border: "1px solid var(--ig-line,#1A222C)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      {/* Backdrop. Sits under everything and never takes pointer events. */}
      <div
        className="ig-module-media"
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          opacity: 0.34,
          pointerEvents: "none",
        }}
      >
        {cover?.img ? (
          <img
            src={cover.img}
            alt=""
            loading="lazy"
            decoding="async"
            width={400}
            height={220}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              display: "block",
              filter: "grayscale(.35) contrast(1.05)",
            }}
          />
        ) : (
          <TechnicalPlate kind={d.kind} fileId={d.prefix} grid={22} compact />
        )}
      </div>

      {/* The plate is light-on-dark in places, so the label needs its own
          ground rather than relying on the image being dark enough. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background: "linear-gradient(180deg,rgba(11,15,20,.62) 0%,rgba(11,15,20,.78) 46%,rgba(11,15,20,.94) 100%)",
        }}
      />

      <span className="ig-scanline" aria-hidden="true" style={{ zIndex: 2 }} />

      {/* HUD row: register prefix and a status light. */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 18,
          right: 18,
          zIndex: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <span
          style={{
            font: "500 9.5px 'IBM Plex Mono',monospace",
            letterSpacing: ".14em",
            color: "var(--ig-text-9,#6B8297)",
          }}
        >
          {d.prefix}
        </span>
        <span
          className="ig-status-dot"
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            flex: "none",
            background: count > 0 ? "var(--ig-green,#7ACB9A)" : "var(--ig-text-10,#333F4C)",
          }}
        />
      </div>

      {/* Content. */}
      <div style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", gap: 7 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <span
            style={{
              font: "500 10px 'IBM Plex Sans',sans-serif",
              letterSpacing: ".13em",
              color: "var(--ig-text-7,#748899)",
              textTransform: "uppercase",
            }}
          >
            {d.badge}
          </span>
          <span
            ref={countRef}
            style={{
              font: "500 19px 'IBM Plex Mono',monospace",
              color: "var(--ig-text-3,#9FB2C4)",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
            }}
          >
            {shown}
          </span>
        </div>

        <div
          style={{
            font: "700 19px 'Archivo',sans-serif",
            letterSpacing: "-.02em",
            color: "var(--ig-text,#E4E9EF)",
          }}
        >
          {d.label}
        </div>

        <span
          className="ig-module-rule"
          aria-hidden="true"
          style={{ height: 1.5, background: "var(--ig-blue-rule,#2E9BD6)", width: 34, display: "block" }}
        />

        <div
          style={{
            font: "400 12.5px/1.5 'IBM Plex Sans',sans-serif",
            color: "var(--ig-text-5,#7E8C9C)",
            textWrap: "pretty",
          }}
        >
          {d.blurb}
        </div>
      </div>
    </Link>
  );
}
