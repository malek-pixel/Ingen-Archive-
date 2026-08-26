import { Link } from "react-router-dom";
import type { ArchiveEntry } from "../data/types";
import { division } from "../data/divisions";
import { stagger } from "../lib/motion";
import { RecordImage } from "./RecordImage";
import { TechnicalPlate } from "./TechnicalPlate";
import { SecurityBadge, StatusInk } from "./RecordChrome";

/**
 * The shared archive card, used by every division that has no bespoke card of
 * its own. Specimens and personnel keep their existing cards — their metadata
 * is richer and the designs are frozen — so this covers locations, flora,
 * facilities, operations, and mixed global search results.
 */
export function ArchiveCard({
  entry,
  index = 0,
  meta,
}: {
  entry: ArchiveEntry;
  index?: number;
  /** Up to two division-specific facts shown above the footer rule. */
  meta?: { label: string; value: string }[];
}) {
  const d = division(entry.kind);
  const fills = d.imagery === "plate";

  return (
    <Link
      to={entry.href}
      className="ig-card"
      data-reveal
      style={{
        ...stagger(index),
        display: "flex",
        flexDirection: "column",
        textDecoration: "none",
        color: "inherit",
        background: "#0E131A",
        border: "1px solid #1A222C",
        overflow: "hidden",
        cursor: "pointer",
        fontFamily: "'IBM Plex Sans',system-ui,sans-serif",
      }}
    >
      <div
        style={{
          position: "relative",
          // A plate's frame takes the plate's own proportions. Any fixed ratio
          // forces a choice between cropping the image and margining it, and
          // these run from 2.4:1 panoramas to portrait survey charts. Matching
          // the shape means the image fills the frame exactly — edge to edge,
          // nothing cut off.
          aspectRatio: fills && entry.imgRatio ? String(entry.imgRatio) : "4/3",
          overflow: "hidden",
          background: fills ? "#090D12" : "#E3E8ED",
          flex: "none",
        }}
      >
        {entry.img ? (
          <>
            {fills ? (
              <RecordImage
                className="ig-zoom"
                src={entry.img}
                alt={entry.name}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "18px 16px",
                }}
              >
                <RecordImage
                  className="ig-zoom"
                  src={entry.img}
                  alt={entry.name}
                  plate
                  style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                />
              </div>
            )}
            <span className="ig-scanline" aria-hidden="true" />
          </>
        ) : (
          <TechnicalPlate kind={entry.kind} fileId={entry.fileId} grid={26} compact />
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "16px 16px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <span
            style={{
              font: "500 10px 'IBM Plex Sans',sans-serif",
              letterSpacing: ".13em",
              color: "#788D9F",
              textTransform: "uppercase",
            }}
          >
            {d.badge}
          </span>
          <SecurityBadge level={entry.security} />
        </div>

        <div
          style={{
            font: "700 19px 'Archivo',sans-serif",
            letterSpacing: "-.02em",
            color: "#E4E9EF",
            lineHeight: 1.18,
            marginTop: 10,
          }}
        >
          {entry.name}
        </div>
        <div style={{ font: "400 12.5px/1.45 'IBM Plex Sans',sans-serif", color: "#7D91A7", marginTop: 5 }}>
          {entry.subtitle}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 13 }}>
          <StatusInk status={entry.status} />
        </div>

        {meta?.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 13 }}>
            {meta.map((m) => (
              <div
                key={m.label}
                style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}
              >
                <span
                  style={{
                    font: "400 11.5px 'IBM Plex Sans',sans-serif",
                    letterSpacing: ".06em",
                    color: "#71879F",
                    textTransform: "uppercase",
                  }}
                >
                  {m.label}
                </span>
                <span
                  style={{
                    font: "400 12px 'IBM Plex Sans',sans-serif",
                    color: "#BAC6D2",
                    textAlign: "right",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "62%",
                  }}
                >
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        <div style={{ flex: 1, minHeight: 14 }} />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            paddingTop: 13,
            borderTop: "1px solid #161D26",
          }}
        >
          <span style={{ font: "400 11px 'IBM Plex Mono',monospace", letterSpacing: ".05em", color: "#6B8297" }}>
            {entry.fileId}
          </span>
          <span className="ig-openlabel" style={{ font: "500 12.5px 'IBM Plex Sans',sans-serif", color: "#8FA6BC" }}>
            Open file
          </span>
        </div>
      </div>
    </Link>
  );
}
