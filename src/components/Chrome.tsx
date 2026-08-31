import type { CSSProperties, ReactNode } from "react";
import { cellDelay, stagger, useReveal } from "../lib/motion";

/** Page frame — the 1440px max-width column every screen sits in. */
export function Page({
  children,
  minHeight,
  style,
}: {
  children: ReactNode;
  minHeight?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 1440,
        margin: "0 auto",
        background: "#0B0F14",
        fontFamily: "'IBM Plex Sans',system-ui,sans-serif",
        color: "#E4E9EF",
        ...(minHeight ? { minHeight: "100vh" } : null),
        ...style,
      }}
    >
      {/* Shell atmosphere: one drifting engineering grid and one pool of light
          from above, both fixed and both behind everything. They are the only
          ambient layers in the product, and at 2.5% and 4.5% they give the page
          depth without ever competing with a record for attention. */}
      <div className="ig-shell-glow" aria-hidden="true" />
      <div className="ig-shell-grid" aria-hidden="true" />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

/** Low-opacity monochrome brand mark. Purely decorative. */
export function Watermark({
  height = "150%",
  opacity = 0.038,
  right = "-1%",
  top = "50%",
}: {
  height?: string;
  opacity?: number;
  right?: string;
  top?: string;
}) {
  return (
    <img
      src="/assets/ingen-mark-mono.png"
      alt=""
      aria-hidden="true"
      style={{
        position: "absolute",
        top,
        right,
        transform: "translateY(-50%)",
        height,
        width: "auto",
        opacity,
        zIndex: -1,
        pointerEvents: "none",
        userSelect: "none",
      }}
    />
  );
}

/** The archival seal block on asset dossiers. */
export function ArchiveSeal({ fileId }: { fileId: string }) {
  const reveal = useReveal();
  return (
    <div
      ref={reveal}
      className="ig-seal"
      data-reveal
      style={{
        flex: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 11,
        padding: "18px 22px 16px",
        border: "1px solid #232D38",
        background: "#0C1117",
      }}
    >
      <img
        src="/assets/ingen-mark.png"
        alt=""
        aria-hidden="true"
        width={46}
        height={48}
        style={{ display: "block", opacity: 0.95 }}
      />
      <span style={{ font: "600 9px 'IBM Plex Mono',monospace", letterSpacing: ".19em", color: "#748899" }}>
        INTERNAL RECORD
      </span>
      <span style={{ width: "100%", height: 1, background: "#1F2833" }} />
      <span style={{ font: "500 11.5px 'IBM Plex Mono',monospace", letterSpacing: ".05em", color: "#9FB2C4" }}>
        {fileId}
      </span>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          font: "600 9px 'IBM Plex Mono',monospace",
          letterSpacing: ".14em",
          color: "#B07A50",
        }}
      >
        <span style={{ width: 5, height: 5, background: "#B07A50" }} />
        ARCHIVED · L5
      </span>
    </div>
  );
}

/**
 * Five-cell meter used for threat, clearance and stat rows.
 *
 * @param animate Fill each cell left-to-right when the enclosing group reveals.
 *                The cells always occupy their space, so this cannot shift layout.
 */
export function Meter({
  cells,
  height,
  gap,
  animate,
}: {
  cells: string[];
  height: number;
  gap: number;
  animate?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap }}>
      {cells.map((ink, i) => (
        <span
          key={i}
          className={animate ? "ig-meter-cell" : undefined}
          style={{ flex: 1, height, background: ink, ...(animate ? cellDelay(i) : null) }}
        />
      ))}
    </div>
  );
}

export function Footer({ total }: { total: number }) {
  return (
    <footer
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "clamp(16px,3vw,32px)",
        padding: "22px clamp(20px,3vw,40px) 30px",
        borderTop: "1px solid #1A222C",
        font: "400 12px 'IBM Plex Sans',sans-serif",
        color: "#6F859D",
      }}
    >
      <span>International Genetic Technologies</span>
      <span style={{ width: 1, height: 11, background: "#28323D" }} />
      <span>Internal records infrastructure</span>
      <span style={{ flex: 1 }} />
      <span style={{ font: "400 11.5px 'IBM Plex Mono',monospace" }}>{total} records indexed</span>
      <span style={{ width: 1, height: 11, background: "#28323D" }} />
      <span>Access logged</span>
    </footer>
  );
}

