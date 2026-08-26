import { Link } from "react-router-dom";
import { stagger } from "../lib/motion";
import type { Person, WithImage } from "../data/types";
import { clearance, deptShort, personStatusShort } from "../lib/derive";
import { RecordImage } from "./RecordImage";
import { TechnicalPlate } from "./TechnicalPlate";

export function PersonnelCard({ p, index = 0 }: { p: WithImage<Person>; index?: number }) {
  const status = personStatusShort(p.status);
  const cl = clearance(p.clearance);

  return (
    <Link
      to={`/personnel/${p.id}`}
      className="ig-card ig-card--person"
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
      <div style={{ display: "flex", gap: 15, padding: 16 }}>
        <div
          style={{
            position: "relative",
            width: 82,
            height: 104,
            flex: "none",
            background: "#0B0F14",
            overflow: "hidden",
          }}
        >
          <span className="ig-scanline" aria-hidden="true" style={{ zIndex: 1 }} />
          {p.img ? (
            <RecordImage
              className="ig-zoom"
              src={p.img}
              width={82}
              height={104}
              alt={p.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center 16%",
                display: "block",
                filter: "saturate(.82) contrast(1.03)",
              }}
            />
          ) : (
            // No portrait on file — the drawn plate rather than an error state.
            <TechnicalPlate kind="person" fileId={p.fileId} grid={20} compact />
          )}
          <span
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              padding: "2px 6px",
              background: "rgba(11,15,20,.82)",
              font: "500 10px 'IBM Plex Mono',monospace",
              letterSpacing: ".06em",
              color: status.ink,
            }}
          >
            {status.label}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ font: "400 10.5px 'IBM Plex Mono',monospace", letterSpacing: ".08em", color: "#6B8297" }}>
            {p.fileId}
          </div>
          <div
            style={{
              font: "700 18px 'Archivo',sans-serif",
              letterSpacing: "-.018em",
              color: "#E4E9EF",
              lineHeight: 1.18,
              marginTop: 5,
            }}
          >
            {p.name}
          </div>
          <div
            style={{ font: "400 12.5px 'IBM Plex Sans',sans-serif", color: "#8895A5", marginTop: 5, lineHeight: 1.4 }}
          >
            {p.role}
          </div>
          <div style={{ flex: 1, minHeight: 8 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span
              style={{
                font: "600 12px 'IBM Plex Mono',monospace",
                color: cl.ink,
                padding: "2px 8px",
                border: `1px solid ${cl.border}`,
                background: cl.fill,
              }}
            >
              L{p.clearance}
            </span>
            <span style={{ font: "400 11.5px 'IBM Plex Sans',sans-serif", color: "#748899" }}>{cl.word}</span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "11px 16px",
          borderTop: "1px solid #161D26",
        }}
      >
        <span
          style={{
            font: "400 12.5px 'IBM Plex Sans',sans-serif",
            color: "#7E8C9C",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {deptShort(p.dept)}
        </span>
        <span
          className="ig-openlabel"
          style={{ font: "500 12.5px 'IBM Plex Sans',sans-serif", color: "#8FA6BC", flex: "none" }}
        >
          Open file
        </span>
      </div>
    </Link>
  );
}
