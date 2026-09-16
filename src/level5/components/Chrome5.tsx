import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { SecurityBadge } from "../../components/RecordChrome";
import { stagger } from "../../lib/motion";
import { useLevel5 } from "../session";
import type { ClassifiedRecord } from "../data";

/* ============================================================================
   Level 5 chrome.

   The pieces every classified screen is assembled from. All of it speaks the
   archive's existing visual language — same type scale, same hairlines, same
   tokens — with density and the reserved classified ink doing the work of
   saying "this layer is different".
   ========================================================================== */

/**
 * Level 5 accents.
 *
 * Two values, and the split matters: the archive's existing --ig-classified-ink
 * (#C8524B) measures 4.36:1 on the page ground, which clears the 3:1 non-text
 * floor but not AA for text. It is kept for rules, ticks and stamp edges; text
 * uses the lifted L5_INK, which clears 4.5:1 on every surface in this layer.
 * Both are checked in test/contrast.test.ts.
 */
export const L5_INK = "#D2726B";
export const L5_EDGE = "#C8524B";
const LINE = "#1E2732";
const MONO = "'IBM Plex Mono',monospace";
const SANS = "'IBM Plex Sans',sans-serif";

/** Small monospaced technical label — the workhorse of this layer. */
export function Tag({
  children,
  ink = "#748899",
  style,
}: {
  children: ReactNode;
  ink?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className="ig-l5-tag"
      // white-space lives in .ig-l5-tag, not here: inline styles cannot be
      // overridden by the narrow-viewport rule that lets these labels wrap.
      style={{ font: `600 9.5px ${MONO}`, letterSpacing: ".16em", color: ink, ...style }}
    >
      {children}
    </span>
  );
}

/** Status dot. Always paired with a text label — never the sole carrier. */
export function Dot({ ink, still }: { ink: string; still?: boolean }) {
  return (
    <span
      className={still ? undefined : "ig-l5-dot"}
      aria-hidden="true"
      style={{ width: 6, height: 6, background: ink, flex: "none" }}
    />
  );
}

/** A bordered panel with HUD register ticks at two corners. */
export function Panel({
  title,
  aside,
  children,
  style,
  seq,
}: {
  title?: string;
  aside?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
  seq?: number;
}) {
  return (
    <section
      className="ig-l5-panel ig-l5-ticked"
      data-seq={seq != null ? "" : undefined}
      style={{ ...(seq != null ? stagger(seq) : null), ...style }}
    >
      {title ? (
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "10px 14px",
            borderBottom: `1px solid ${LINE}`,
          }}
        >
          <Tag>{title}</Tag>
          {aside}
        </header>
      ) : null}
      {children}
    </section>
  );
}

/** The confidentiality banner carried at the top of every Level 5 screen. */
export function ConfidentialBanner() {
  return (
    <div
      className="ig-l5-ticked"
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "8px 18px",
        padding: "11px 16px",
        border: "1px solid #3A2228",
        background: "#12141A",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <LockGlyph />
        <Tag ink={L5_INK}>INGEN CONFIDENTIAL</Tag>
      </span>
      <span style={{ width: 1, height: 11, background: "#3A2228" }} aria-hidden="true" />
      <Tag ink="#B7ABA9">LEVEL 5 RESTRICTED MATERIAL</Tag>
      <span style={{ flex: 1 }} />
      <span style={{ font: `400 11px ${SANS}`, color: "#8895A5" }}>
        All Level 5 material is confidential · Access is monitored
      </span>
    </div>
  );
}

