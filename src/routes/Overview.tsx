import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { Page, Watermark } from "../components/Chrome";
import { useArchive } from "../lib/useArchive";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import { clearanceRowInk, threatRowInk } from "../lib/derive";
import { stagger, step, useCountUp, useReveal } from "../lib/motion";
import { RecordImage } from "../components/RecordImage";

const SCREENS = [
  {
    tag: "Home",
    name: "Overview",
    desc: "Archive landing with live counts, flagged assets and top clearance holders.",
    href: "/dashboard",
  },
  {
    tag: "Index",
    name: "Genetic assets",
    desc: "Searchable, filterable index of every indexed specimen.",
    href: "/assets",
  },
  {
    tag: "Index",
    name: "Personnel",
    desc: "Searchable, filterable index of every employment record.",
    href: "/personnel",
  },
  {
    tag: "Record",
    name: "Asset dossier",
    desc: "Full specimen record with threat profile and incident timeline.",
    href: "/assets/indominus-rex",
  },
  {
    tag: "Record",
    name: "Personnel file",
    desc: "Full employee record with clearance, profile and assignments.",
    href: "/personnel/owen-grady",
  },
  {
    tag: "System",
    name: "System states",
    desc: "Loading, no results, record not found and clearance denied.",
    href: "/states",
  },
  {
    tag: "Run",
    name: "All asset dossiers",
    desc: "Every specimen rendered as a full dossier, back to back.",
    href: "/assets/all",
  },
  {
    tag: "Run",
    name: "All personnel files",
    desc: "Every personnel record rendered as a full dossier.",
    href: "/personnel/all",
  },
];

const sectionHead: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "baseline",
  gap: 13,
  marginBottom: 18,
  paddingTop: 30,
  borderTop: "1px solid #1A222C",
};
const h2: React.CSSProperties = { margin: 0, font: "700 17px 'Archivo',sans-serif", letterSpacing: "-.015em" };
const note: React.CSSProperties = { font: "400 13px 'IBM Plex Sans',sans-serif", color: "#788BA0" };
const listGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
  gap: "1px 24px",
};

