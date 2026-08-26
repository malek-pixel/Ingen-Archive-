import type { Person, WithImage } from "../data/types";
import { ClassifiedBlock, Meter, StatRows, Timeline, Watermark } from "./Chrome";
import { byYear, cells, clearance, humanizeStat, parseSlug, personStatus, personThreatLabel } from "../lib/derive";
import { stagger, step, useReveal } from "../lib/motion";
import { RecordImage } from "./RecordImage";
import { TechnicalPlate } from "./TechnicalPlate";
import { RelatedRecords } from "./RecordChrome";
import { getRelatedRecords } from "../lib/archive";

/** The personnel file body — shared by the detail route and the full-run gallery. */
export function PersonDossier({ p }: { p: WithImage<Person> }) {
  const clearReveal = useReveal();
  const related = getRelatedRecords("person", p.id);
  const factsReveal = useReveal();
  const c = Number(p.clearance) || 0;
  const cl = clearance(c);
  const status = personStatus(p.status);
  const statRows = Object.entries(p.stats ?? {}).map(([k, v]) => ({
    label: humanizeStat(k),
    val: v,
    cells: cells(v, "#5A6E82"),
  }));
  const facts = [
    { label: "Department", value: p.dept || "—" },
    { label: "Affiliation", value: p.aff || "—" },
    { label: "Nationality", value: p.nat || "—" },
  ];
  const history = (p.history ?? []).map(parseSlug).sort(byYear);

  return (
    <>
      <div
        className="ig-person-identity"
        style={{
          position: "relative",
          isolation: "isolate",
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "minmax(0,168px) minmax(0,1fr)",
          gap: "clamp(22px,3vw,34px)",
          alignItems: "end",
          padding: "clamp(28px,3.5vw,40px) clamp(20px,3vw,40px) clamp(24px,3vw,32px)",
        }}
      >
        <Watermark height="150%" opacity={0.038} />
        <div
          data-enter="plate"
          style={{
            position: "relative",
            aspectRatio: "3/4",
            overflow: "hidden",
            background: "#0E131A",
            border: "1px solid #1A222C",
          }}
        >
          {p.img ? (
            <RecordImage
              src={p.img}
              alt={p.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center 16%",
                display: "block",
                filter: "saturate(.85) contrast(1.03)",
              }}
            />
          ) : (
            // No portrait on file — the drawn plate rather than an error state.
            <TechnicalPlate kind="person" fileId={p.fileId} grid={28} />
          )}
        </div>
        <div>
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
              marginBottom: 14,
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
              {p.fileId}
            </span>
            <span style={{ width: 1, height: 11, background: "#28323D" }} />
            <span>{p.nat}</span>
          </div>
          <h1
            data-enter
            style={{
              ...step(1),
              margin: 0,
              font: "800 clamp(36px,5vw,58px) 'Archivo',sans-serif",
              letterSpacing: "-.036em",
              lineHeight: 1,
            }}
          >
            {p.name}
          </h1>
          <div
            data-enter
            style={{ ...step(2), font: "500 16px 'IBM Plex Sans',sans-serif", color: "#9FB2C4", marginTop: 11 }}
          >
            {p.role}
          </div>
          <div data-enter style={{ ...step(3), display: "flex", gap: 9, marginTop: 20, flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 11px 4px 8px",
                border: "1px solid #232D38",
              }}
            >
              <img
                src="/assets/ingen-mark.png"
                alt=""
                aria-hidden="true"
                width={17}
                height={18}
                style={{ display: "block" }}
              />
              <span style={{ font: "600 10px 'IBM Plex Mono',monospace", letterSpacing: ".13em", color: "#7E8C9C" }}>
                PERSONNEL FILE
              </span>
            </span>
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
                padding: "5px 11px",
                border: `1px solid ${cl.border}`,
                background: cl.fill,
                font: "500 12px 'IBM Plex Sans',sans-serif",
                color: cl.ink,
              }}
            >
              Level {p.clearance} access
            </span>
            <span
              style={{
                padding: "5px 11px",
                border: "1px solid #232D38",
                font: "500 12px 'IBM Plex Sans',sans-serif",
                color: "#8895A5",
              }}
            >
              Risk · {personThreatLabel(p.threat)}
            </span>
          </div>
        </div>
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
          <div ref={clearReveal}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
              <span
                style={{
                  font: "500 11px 'IBM Plex Sans',sans-serif",
                  letterSpacing: ".13em",
                  color: "#748899",
                  textTransform: "uppercase",
                }}
              >
                Security clearance
              </span>
              <span
                style={{ font: "700 21px 'Archivo',sans-serif", color: cl.ink, fontVariantNumeric: "tabular-nums" }}
              >
                L{p.clearance}
                <span style={{ font: "500 12px 'IBM Plex Mono',monospace", color: "#6F859D" }}> / 5</span>
              </span>
            </div>
            <Meter cells={cells(c, cl.ink)} height={5} gap={4} animate />
            <p
              style={{
                margin: "11px 0 0",
                font: "400 12.5px/1.5 'IBM Plex Sans',sans-serif",
                color: "#7E8C9C",
                textWrap: "pretty",
              }}
            >
              {cl.label}
            </p>
          </div>

          <div
            ref={factsReveal}
            style={{ display: "flex", flexDirection: "column", gap: 0, borderTop: "1px solid #1A222C" }}
          >
            {facts.map((f, i) => (
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
                <span style={{ font: "400 12.5px 'IBM Plex Sans',sans-serif", color: "#748899" }}>{f.label}</span>
                <span
                  style={{
                    font: "500 13px 'IBM Plex Sans',sans-serif",
                    color: "#BAC6D2",
                    textAlign: "right",
                    maxWidth: "60%",
                  }}
                >
                  {f.value}
                </span>
              </div>
            ))}
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
              Competency profile
            </div>
            <StatRows rows={statRows} meterWidth={82} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {p.tag?.trim() && (
            <p
              style={{
                margin: 0,
                paddingBottom: 28,
                borderBottom: "1px solid #1A222C",
                font: "400 21px/1.5 'IBM Plex Sans',sans-serif",
                color: "#9FB2C4",
                maxWidth: "60ch",
                textWrap: "pretty",
              }}
            >
              {p.tag}
            </p>
          )}

          <div style={{ padding: "28px 0", borderBottom: "1px solid #1A222C" }}>
            <h2 style={{ margin: "0 0 14px", font: "700 17px 'Archivo',sans-serif", letterSpacing: "-.015em" }}>
              Psychological profile
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
              {p.psych}
            </p>
          </div>

          {p.quote?.trim() && (
            <blockquote style={{ margin: 0, padding: "28px 0", borderBottom: "1px solid #1A222C" }}>
              <div
                style={{
                  font: "500 11px 'IBM Plex Sans',sans-serif",
                  letterSpacing: ".13em",
                  color: "#748899",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                On-record statement
              </div>
              <p
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  borderLeft: "2px solid #2E4457",
                  font: "400 16px/1.6 'IBM Plex Sans',sans-serif",
                  color: "#BAC6D2",
                  maxWidth: "68ch",
                  textWrap: "pretty",
                }}
              >
                {p.quote}
              </p>
            </blockquote>
          )}

          {history.length > 0 && (
            <div style={{ padding: "28px 0", borderBottom: "1px solid #1A222C" }}>
              <div
                style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 22 }}
              >
                <h2 style={{ margin: 0, font: "700 17px 'Archivo',sans-serif", letterSpacing: "-.015em" }}>
                  Assignment history
                </h2>
                <span style={{ font: "400 12.5px 'IBM Plex Sans',sans-serif", color: "#788BA0" }}>
                  {history.length} on record
                </span>
              </div>
              <Timeline events={history} />
            </div>
          )}

          <RelatedRecords groups={related} />

          <div style={{ paddingTop: 28 }}>
            <ClassifiedBlock>{p.classified}</ClassifiedBlock>
          </div>
        </div>
      </div>
    </>
  );
}
