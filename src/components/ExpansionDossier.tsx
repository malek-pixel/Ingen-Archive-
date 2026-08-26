import type { ReactNode } from "react";
import type { RecordKind, SecurityLevel } from "../data/types";
import { getRelatedRecords } from "../lib/archive";
import { step } from "../lib/motion";
import { ArchiveSeal, Watermark } from "./Chrome";
import { TechnicalPlate } from "./TechnicalPlate";
import { RecordImage } from "./RecordImage";
import { FactRows, RelatedRecords, SecurityBadge, StatusInk, TagRow } from "./RecordChrome";

/**
 * The dossier shell shared by locations, facilities, botanical records and
 * operational files.
 *
 * It is the specimen dossier's layout with the specimen-specific parts swapped
 * out: same identity block, same archival seal, same sticky aside, same
 * continuous record column. Divisions supply their own sidebar facts and body
 * sections; nothing about the frame is redesigned per division.
 */
export function ExpansionDossier({
  kind,
  id,
  fileId,
  name,
  designation,
  status,
  security,
  badges,
  tags,
  facts,
  aside,
  children,
  relations,
  plateCaption,
  img,
}: {
  kind: RecordKind;
  id: string;
  fileId: string;
  name: string;
  designation: string;
  status: string;
  security: SecurityLevel;
  /** Extra pills beside status, e.g. classification or severity. */
  badges?: { label: string; ink?: string; border?: string }[];
  tags: string[];
  /** Sidebar definition rows. */
  facts: { label: string; value?: string }[];
  /** Optional extra sidebar content below the facts. */
  aside?: ReactNode;
  children: ReactNode;
  relations?: Parameters<typeof getRelatedRecords>[2];
  plateCaption?: string;
  /** Real plate for records that have one; falls back to the technical plate. */
  img?: string;
}) {
  const groups = getRelatedRecords(kind, id, relations);

  return (
    <>
      <div
        style={{
          position: "relative",
          isolation: "isolate",
          overflow: "hidden",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "clamp(24px,4vw,56px)",
          flexWrap: "wrap",
          padding: "clamp(30px,4vw,44px) clamp(20px,3vw,40px) clamp(26px,3vw,34px)",
        }}
      >
        <Watermark top="52%" height="150%" opacity={0.038} />
        <div style={{ flex: 1, minWidth: "min(100%,320px)" }}>
          <div
            data-enter
            style={{
              ...step(0),
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              font: "500 11px 'IBM Plex Sans',sans-serif",
              letterSpacing: ".14em",
              color: "#788D9F",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            <span
              style={{
                font: "500 11.5px 'IBM Plex Mono',monospace",
                letterSpacing: ".06em",
                color: "#7E8C9C",
                textTransform: "none",
              }}
            >
              {fileId}
            </span>
            <span style={{ width: 1, height: 11, background: "#28323D" }} />
            <span>{designation}</span>
          </div>

          <h1
            data-enter
            style={{
              ...step(1),
              margin: 0,
              font: "800 clamp(34px,5vw,58px) 'Archivo',sans-serif",
              letterSpacing: "-.036em",
              lineHeight: 1.02,
            }}
          >
            {name}
          </h1>

          <div
            data-enter
            style={{ ...step(3), display: "flex", gap: 9, marginTop: 24, flexWrap: "wrap", alignItems: "center" }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                padding: "5px 11px",
                border: `1px solid ${statusBorder(status)}`,
              }}
            >
              <StatusInk status={status} />
            </span>
            {badges?.map((b) => (
              <span
                key={b.label}
                style={{
                  padding: "5px 11px",
                  border: `1px solid ${b.border ?? "#232D38"}`,
                  font: "500 12px 'IBM Plex Sans',sans-serif",
                  color: b.ink ?? "#8895A5",
                }}
              >
                {b.label}
              </span>
            ))}
            <SecurityBadge level={security} size="md" />
          </div>
        </div>
        <ArchiveSeal fileId={fileId} />
      </div>

      <div
        className="ig-dossier-body"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,340px) minmax(0,1fr)",
          gap: "clamp(28px,4vw,52px)",
          alignItems: "start",
          padding: "0 clamp(20px,3vw,40px) clamp(40px,5vw,60px)",
        }}
      >
        <div
          className="ig-dossier-aside"
          style={{ position: "sticky", top: 20, display: "flex", flexDirection: "column", gap: 26 }}
        >
          <div data-enter="plate" style={{ ...step(2), border: "1px solid #1A222C" }}>
            <div style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden", background: "#E3E8ED" }}>
              {img ? (
                <>
                  <RecordImage
                    src={img}
                    alt={`${name} — ${plateCaption ?? "reference plate"}`}
                    loading="eager"
                    plate
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      left: 16,
                      bottom: 13,
                      padding: "3px 8px",
                      background: "rgba(11,15,20,.72)",
                      font: "500 11px 'IBM Plex Mono',monospace",
                      letterSpacing: ".06em",
                      color: "#BAC6D2",
                    }}
                  >
                    {plateCaption ?? "Reference plate"} · {fileId}
                  </span>
                </>
              ) : (
                <TechnicalPlate kind={kind} fileId={fileId} caption={plateCaption} />
              )}
            </div>
          </div>

          <FactRows facts={facts} />
          {aside}

          <div>
            <div
              style={{
                font: "500 11px 'IBM Plex Sans',sans-serif",
                letterSpacing: ".13em",
                color: "#788D9F",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Index tags
            </div>
            <TagRow tags={tags} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {children}
          <RelatedRecords groups={groups} />
        </div>
      </div>
    </>
  );
}

function statusBorder(status: string) {
  const s = (status || "").toUpperCase();
  if (/ACTIVE|OPERATIONAL|CULTIVATED|NATURALISED/.test(s)) return "#2C4A3A";
  if (/DESTROYED|LOST|EXTINCT|CLOSED|DECOMMISSIONED/.test(s)) return "#4A2C2C";
  return "#4A3E28";
}
