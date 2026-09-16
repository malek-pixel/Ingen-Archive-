import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { Eyebrow, Footer, Page, PlateFrame, Watermark } from "../components/Chrome";
import { useArchive } from "../lib/useArchive";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import { containmentTidy, plateBlend } from "../lib/derive";
import { stagger, step, useCountUp, useReveal } from "../lib/motion";
import { DIVISIONS } from "../data/divisions";
import { SecurityBadge, StatusInk } from "../components/RecordChrome";
import { RecordImage } from "../components/RecordImage";
import { PlateMark } from "../components/TechnicalPlate";

/** Hero figures roll up once, when the lockup first reveals. */
function HeroStat({ value, label }: { value: number; label: string }) {
  const [shown, ref] = useCountUp(value);
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
      <span
        ref={ref}
        style={{ font: "500 20px 'IBM Plex Mono',monospace", color: "#BAC6D2", fontVariantNumeric: "tabular-nums" }}
      >
        {shown}
      </span>
      <span
        style={{
          font: "400 12.5px 'IBM Plex Sans',sans-serif",
          letterSpacing: ".1em",
          color: "#748899",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </div>
  );
}

/** Headline metric. Counts up when the metric rule scrolls into view. */
function Metric({
  value,
  label,
  ink,
  note,
  index,
}: {
  value: number;
  label: string;
  ink: string;
  note: string;
  index: number;
}) {
  const [shown, ref] = useCountUp(value);
  return (
    <div data-reveal style={stagger(index)}>
      <div
        ref={ref}
        style={{
          font: "800 clamp(28px,3.2vw,38px) 'Archivo',sans-serif",
          letterSpacing: "-.03em",
          color: ink,
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
        }}
      >
        {shown}
      </div>
      <div
        style={{
          font: "500 11px 'IBM Plex Sans',sans-serif",
          letterSpacing: ".13em",
          color: "#7E8C9C",
          textTransform: "uppercase",
          marginTop: 12,
        }}
      >
        {label}
      </div>
      <div style={{ font: "400 12.5px 'IBM Plex Sans',sans-serif", color: "#748899", marginTop: 5 }}>{note}</div>
    </div>
  );
}

export default function Dashboard() {
  useDocumentTitle(
    "Overview — InGen Archive",
    "Archive overview: record counts, containment status and flagged assets."
  );
  const { specimens, personnel, locations, counts, entries, stats: s } = useArchive();
  const metricsReveal = useReveal();
  const severityReveal = useReveal();
  const clearanceReveal = useReveal();
  const divisionsReveal = useReveal();
  const criticalReveal = useReveal();

  // Every figure on this page derives from the loaded data. Adding a record to
  // any division updates the dashboard with no edit here.
  const heroStats = [
    { value: counts.total, label: "Indexed records" },
    { value: counts.specimen, label: "Genetic assets" },
    { value: counts.person, label: "Personnel files" },
    { value: DIVISIONS.length, label: "Divisions" },
  ];

  const flagged = specimens.filter((d) => Number(d.threat) >= 4);

  // Numbers dominate; the note stays quiet. Colour only where it means something.
  const metrics = [
    { label: "Total records", value: counts.total, ink: "#E4E9EF", note: `Across ${DIVISIONS.length} divisions` },
    { label: "Containment failed", value: s.dFailed, ink: "#D2564D", note: "Breach recorded" },
    { label: "Threat level 4+", value: flagged.length, ink: "#C98A2E", note: "Flagged for review" },
    { label: "Level 5 clearance", value: s.pL5, ink: "#E4E9EF", note: "Full archive access" },
  ];

  const byThreat = (n: number) =>
    flagged
      .filter((d) => Number(d.threat) === n)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((d) => ({
        id: d.id,
        name: d.name,
        threat: d.threat,
        contain: containmentTidy(d.contain),
        ink: n >= 5 ? "#D2564D" : "#C98A2E",
        pad: n >= 5 ? "14px 0" : "11px 0",
        nameFont: n >= 5 ? "600 14.5px" : "500 13.5px",
      }));

  const severityGroups = [
    { title: "Priority review", note: "Threat level 5", ink: "#D2564D", rows: byThreat(5) },
    { title: "Elevated", note: "Threat level 4", ink: "#C98A2E", rows: byThreat(4) },
  ].filter((g) => g.rows.length > 0);

  const topClearance = personnel.filter((p) => Number(p.clearance) >= 5).sort((a, b) => a.name.localeCompare(b.name));

  // Featured plate: the highest-threat asset that actually has an image.
  const plate =
    [...specimens].sort((a, b) => Number(b.threat || 0) - Number(a.threat || 0)).find((d) => d.img) ?? specimens[0];

  const DIVISION_STATS: Record<string, { label: string; value: number; ink: string }[]> = {
    specimen: [
      { label: "Active", value: s.dActive, ink: "#7ACB9A" },
      { label: "Deceased", value: s.dDeceased, ink: "#E08A84" },
      { label: "Threat 4+", value: flagged.length, ink: "#E0B36A" },
    ],
    person: [
      { label: "Active", value: s.pAlive, ink: "#7ACB9A" },
      { label: "Closed", value: s.pDeceased, ink: "#E08A84" },
      { label: "Level 5", value: s.pL5, ink: "#9FB2C4" },
    ],
    location: [
      { label: "Operational", value: locations.filter((l) => /ACTIVE/i.test(l.status)).length, ink: "#7ACB9A" },
      { label: "Lost", value: locations.filter((l) => /DESTROYED|ABANDONED/i.test(l.status)).length, ink: "#E08A84" },
    ],
  };

  const sections = DIVISIONS.map((d) => ({
    key: d.kind,
    title: d.label,
    count: counts[d.kind],
    href: `/${d.path}`,
    desc: d.blurb,
    stats: DIVISION_STATS[d.kind] ?? [],
  }));

  // Highest-classification records from every division, so the command view
  // surfaces what matters rather than only what is numerous.
  const criticalRecords = entries
    .filter((e) => e.security === "CRITICAL" || e.security === "CLASSIFIED")
    .sort((a, b) => (a.security === b.security ? a.name.localeCompare(b.name) : a.security === "CRITICAL" ? -1 : 1))
    .slice(0, 8);

  return (
    <Page>
      <Header />
      <main id="main">
        <section
          style={{
            position: "relative",
            isolation: "isolate",
            overflow: "hidden",
            padding: "clamp(48px,7vw,84px) clamp(20px,3vw,40px) clamp(38px,5vw,56px)",
          }}
        >
          <Watermark height="168%" opacity={0.045} right="-3%" />
          <div
            data-enter
            style={{
              ...step(0),
              font: "500 11px 'IBM Plex Sans',sans-serif",
              letterSpacing: ".16em",
              color: "#748899",
              textTransform: "uppercase",
              marginBottom: "clamp(18px,2.5vw,26px)",
            }}
          >
            International Genetic Technologies &nbsp;·&nbsp; Internal Records
          </div>
          <h1
            data-enter
            style={{
              ...step(1),
              margin: 0,
              font: "800 clamp(38px,5.4vw,64px) 'Archivo',sans-serif",
              letterSpacing: "-.038em",
              lineHeight: 1.01,
              maxWidth: "17ch",
              textWrap: "balance",
            }}
          >
            Master index of the InGen record system.
          </h1>
          <p
            data-enter
            style={{
              ...step(2),
              margin: "clamp(20px,2.6vw,26px) 0 0",
              font: "400 15px/1.65 'IBM Plex Sans',sans-serif",
              color: "#7E8C9C",
              maxWidth: "58ch",
              textWrap: "pretty",
            }}
          >
            Every genetic asset and personnel file held under InGen custodianship, with containment status and clearance
            level.
          </p>
          <div
            data-enter
            style={{
              ...step(3),
              display: "flex",
              flexWrap: "wrap",
              alignItems: "baseline",
              gap: "clamp(24px,4vw,52px)",
              marginTop: "clamp(30px,4vw,44px)",
            }}
          >
            {heroStats.map((h) => (
              <HeroStat key={h.label} value={h.value} label={h.label} />
            ))}
          </div>
        </section>

        <section style={{ padding: "0 clamp(20px,3vw,40px)" }}>
          <div
            ref={metricsReveal}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
              gap: "clamp(20px,3vw,40px)",
              padding: "26px 0",
              borderTop: "1px solid #1A222C",
              borderBottom: "1px solid #1A222C",
            }}
          >
            {metrics.map((m, i) => (
              <Metric key={m.label} {...m} index={i} />
            ))}
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))",
            gap: "clamp(28px,4vw,56px)",
            padding: "clamp(38px,5vw,58px) clamp(20px,3vw,40px)",
          }}
        >
          <div>
            <div style={{ marginBottom: 16 }}>
              <Eyebrow>Specimen plate</Eyebrow>
            </div>
            {plate?.img && (
              <Link
                to={`/assets/${plate.id}`}
                className="ig-plate-link"
                data-enter="plate"
                style={{
                  ...step(2),
                  display: "block",
                  textDecoration: "none",
                  color: "inherit",
                  border: "1px solid #1A222C",
                }}
              >
                <div style={{ position: "relative", aspectRatio: "16/10", overflow: "hidden", background: "#E3E8ED" }}>
                  <PlateFrame grid={40} inset={100}>
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "clamp(28px,4vw,52px)",
                      }}
                    >
                      <RecordImage
                        src={plate.img}
                        alt={`${plate.name} reference plate`}
                        loading="eager"
                        plate
                        style={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          width: "auto",
                          height: "auto",
                          objectFit: "contain",
                          mixBlendMode: plateBlend(plate.id),
                          display: "block",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        left: 18,
                        bottom: 14,
                        display: "flex",
                        alignItems: "baseline",
                        gap: 11,
                      }}
                    >
                      <span
                        style={{ font: "500 11px 'IBM Plex Mono',monospace", letterSpacing: ".06em", color: "#5A7085" }}
                      >
                        {plate.fileId}
                      </span>
                      <span style={{ font: "italic 400 12px 'IBM Plex Sans',sans-serif", color: "#7E93A6" }}>
                        {plate.species}
                      </span>
                    </div>
                  </PlateFrame>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    gap: 24,
                    padding: "22px 24px",
                    borderTop: "1px solid #1A222C",
                  }}
                >
                  <div>
                    <div style={{ font: "700 clamp(22px,2.4vw,28px) 'Archivo',sans-serif", letterSpacing: "-.025em" }}>
                      {plate.name}
                    </div>
                    <div style={{ font: "400 13.5px 'IBM Plex Sans',sans-serif", color: "#7E8C9C", marginTop: 6 }}>
                      {plate.classification}
                    </div>
                  </div>
                  <span style={{ flex: "none", font: "500 12.5px 'IBM Plex Sans',sans-serif", color: "#8FA6BC" }}>
                    Open record
                  </span>
                </div>
              </Link>
            )}
          </div>

          <div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 16,
                marginBottom: 16,
              }}
            >
              <Eyebrow>Security intelligence</Eyebrow>
              <span style={{ font: "400 12px 'IBM Plex Sans',sans-serif", color: "#748899" }}>
                {flagged.length} assets flagged
              </span>
            </div>

            {severityGroups.map((g) => (
              <div key={g.title} ref={severityReveal} style={{ marginBottom: 26 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    paddingBottom: 9,
                    borderBottom: "1px solid #1A222C",
                  }}
                >
                  <span style={{ width: 6, height: 6, background: g.ink, flex: "none" }} />
                  <span style={{ font: "600 12px 'IBM Plex Sans',sans-serif", letterSpacing: ".06em", color: g.ink }}>
                    {g.title}
                  </span>
                  <span style={{ font: "400 12px 'IBM Plex Sans',sans-serif", color: "#748899" }}>{g.note}</span>
                  <span style={{ flex: 1 }} />
                  <span
                    style={{
                      font: "500 12px 'IBM Plex Mono',monospace",
                      color: "#748899",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {g.rows.length}
                  </span>
                </div>
                {g.rows.map((r, i) => (
                  <Link
                    key={r.id}
                    to={`/assets/${r.id}`}
                    className="ig-sev-row"
                    data-reveal
                    style={{
                      ...stagger(i),
                      display: "flex",
                      alignItems: "center",
                      gap: 13,
                      padding: r.pad,
                      borderBottom: "1px solid #141B23",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <span style={{ width: 2, alignSelf: "stretch", background: r.ink, flex: "none" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          font: `${r.nameFont} 'IBM Plex Sans',sans-serif`,
                          color: "#E4E9EF",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {r.name}
                      </div>
                      <div style={{ font: "400 12px 'IBM Plex Sans',sans-serif", color: "#788BA0", marginTop: 3 }}>
                        {r.contain}
                      </div>
                    </div>
                    <span style={{ font: "500 12px 'IBM Plex Mono',monospace", color: r.ink, flex: "none" }}>
                      T{r.threat}
                    </span>
                  </Link>
                ))}
              </div>
            ))}

            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 16,
                margin: "32px 0 16px",
              }}
            >
              <Eyebrow>Level 5 clearance</Eyebrow>
              <Link to="/personnel" style={{ font: "500 12.5px 'IBM Plex Sans',sans-serif", textDecoration: "none" }}>
                All personnel
              </Link>
            </div>
            <div ref={clearanceReveal} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {topClearance.map((r, i) => (
                <Link
                  key={r.id}
                  to={`/personnel/${r.id}`}
                  title={r.role}
                  className="ig-outline"
                  data-reveal
                  style={{
                    ...stagger(i),
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "7px 12px 7px 7px",
                    border: "1px solid #1A222C",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div style={{ width: 24, height: 30, overflow: "hidden", flex: "none", background: "#0E131A" }}>
                    {r.img ? (
                      <RecordImage
                        src={r.img}
                        width={24}
                        height={30}
                        alt={r.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          objectPosition: "center 18%",
                          display: "block",
                        }}
                      />
                    ) : (
                      <PlateMark kind="person" />
                    )}
                  </div>
                  <span style={{ font: "500 12.5px 'IBM Plex Sans',sans-serif", whiteSpace: "nowrap" }}>{r.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: "0 clamp(20px,3vw,40px) clamp(38px,5vw,58px)" }}>
          <div style={{ marginBottom: 16 }}>
            <Eyebrow>Archive divisions</Eyebrow>
          </div>
          <div
            ref={divisionsReveal}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
              gap: 1,
              background: "#1A222C",
              border: "1px solid #1A222C",
            }}
          >
            {sections.map((sec, i) => (
              <Link
                key={sec.key}
                to={sec.href}
                className="ig-section-tile"
                data-reveal
                style={{
                  ...stagger(i),
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  padding: "clamp(24px,3vw,32px)",
                  background: "#0B0F14",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
                  <span style={{ font: "700 clamp(20px,2.2vw,25px) 'Archivo',sans-serif", letterSpacing: "-.025em" }}>
                    {sec.title}
                  </span>
                  <span
                    style={{
                      font: "500 20px 'IBM Plex Mono',monospace",
                      color: "#748899",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {sec.count}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    font: "400 13.5px/1.6 'IBM Plex Sans',sans-serif",
                    color: "#7E8C9C",
                    maxWidth: "46ch",
                    textWrap: "pretty",
                  }}
                >
                  {sec.desc}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginTop: 2 }}>
                  {sec.stats.map((st) => (
                    <span key={st.label} style={{ font: "400 12.5px 'IBM Plex Sans',sans-serif", color: "#748899" }}>
                      {st.label}{" "}
                      <span style={{ font: "500 12.5px 'IBM Plex Mono',monospace", color: st.ink }}>{st.value}</span>
                    </span>
                  ))}
                </div>
                <span style={{ font: "500 12.5px 'IBM Plex Sans',sans-serif", color: "#8FA6BC", marginTop: 4 }}>
                  Open index
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Highest-classification records from across the archive. A command
            view should lead with what is sensitive, not with what is numerous. */}
        <section style={{ padding: "0 clamp(20px,3vw,40px) clamp(38px,5vw,58px)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <Eyebrow>Critical records</Eyebrow>
            <Link to="/search" style={{ font: "500 12.5px 'IBM Plex Sans',sans-serif", textDecoration: "none" }}>
              Search all divisions
            </Link>
          </div>
          <div
            ref={criticalReveal}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "1px 28px" }}
          >
            {criticalRecords.map((r, i) => (
              <Link
                key={`${r.kind}:${r.id}`}
                to={r.href}
                className="ig-index-row"
                data-reveal
                style={{
                  ...stagger(i),
                  display: "flex",
                  alignItems: "center",
                  gap: 13,
                  padding: "12px 0",
                  borderBottom: "1px solid #161D26",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <span
                  className="ig-row-marker"
                  style={{ width: 2, alignSelf: "stretch", background: "#D2564D", flex: "none" }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      font: "600 13.5px 'IBM Plex Sans',sans-serif",
                      color: "#E4E9EF",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {r.name}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <StatusInk status={r.status} />
                  </div>
                </div>
                <SecurityBadge level={r.security} />
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer total={counts.total} />
    </Page>
  );
}