/** Hero figures roll up once, when the lockup first reveals. */
function HeroStat({ value, label }: { value: number; label: string }) {
  const [shown, ref] = useCountUp(value);
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
      <span
        ref={ref}
        style={{ font: "500 19px 'IBM Plex Mono',monospace", color: "#BAC6D2", fontVariantNumeric: "tabular-nums" }}
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

export default function Overview() {
  useDocumentTitle(
    "InGen Archive — master directory",
    "Master directory of every genetic asset and personnel file held under InGen custodianship."
  );
  const { specimens, personnel, stats } = useArchive();
  const tilesReveal = useReveal();
  const dinoReveal = useReveal();
  const peopleReveal = useReveal();

  const heroStats = [
    { value: stats.dTotal + stats.pTotal, label: "Records" },
    { value: stats.dTotal, label: "Assets" },
    { value: stats.pTotal, label: "Files" },
    { value: SCREENS.length, label: "Screens" },
  ];

  const dinos = [...specimens].sort((a, b) => a.name.localeCompare(b.name));
  const people = [...personnel].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Page minHeight>
      <Header descriptor="Master directory" />

      <div
        style={{
          position: "relative",
          isolation: "isolate",
          overflow: "hidden",
          padding: "clamp(48px,7vw,72px) clamp(20px,3vw,40px) clamp(34px,4vw,44px)",
        }}
      >
        <Watermark height="172%" opacity={0.05} right="-3%" />
        <div
          data-enter
          style={{
            ...step(0),
            font: "500 11px 'IBM Plex Sans',sans-serif",
            letterSpacing: ".16em",
            color: "#748899",
            textTransform: "uppercase",
            marginBottom: 20,
          }}
        >
          International Genetic Technologies &nbsp;·&nbsp; Complete directory
        </div>
        <h1
          data-enter
          style={{
            ...step(1),
            margin: 0,
            font: "800 clamp(36px,5vw,54px) 'Archivo',sans-serif",
            letterSpacing: "-.036em",
            lineHeight: 1.02,
            maxWidth: "20ch",
            textWrap: "balance",
          }}
        >
          Every screen and every record in the archive.
        </h1>
        <p
          data-enter
          style={{
            ...step(2),
            margin: "18px 0 0",
            font: "400 15px/1.6 'IBM Plex Sans',sans-serif",
            color: "#7E8C9C",
            maxWidth: "60ch",
            textWrap: "pretty",
          }}
        >
          Each genetic asset and personnel file has its own complete dossier. Open a full run to read them end to end,
          or jump straight to a single record.
        </p>
        <div
          data-enter
          style={{
            ...step(3),
            display: "flex",
            flexWrap: "wrap",
            alignItems: "baseline",
            gap: "clamp(22px,3.5vw,44px)",
            marginTop: 28,
          }}
        >
          {heroStats.map((h) => (
            <HeroStat key={h.label} value={h.value} label={h.label} />
          ))}
        </div>
      </div>

      <main id="main">
        <section style={{ padding: "0 clamp(20px,3vw,40px) clamp(34px,4vw,44px)" }}>
          <div style={{ ...sectionHead, flexWrap: "nowrap" }}>
            <h2 style={h2}>Screens</h2>
            <span style={note}>Eight views across the archive</span>
          </div>
          <div
            ref={tilesReveal}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
              gap: 1,
              background: "#1A222C",
              border: "1px solid #1A222C",
            }}
          >
            {SCREENS.map((s, i) => (
              <Link
                key={s.name}
                to={s.href}
                className="ig-screen-tile"
                data-reveal
                style={{
                  ...stagger(i),
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  padding: 22,
                  background: "#0B0F14",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span
                    style={{
                      font: "500 10.5px 'IBM Plex Sans',sans-serif",
                      letterSpacing: ".11em",
                      color: "#748899",
                      textTransform: "uppercase",
                    }}
                  >
                    {s.tag}
                  </span>
                  <span className="ig-arrow" style={{ font: "500 13px 'IBM Plex Sans',sans-serif", color: "#8FA6BC" }}>
                    →
                  </span>
                </div>
                <div style={{ font: "700 18px 'Archivo',sans-serif", letterSpacing: "-.02em" }}>{s.name}</div>
                <div style={{ font: "400 13px/1.55 'IBM Plex Sans',sans-serif", color: "#7E8C9C", textWrap: "pretty" }}>
                  {s.desc}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section style={{ padding: "0 clamp(20px,3vw,40px) clamp(34px,4vw,44px)" }}>
          <div style={sectionHead}>
            <h2 style={h2}>Genetic assets</h2>
            <span style={note}>{stats.dTotal} indexed specimens</span>
            <span style={{ flex: 1 }} />
            <Link to="/assets/all" style={{ font: "500 12.5px 'IBM Plex Sans',sans-serif", textDecoration: "none" }}>
              Open full run →
            </Link>
          </div>
          <div ref={dinoReveal} style={listGrid}>
            {dinos.map((d, i) => (
              <Link
                key={d.id}
                to={`/assets/${d.id}`}
                className="ig-index-row"
                data-reveal
                style={{
                  ...stagger(i),
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 0",
                  borderBottom: "1px solid #161D26",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <span
                  className="ig-row-marker"
                  style={{ width: 2, height: 24, background: threatRowInk(Number(d.threat) || 0), flex: "none" }}
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
                  {d.name}
                </span>
                <span
                  style={{
                    font: "400 10.5px 'IBM Plex Mono',monospace",
                    letterSpacing: ".04em",
                    color: "#6F859D",
                    flex: "none",
                  }}
                >
                  {d.fileId}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section style={{ padding: "0 clamp(20px,3vw,40px) clamp(48px,6vw,64px)" }}>
          <div style={sectionHead}>
            <h2 style={h2}>Personnel</h2>
            <span style={note}>{stats.pTotal} files on record</span>
            <span style={{ flex: 1 }} />
            <Link to="/personnel/all" style={{ font: "500 12.5px 'IBM Plex Sans',sans-serif", textDecoration: "none" }}>
              Open full run →
            </Link>
          </div>
          <div ref={peopleReveal} style={listGrid}>
            {people.map((p, i) => (
              <Link
                key={p.id}
                to={`/personnel/${p.id}`}
                className="ig-index-row"
                data-reveal
                style={{
                  ...stagger(i),
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "9px 0",
                  borderBottom: "1px solid #161D26",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div style={{ width: 24, height: 30, overflow: "hidden", flex: "none", background: "#0E131A" }}>
                  <RecordImage
                    src={p.img}
                    width={24}
                    height={30}
                    alt={p.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center 18%",
                      display: "block",
                    }}
                  />
                </div>
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
                  {p.name}
                </span>
                <span
                  style={{
                    font: "500 10.5px 'IBM Plex Mono',monospace",
                    color: clearanceRowInk(Number(p.clearance) || 0),
                    flex: "none",
                  }}
                >
                  L{p.clearance}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </Page>
  );
}