/** The engineering-drawing plate backdrop shared by the dashboard and dossier plates. */
export function PlateFrame({ grid, inset, children }: { grid: number; inset: number; children: ReactNode }) {
  return (
    <>
      {/* The grid is oversized and drifts by exactly one cell, so the loop is
          seamless and the movement reads as ambient rather than as animation. */}
      <div
        className="ig-plate-grid"
        style={{
          position: "absolute",
          inset: -grid,
          backgroundImage:
            "linear-gradient(rgba(40,70,96,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(40,70,96,.055) 1px,transparent 1px)",
          backgroundSize: `${grid}px ${grid}px`,
        }}
      />
      <div
        style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "rgba(40,70,96,.1)" }}
      />
      <div
        style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 1, background: "rgba(40,70,96,.1)" }}
      />
      <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 ${inset}px rgba(20,36,52,.16)` }} />
      {children}
    </>
  );
}

export function ClassifiedBlock({ children }: { children: ReactNode }) {
  return (
    <div style={{ border: "1px solid #3A2228", background: "#12141A" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "12px 20px",
          borderBottom: "1px solid #3A2228",
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C8524B" strokeWidth="2" aria-hidden="true">
          <rect x="4" y="10" width="16" height="10" rx="1" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
        <span
          style={{
            font: "600 11px 'IBM Plex Sans',sans-serif",
            letterSpacing: ".11em",
            color: "#C8524B",
            textTransform: "uppercase",
          }}
        >
          Classified · Level 5 clearance required
        </span>
      </div>
      <p
        style={{
          margin: 0,
          padding: "22px 24px",
          font: "400 14.5px/1.72 'IBM Plex Sans',sans-serif",
          color: "#B7ABA9",
          maxWidth: "78ch",
          textWrap: "pretty",
        }}
      >
        {children}
      </p>
    </div>
  );
}

/** Timeline used by incident history and assignment history. */
export function Timeline({ events }: { events: { year: string; label: string; slug: string }[] }) {
  const reveal = useReveal();
  return (
    <div ref={reveal} style={{ display: "flex", flexDirection: "column" }}>
      {events.map((ev, i) => (
        <div
          key={ev.slug}
          data-reveal
          style={{ ...stagger(i), display: "grid", gridTemplateColumns: "56px 1fr", gap: 20 }}
        >
          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <span
              style={{
                font: "500 14px 'IBM Plex Mono',monospace",
                color: "#9FB2C4",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {ev.year}
            </span>
            <span style={{ position: "absolute", left: 3, top: 24, bottom: -2, width: 1, background: "#1F2833" }} />
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 25,
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#3D5568",
                boxShadow: "0 0 0 3px #0B0F14",
              }}
            />
          </div>
          <div style={{ paddingBottom: 22 }}>
            <div style={{ font: "600 14.5px 'IBM Plex Sans',sans-serif", color: "#E4E9EF", lineHeight: 1.4 }}>
              {ev.label}
            </div>
            <div
              style={{
                font: "400 11.5px 'IBM Plex Mono',monospace",
                letterSpacing: ".04em",
                color: "#748899",
                marginTop: 5,
              }}
            >
              {ev.slug}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatRows({
  rows,
  meterWidth,
}: {
  rows: { label: string; val: number; cells: string[] }[];
  meterWidth: number;
}) {
  const reveal = useReveal();
  return (
    <div ref={reveal} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {rows.map((s) => (
        <div
          key={s.label}
          style={{ display: "grid", gridTemplateColumns: `1fr ${meterWidth}px 34px`, alignItems: "center", gap: 12 }}
        >
          <span style={{ font: "400 12.5px 'IBM Plex Sans',sans-serif", color: "#8895A5" }}>{s.label}</span>
          <Meter cells={s.cells} height={4} gap={3} animate />
          <span
            style={{
              font: "500 12px 'IBM Plex Mono',monospace",
              color: "#BAC6D2",
              textAlign: "right",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {s.val} / 5
          </span>
        </div>
      ))}
    </div>
  );
}

export const Eyebrow = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      font: "500 11px 'IBM Plex Sans',sans-serif",
      letterSpacing: ".14em",
      color: "#748899",
      textTransform: "uppercase",
    }}
  >
    {children}
  </div>
);
