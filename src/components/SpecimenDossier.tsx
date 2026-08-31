import type { Specimen, WithImage } from "../data/types";
import { ArchiveSeal, ClassifiedBlock, Meter, PlateFrame, StatRows, Timeline, Watermark } from "./Chrome";
import { GenomeReadout } from "./GenomeStrip";
import {
  byYear,
  cells,
  containment,
  dietLabel,
  humanizeStat,
  parseSlug,
  plateBlend,
  specimenStatus,
  threatInk,
  threatValue,
  threatLabel,
} from "../lib/derive";
import { stagger, step, useReveal } from "../lib/motion";
import { RecordImage } from "./RecordImage";
import { TechnicalPlate } from "./TechnicalPlate";
import { RelatedRecords } from "./RecordChrome";
import { getRelatedRecords } from "../lib/archive";

/** The asset dossier body — shared by the detail route and the full-run gallery. */
export function SpecimenDossier({ d }: { d: WithImage<Specimen> }) {
  const specsReveal = useReveal();
  const related = getRelatedRecords("specimen", d.id);
  const threatReveal = useReveal();
  const t = Number(d.threat) || 0;
  const ink = threatInk(t, true);
  const status = specimenStatus(d.status);
  const contain = containment(d.contain);
  const statRows = Object.entries(d.stats ?? {}).map(([k, v]) => ({
    label: humanizeStat(k),
    val: v,
    cells: cells(v, "#5A6E82"),
  }));
  const specs = [
    { label: "Length", value: d.length || "—" },
    { label: "Weight", value: d.weight || "—" },
    { label: "Habitat", value: d.habitat || "—" },
    { label: "Genome completion", value: d.genome != null ? `${d.genome}%` : "—" },
  ];
  const incidents = (d.incidents ?? []).map(parseSlug).sort(byYear);

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
              font: "500 11px 'IBM Plex Sans',sans-serif",
              letterSpacing: ".14em",
              color: "#748899",
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
              {d.fileId}
            </span>
            <span style={{ width: 1, height: 11, background: "#28323D" }} />
            <span>{d.classification}</span>
          </div>
          <h1
            data-enter
            style={{
              ...step(1),
              margin: 0,
              font: "800 clamp(40px,5.6vw,64px) 'Archivo',sans-serif",
              letterSpacing: "-.038em",
              lineHeight: 1,
            }}
          >
            {d.name}
          </h1>
          <div
            data-enter
            style={{ ...step(2), display: "flex", alignItems: "baseline", gap: 14, marginTop: 12, flexWrap: "wrap" }}
          >
            <span style={{ font: "italic 400 17px 'IBM Plex Sans',sans-serif", color: "#8895A5" }}>{d.species}</span>
            {d.codename?.trim() && (
              <span style={{ font: "400 13px 'IBM Plex Sans',sans-serif", color: "#788BA0" }}>
                Field designation “{d.codename}”
              </span>
            )}
          </div>
          <div data-enter style={{ ...step(3), display: "flex", gap: 9, marginTop: 24, flexWrap: "wrap" }}>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "5px 11px",
                border: `1px solid ${status.border}`,
                font: "500 12px 'IBM Plex Sans',sans-serif",
                color: status.ink,
              }}
            >
              <span style={{ width: 6, height: 6, background: status.ink }} />
              {status.label}
            </span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "5px 11px",
                border: `1px solid ${contain.border}`,
                font: "500 12px 'IBM Plex Sans',sans-serif",
                color: contain.ink,
              }}
            >
              <span style={{ width: 6, height: 6, background: contain.ink }} />
              {contain.label}
            </span>
            <span
              style={{
                padding: "5px 11px",
                border: "1px solid #232D38",
                font: "500 12px 'IBM Plex Sans',sans-serif",
                color: "#8895A5",
              }}
            >
              {dietLabel(d.diet)}
            </span>
          </div>
        </div>
        <ArchiveSeal fileId={d.fileId} />
      </div>

      <div
        className="ig-dossier-body"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,400px) minmax(0,1fr)",
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
            <div style={{ position: "relative", aspectRatio: "1/1", overflow: "hidden", background: "#E3E8ED" }}>
              {d.img ? (
                <PlateFrame grid={36} inset={90}>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "clamp(28px,4vw,48px)",
                    }}
                  >
                    <RecordImage
                      src={d.img}
                      alt={`${d.name} reference plate`}
                      plate
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        width: "auto",
                        height: "auto",
                        objectFit: "contain",
                        mixBlendMode: plateBlend(d.id),
                        display: "block",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: 16,
                      bottom: 13,
                      font: "500 11px 'IBM Plex Mono',monospace",
                      letterSpacing: ".06em",
                      color: "#5A7085",
                    }}
                  >
                    Reference plate · {d.fileId}
                  </div>
                </PlateFrame>
              ) : (
                // Same frame, same caption line — drawn rather than photographed.
                <TechnicalPlate kind="specimen" fileId={d.fileId} />
              )}
            </div>
          </div>

          <div ref={threatReveal}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
              <span
                style={{
                  font: "500 11px 'IBM Plex Sans',sans-serif",
                  letterSpacing: ".13em",
                  color: "#748899",
                  textTransform: "uppercase",
                }}
              >
                Threat assessment
              </span>
              <span style={{ font: "700 21px 'Archivo',sans-serif", color: ink, fontVariantNumeric: "tabular-nums" }}>
                {threatValue(t)}
                <span style={{ font: "500 12px 'IBM Plex Mono',monospace", color: "#6F859D" }}> / 5</span>
              </span>
            </div>
            <Meter cells={cells(t, ink)} height={5} gap={4} animate />
            <p
              style={{
                margin: "11px 0 0",
                font: "400 12.5px/1.5 'IBM Plex Sans',sans-serif",
                color: "#7E8C9C",
                textWrap: "pretty",
              }}
            >
              {threatLabel(t)}
            </p>
            {/* The same instrument the index card carries, at dossier scale.
                It repeats the genome figure already in the fact rows above
                rather than adding a claim — the trace is the housing, the
                percentage is the record. */}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #161D26" }}>
              <GenomeReadout d={d} />
            </div>
          </div>

          <div>
            <div
              style={{
                font: "500 11px 'IBM Plex Sans',sans-serif",
                letterSpacing: ".13em",
                color: "#748899",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              Behavioral profile
            </div>
            <StatRows rows={statRows} meterWidth={88} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            ref={specsReveal}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
              gap: "24px 28px",
              paddingBottom: 28,
              borderBottom: "1px solid #1A222C",
            }}
          >
            {specs.map((sp, i) => (
              <div key={sp.label} data-reveal style={stagger(i)}>
                <div
                  style={{
                    font: "500 10.5px 'IBM Plex Sans',sans-serif",
                    letterSpacing: ".11em",
                    color: "#748899",
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  {sp.label}
                </div>
                <div style={{ font: "600 15px 'IBM Plex Sans',sans-serif", color: "#E4E9EF", lineHeight: 1.35 }}>
                  {sp.value}
                </div>
              </div>
            ))}
          </div>

          {d.tag?.trim() && (
            <p
              style={{
                margin: 0,
                padding: "28px 0",
                borderBottom: "1px solid #1A222C",
                font: "400 21px/1.5 'IBM Plex Sans',sans-serif",
                color: "#9FB2C4",
                maxWidth: "60ch",
                textWrap: "pretty",
              }}
            >
              {d.tag}
            </p>
          )}

          <div style={{ padding: "28px 0", borderBottom: "1px solid #1A222C" }}>
            <h2 style={{ margin: "0 0 14px", font: "700 17px 'Archivo',sans-serif", letterSpacing: "-.015em" }}>
              Field notes
            </h2>
            <p
              style={{
                margin: 0,
                font: "400 15px/1.72 'IBM Plex Sans',sans-serif",
                color: "#BAC6D2",
                maxWidth: "72ch",
                textWrap: "pretty",
              }}
            >
              {d.notes}
            </p>
          </div>

          {incidents.length > 0 && (
            <div style={{ padding: "28px 0", borderBottom: "1px solid #1A222C" }}>
              <div
                style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 22 }}
              >
                <h2 style={{ margin: 0, font: "700 17px 'Archivo',sans-serif", letterSpacing: "-.015em" }}>
                  Incident history
                </h2>
                <span style={{ font: "400 12.5px 'IBM Plex Sans',sans-serif", color: "#788BA0" }}>
                  {incidents.length} on record
                </span>
              </div>
              <Timeline events={incidents} />
            </div>
          )}

          <RelatedRecords groups={related} />

          <div style={{ paddingTop: 28 }}>
            <ClassifiedBlock>{d.classified}</ClassifiedBlock>
          </div>
        </div>
      </div>
    </>
  );
}
