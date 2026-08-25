import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { Page } from "../components/Chrome";
import { CardSkeleton, IndexingBanner, NotFoundBlock } from "../components/States";
import { LockIcon, NoResultsIcon } from "../components/icons";
import { useDocumentTitle } from "../lib/useDocumentTitle";

const REDACTED = ["100%", "88%", "94%", "72%", "81%", "60%"];

function SectionHead({ n, title, note }: { n: string; title: string; note: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 14,
        marginBottom: 20,
        paddingTop: 28,
        borderTop: "1px solid #1A222C",
        flexWrap: "wrap",
      }}
    >
      <span style={{ font: "500 12px 'IBM Plex Mono',monospace", color: "#748899" }}>{n}</span>
      <h2 style={{ margin: 0, font: "700 18px 'Archivo',sans-serif", letterSpacing: "-.015em" }}>{title}</h2>
      <span style={{ font: "400 13px 'IBM Plex Sans',sans-serif", color: "#788BA0" }}>{note}</span>
    </div>
  );
}

export default function States() {
  useDocumentTitle(
    "System states — InGen Archive",
    "Interface states reference: loading, no results, record not found and clearance denied."
  );

  return (
    <Page>
      <Header descriptor="Interface states reference" />

      <div style={{ padding: "clamp(36px,5vw,52px) clamp(20px,3vw,40px) clamp(26px,3vw,34px)" }}>
        <div
          style={{
            font: "500 11px 'IBM Plex Sans',sans-serif",
            letterSpacing: ".14em",
            color: "#748899",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          Section 03 &nbsp;·&nbsp; Interface states
        </div>
        <h1
          style={{
            margin: 0,
            font: "800 clamp(30px,3.6vw,42px) 'Archivo',sans-serif",
            letterSpacing: "-.032em",
            lineHeight: 1.03,
          }}
        >
          System states
        </h1>
        <p
          style={{
            margin: "12px 0 0",
            font: "400 14.5px/1.6 'IBM Plex Sans',sans-serif",
            color: "#7E8C9C",
            maxWidth: "62ch",
            textWrap: "pretty",
          }}
        >
          Every non-ideal condition the archive can present: data in flight, nothing found, a record that no longer
          resolves, and material above the reader&rsquo;s clearance.
        </p>
      </div>

      <main id="main">
        <section style={{ padding: "8px clamp(20px,3vw,40px) 40px" }}>
          <SectionHead n="01" title="Loading" note="Card skeletons hold layout while the index resolves" />
          <IndexingBanner detail="Resolving genetic asset index · verifying clearance" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(248px,1fr))", gap: 16 }}>
            {[1, 2, 3, 4].map((i) => (
              <CardSkeleton key={i} index={i} />
            ))}
          </div>
        </section>

        <section style={{ padding: "8px clamp(20px,3vw,40px) 40px" }}>
          <SectionHead n="02" title="No results" note="A query or filter combination that matches nothing" />
          <div style={{ padding: "clamp(56px,8vw,80px) 40px", border: "1px solid #1A222C", textAlign: "center" }}>
            <NoResultsIcon />
            <div style={{ font: "700 22px 'Archivo',sans-serif", letterSpacing: "-.02em", marginBottom: 10 }}>
              No asset matches &ldquo;raptor-omega&rdquo;
            </div>
            <p
              style={{
                margin: "0 auto 24px",
                maxWidth: "44ch",
                font: "400 13.5px/1.65 'IBM Plex Sans',sans-serif",
                color: "#7E8C9C",
                textWrap: "pretty",
              }}
            >
              No records match your current archive query. Broaden the term or clear the active filters.
            </p>
            <Link
              to="/assets"
              className="ig-btn-primary"
              style={{
                display: "inline-block",
                padding: "10px 18px",
                background: "#0E131A",
                border: "1px solid #2E5C7A",
                color: "#9FCDEA",
                font: "600 12.5px 'IBM Plex Sans',sans-serif",
                textDecoration: "none",
              }}
            >
              Clear filters and search
            </Link>
          </div>
        </section>

        <section style={{ padding: "8px clamp(20px,3vw,40px) 40px" }}>
          <SectionHead
            n="03"
            title="Record not found"
            note="A deep link pointing at an identifier that no longer resolves"
          />
          <NotFoundBlock
            watermark
            padding="clamp(36px,4vw,52px) 44px"
            eyebrow="Archive record not found"
            headline="No record at ING-DIN-042"
            body="The record ID could not be resolved. It may have been reclassified above your clearance, purged from the master index, or the identifier is malformed."
            actionLabel="Return to archive"
            actionTo="/dashboard"
          />
        </section>

        <section style={{ padding: "8px clamp(20px,3vw,40px) clamp(44px,6vw,64px)" }}>
          <SectionHead
            n="04"
            title="Clearance insufficient"
            note="Classified material withheld from a reader below Level 5"
          />
          <div style={{ border: "1px solid #3A2228", background: "#12141A" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "12px 20px",
                borderBottom: "1px solid #3A2228",
              }}
            >
              <LockIcon />
              <span
                style={{
                  font: "600 11px 'IBM Plex Sans',sans-serif",
                  letterSpacing: ".11em",
                  color: "#C8524B",
                  textTransform: "uppercase",
                }}
              >
                Access denied · Level 5 clearance required
              </span>
            </div>
            <div
              style={{ padding: "30px 24px 32px", display: "flex", alignItems: "center", gap: 36, flexWrap: "wrap" }}
            >
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ font: "700 24px 'Archivo',sans-serif", letterSpacing: "-.02em", marginBottom: 10 }}>
                  Content redacted for current clearance
                </div>
                <p
                  style={{
                    margin: "0 0 20px",
                    maxWidth: "64ch",
                    font: "400 14px/1.65 'IBM Plex Sans',sans-serif",
                    color: "#A8969B",
                    textWrap: "pretty",
                  }}
                >
                  This record contains classified operational intelligence restricted to Level 5 personnel. Request
                  elevated clearance through your section supervisor, or return to the standard index.
                </p>
                <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="ig-btn-danger"
                    style={{
                      padding: "10px 18px",
                      background: "#241619",
                      border: "1px solid #5E2F30",
                      color: "#E08A84",
                      font: "600 12.5px 'IBM Plex Sans',sans-serif",
                      cursor: "pointer",
                    }}
                  >
                    Request elevation
                  </button>
                  <Link
                    to="/dashboard"
                    className="ig-btn-ghost"
                    style={{
                      padding: "10px 18px",
                      background: "#0B0F14",
                      border: "1px solid #232D38",
                      color: "#8895A5",
                      font: "600 12.5px 'IBM Plex Sans',sans-serif",
                      textDecoration: "none",
                    }}
                  >
                    Return to archive
                  </Link>
                </div>
              </div>
              <div
                style={{ flex: "none", display: "flex", flexDirection: "column", gap: 8, width: 260 }}
                aria-hidden="true"
              >
                {REDACTED.map((w, i) => (
                  <div key={i} style={{ height: 11, width: w, background: "#241A1E" }} />
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </Page>
  );
}