export function LockGlyph({ size = 13, ink = L5_INK }: { size?: number; ink?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={ink} strokeWidth="2" aria-hidden="true">
      <rect x="4" y="10" width="16" height="10" rx="1" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/* --------------------------------------------------------------- session UI */

/** mm:ss remaining on the grant. Ticks once a second, one text node. */
function useCountdown(expiresAt: number | null) {
  const [, force] = useState(0);
  useEffect(() => {
    if (expiresAt == null) return;
    const id = window.setInterval(() => force((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  if (expiresAt == null) return "--:--";
  const left = Math.max(0, expiresAt - Date.now());
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * The session status rail.
 *
 * Every reading is real: the clearance is the session that is actually open,
 * the timer counts the actual grant down, and "secure" describes the app's own
 * state, not a network property it has no way to know.
 */
export function StatusRail({ onLock }: { onLock: () => void }) {
  const { expiresAt } = useLevel5();
  const remaining = useCountdown(expiresAt);

  const cells: { label: string; value: string; ink?: string; dot?: string }[] = [
    { label: "System status", value: "SECURE", dot: "#7ACB9A" },
    { label: "Session", value: "AUTHORIZED", ink: "#DCE6EF" },
    { label: "Clearance", value: "LEVEL 5", ink: L5_INK },
    { label: "Access log", value: "ACTIVE", ink: "#9FB2C4" },
    { label: "Session expires in", value: remaining, ink: "#9FB2C4" },
  ];

  return (
    <div
      className="ig-l5-panel"
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "14px clamp(16px,3vw,34px)",
        padding: "12px 16px",
      }}
    >
      {cells.map((c) => (
        <div key={c.label} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <Tag>{c.label.toUpperCase()}</Tag>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              font: `500 12.5px ${MONO}`,
              color: c.ink ?? "#7ACB9A",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {c.dot ? <Dot ink={c.dot} /> : null}
            {c.value}
          </span>
        </div>
      ))}
      <span style={{ flex: 1 }} />
      <button
        type="button"
        className="ig-btn-danger"
        onClick={onLock}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          minHeight: 44,
          padding: "9px 15px",
          background: "#12141A",
          border: "1px solid #3A2228",
          color: L5_INK,
          font: `600 11px ${MONO}`,
          letterSpacing: ".14em",
          cursor: "pointer",
        }}
      >
        <LockGlyph size={12} />
        LOCK ARCHIVE
      </button>
    </div>
  );
}

/** The in-session activity trace. Fictional in content, real in provenance. */
export function AccessLog({ max = 8 }: { max?: number }) {
  const { log } = useLevel5();
  const shown = log.slice(-max);
  return (
    <Panel
      title="ACCESS LOG"
      aside={
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Dot ink="#7ACB9A" />
          <Tag ink="#7ACB9A">LIVE</Tag>
        </span>
      }
    >
      <ol
        aria-live="polite"
        style={{ listStyle: "none", margin: 0, padding: "10px 14px 12px", display: "grid", gap: 6 }}
      >
        {shown.map((e, i) => (
          <li
            key={`${e.time}-${i}`}
            style={{
              display: "flex",
              gap: 10,
              font: `400 11px ${MONO}`,
              color: e.tone === "warn" ? "#E08A84" : "#788BA0",
            }}
          >
            <span style={{ color: "#5F7183", flex: "none", fontVariantNumeric: "tabular-nums" }}>{e.time}</span>
            <span>{e.message}</span>
          </li>
        ))}
      </ol>
      <p style={{ margin: 0, padding: "0 14px 12px", font: `400 10.5px ${SANS}`, color: "#6B8297" }}>
        Session trace only — generated by this browser tab, not an external security system.
      </p>
    </Panel>
  );
}

/* -------------------------------------------------------------------- cards */

/** A classified record card. Links through to the record's open dossier. */
export function ClassifiedCard({ record, index = 0 }: { record: ClassifiedRecord; index?: number }) {
  return (
    <Link
      to={record.href}
      className="ig-l5-card ig-l5-panel ig-l5-ticked"
      data-seq=""
      style={{
        ...stagger(index),
        display: "flex",
        flexDirection: "column",
        gap: 11,
        padding: "15px 16px 13px",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <span className="ig-l5-read" aria-hidden="true" />
      <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <Tag ink="#6F859D">{record.fileId}</Tag>
        <SecurityBadge level={record.security} />
      </span>

      <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ font: `600 15px ${SANS}`, color: "#E4E9EF", lineHeight: 1.28 }}>{record.name}</span>
        <span
          style={{
            font: `400 12.5px ${SANS}`,
            color: "#8895A5",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {record.subtitle}
        </span>
      </span>

      <span style={{ height: 1, background: LINE }} aria-hidden="true" />

      <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span style={{ font: `500 11px ${MONO}`, letterSpacing: ".06em", color: "#788BA0" }}>{record.status}</span>
        <span className="ig-l5-reveal" style={{ font: `600 9.5px ${MONO}`, letterSpacing: ".14em", color: L5_INK }}>
          OPEN FILE →
        </span>
      </span>
    </Link>
  );
}

/** The designed empty state. Never a blank grid, never an invented record. */
export function EmptyState({ note }: { note?: string }) {
  return (
    <div
      className="ig-l5-panel ig-l5-ticked"
      style={{ padding: "38px 24px", textAlign: "center", display: "grid", gap: 10, justifyItems: "center" }}
    >
      <LockGlyph size={18} ink="#5E2F30" />
      <Tag ink="#788BA0">CLASSIFIED DATASET</Tag>
      <p style={{ margin: 0, font: `600 17px 'Archivo',sans-serif`, color: "#BAC6D2" }}>No records found</p>
      <Tag ink="#6B8297">ACCESS LEVEL: LEVEL 5</Tag>
      {note ? <p style={{ margin: 0, font: `400 12.5px ${SANS}`, color: "#7E8C9C" }}>{note}</p> : null}
    </div>
  );
}

/** Rotated classification stamp. Decorative; the marking is also given as text. */
export function Stamp({ text }: { text: string }) {
  return (
    <span
      className="ig-l5-stamp"
      aria-hidden="true"
      style={{
        display: "inline-block",
        padding: "5px 11px",
        border: `1px solid ${L5_EDGE}`,
        color: L5_INK,
        font: `700 10px ${MONO}`,
        letterSpacing: ".18em",
        opacity: 0.9,
      }}
    >
      {text}
    </span>
  );
}

/**
 * Types a short line out, one character at a time.
 *
 * Driven by a single interval that clears itself at the end, so nothing keeps
 * running once the line has landed.
 */
export function useTypeOut(text: string, speed = 26) {
  const [shown, setShown] = useState(text);
  const reduced = useRef(
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (reduced.current) {
      setShown(text);
      return;
    }
    setShown("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [text, speed]);

  return shown;
}
