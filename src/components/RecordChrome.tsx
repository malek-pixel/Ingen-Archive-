import { Link } from "react-router-dom";
import type { SecurityLevel } from "../data/types";
import type { RelatedGroup } from "../lib/archive";
import { stagger, useReveal } from "../lib/motion";

/* ============================================================================
   Shared record chrome — the pieces every division's dossier is built from.
   All of it speaks the existing visual language; none of it is new design.
   ========================================================================== */

/** Security classification ink. Reserved blue stays reserved: it is not used here. */
const SECURITY_INK: Record<SecurityLevel, { ink: string; border: string }> = {
  PUBLIC: { ink: "#7D91A7", border: "#28323D" },
  INTERNAL: { ink: "#8895A5", border: "#28323D" },
  RESTRICTED: { ink: "#9FB2C4", border: "#33414F" },
  CONFIDENTIAL: { ink: "#E0B36A", border: "#4A3E28" },
  CLASSIFIED: { ink: "#E08A84", border: "#4A2C2C" },
  CRITICAL: { ink: "#D2564D", border: "#5E2F30" },
};

export function SecurityBadge({ level, size = "sm" }: { level: SecurityLevel; size?: "sm" | "md" }) {
  const { ink, border } = SECURITY_INK[level];
  return (
    <span
      style={{
        font: `600 ${size === "md" ? 10 : 9}px 'IBM Plex Mono',monospace`,
        letterSpacing: ".14em",
        color: ink,
        border: `1px solid ${border}`,
        padding: size === "md" ? "4px 9px" : "2px 6px",
        whiteSpace: "nowrap",
      }}
    >
      {level}
    </span>
  );
}

/**
 * Status wording across the expansion divisions. Green reads operational, amber
 * conditional, red terminal — the same semantics the specimen cards already use.
 */
function statusInk(status: string): string {
  const s = (status || "").toUpperCase();
  if (/ACTIVE|OPERATIONAL|CULTIVATED|NATURALISED/.test(s)) return "#7ACB9A";
  if (/DESTROYED|LOST|EXTINCT|CLOSED|DECOMMISSIONED/.test(s)) return "#E08A84";
  if (/ABANDONED|DERELICT|SEALED|COMPROMISED|UNCONTAINED|OPEN|RESTRICTED|EXPERIMENTAL|UNKNOWN|NEVER OPENED/.test(s))
    return "#E0B36A";
  return "#8895A5";
}

export function StatusInk({ status }: { status: string }) {
  const ink = statusInk(status);
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        font: "500 12.5px 'IBM Plex Sans',sans-serif",
        color: ink,
      }}
    >
      <span style={{ width: 6, height: 6, background: ink, flex: "none" }} />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

/** A prose section with the dossier's heading treatment. Renders nothing if empty. */
export function RecordSection({
  title,
  aside,
  children,
  body,
}: {
  title: string;
  aside?: string;
  children?: React.ReactNode;
  /** Convenience for a single paragraph of prose. */
  body?: string;
}) {
  if (!children && !body?.trim()) return null;
  return (
    <div style={{ padding: "28px 0", borderBottom: "1px solid #1A222C" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: children ? 22 : 14,
        }}
      >
        <h2 style={{ margin: 0, font: "700 17px 'Archivo',sans-serif", letterSpacing: "-.015em" }}>{title}</h2>
        {aside ? (
          <span style={{ font: "400 12.5px 'IBM Plex Sans',sans-serif", color: "#7D91A7" }}>{aside}</span>
        ) : null}
      </div>
      {body ? (
        <p
          style={{
            margin: 0,
            font: "400 15px/1.72 'IBM Plex Sans',sans-serif",
            color: "#BAC6D2",
            maxWidth: "72ch",
            textWrap: "pretty",
          }}
        >
          {body}
        </p>
      ) : (
        children
      )}
    </div>
  );
}

/** Definition rows — used for the sidebar fact list on expansion dossiers. */
export function FactRows({ facts }: { facts: { label: string; value?: string }[] }) {
  const present = facts.filter((f) => f.value?.trim());
  const reveal = useReveal();
  if (!present.length) return null;
  return (
    <div ref={reveal} style={{ display: "flex", flexDirection: "column", borderTop: "1px solid #1A222C" }}>
      {present.map((f, i) => (
        <div
          key={f.label}
          data-reveal
          style={{
            ...stagger(i),
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 16,
            padding: "12px 0",
            borderBottom: "1px solid #141B23",
          }}
        >
          <span style={{ font: "400 12.5px 'IBM Plex Sans',sans-serif", color: "#788D9F", flex: "none" }}>
            {f.label}
          </span>
          <span
            style={{
              font: "500 13px/1.45 'IBM Plex Sans',sans-serif",
              color: "#BAC6D2",
              textAlign: "right",
              maxWidth: "62%",
            }}
          >
            {f.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TagRow({ tags }: { tags: string[] }) {
  if (!tags?.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {tags.map((t) => (
        <span
          key={t}
          style={{
            font: "400 11px 'IBM Plex Mono',monospace",
            letterSpacing: ".06em",
            color: "#788D9F",
            border: "1px solid #1F2833",
            padding: "3px 8px",
          }}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

/**
 * Cross-division links. Every connected record is reachable in one click, which
 * is the point of the whole relationship layer — an archive whose files
 * reference each other but cannot be traversed is just a set of lists.
 */
export function RelatedRecords({ groups }: { groups: RelatedGroup[] }) {
  const reveal = useReveal();
  if (!groups.length) return null;
  const total = groups.reduce((n, g) => n + g.entries.length, 0);

  return (
    <div style={{ padding: "28px 0", borderBottom: "1px solid #1A222C" }}>
      <div
        style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginBottom: 20 }}
      >
        <h2 style={{ margin: 0, font: "700 17px 'Archivo',sans-serif", letterSpacing: "-.015em" }}>
          Associated records
        </h2>
        <span style={{ font: "400 12.5px 'IBM Plex Sans',sans-serif", color: "#7D91A7" }}>
          {total} cross-referenced
        </span>
      </div>

      <div ref={reveal} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {groups.map((g) => (
          <div key={g.kind}>
            <div
              style={{
                font: "500 10.5px 'IBM Plex Sans',sans-serif",
                letterSpacing: ".13em",
                color: "#788D9F",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              {g.label}
            </div>
            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "1px 24px" }}
            >
              {g.entries.map((e, i) => (
                <Link
                  key={`${e.kind}:${e.id}`}
                  to={e.href}
                  className="ig-index-row"
                  data-reveal
                  style={{
                    ...stagger(i),
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: "1px solid #161D26",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <span
                    className="ig-row-marker"
                    style={{ width: 2, height: 22, background: statusInk(e.status), flex: "none" }}
                  />
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      font: "500 13.5px 'IBM Plex Sans',sans-serif",
                      color: "#E4E9EF",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {e.name}
                  </span>
                  <span
                    style={{
                      font: "400 10.5px 'IBM Plex Mono',monospace",
                      letterSpacing: ".04em",
                      color: "#6B8297",
                      flex: "none",
                    }}
                  >
                    {e.fileId}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
