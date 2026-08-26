import { Link } from "react-router-dom";
import { stagger } from "../lib/motion";
import type { Specimen, WithImage } from "../data/types";
import { cells, containmentShort, plateBlend, specimenStatusShort, threatInk } from "../lib/derive";
import { Meter } from "./Chrome";
import { RecordImage } from "./RecordImage";
import { TechnicalPlate } from "./TechnicalPlate";

export function DinoCard({ d, index = 0 }: { d: WithImage<Specimen>; index?: number }) {
  const t = Number(d.threat) || 0;
  const ink = threatInk(t);
  const status = specimenStatusShort(d.status);
  const contain = containmentShort(d.contain);

  return (
    <Link
      to={`/assets/${d.id}`}
      className="ig-card ig-card--dino"
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
      <div style={{ position: "relative", height: 184, overflow: "hidden", background: "#E3E8ED", flex: "none" }}>
        {d.img ? (
          <>
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "linear-gradient(rgba(40,70,96,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(40,70,96,.05) 1px,transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />
            <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 44px rgba(20,36,52,.14)" }} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "22px 20px",
              }}
            >
              <RecordImage
                className="ig-zoom"
                src={d.img}
                width={248}
                height={140}
                alt={d.name}
                plate
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  objectPosition: "center",
                  mixBlendMode: plateBlend(d.id),
                  display: "block",
                }}
              />
            </div>
          </>
        ) : (
          // Never photographed — the drawn plate, as every unphotographed
          // division uses. Reserving "image unavailable" for a plate that was
          // meant to load and did not keeps that message meaningful.
          <TechnicalPlate kind="specimen" fileId={d.fileId} grid={28} compact />
        )}
        <span className="ig-scanline" aria-hidden="true" />
        <span
          style={{ position: "absolute", top: 12, right: 12, width: 7, height: 7, background: status.ink }}
          title={status.label}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "16px 16px 14px" }}>
        <div
          style={{ font: "700 20px 'Archivo',sans-serif", letterSpacing: "-.02em", color: "#E4E9EF", lineHeight: 1.15 }}
        >
          {d.name}
        </div>
        <div style={{ font: "italic 400 12.5px 'IBM Plex Sans',sans-serif", color: "#788BA0", marginTop: 4 }}>
          {d.species}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 14 }}>
          <span style={{ font: "500 12.5px 'IBM Plex Sans',sans-serif", color: status.ink }}>{status.label}</span>
          <span style={{ width: 1, height: 11, background: "#28323D" }} />
          <span style={{ font: "400 12.5px 'IBM Plex Sans',sans-serif", color: contain.ink }}>{contain.label}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
          <span
            style={{
              font: "400 11.5px 'IBM Plex Sans',sans-serif",
              letterSpacing: ".1em",
              color: "#6F859D",
              textTransform: "uppercase",
            }}
          >
            Threat
          </span>
          <div style={{ display: "flex", flex: 1, maxWidth: 74 }}>
            <Meter cells={cells(t, ink)} height={3} gap={2} animate />
          </div>
          <span
            style={{ font: "500 12.5px 'IBM Plex Mono',monospace", color: ink, fontVariantNumeric: "tabular-nums" }}
          >
            {d.threat}
          </span>
        </div>

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
            {d.fileId}
          </span>
          <span className="ig-openlabel" style={{ font: "500 12.5px 'IBM Plex Sans',sans-serif", color: "#8FA6BC" }}>
            Open record
          </span>
        </div>
      </div>
    </Link>
  );
}
