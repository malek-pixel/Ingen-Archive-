import { useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Header } from "../components/Header";
import { Page } from "../components/Chrome";
import { EmptyState } from "../components/States";
import { SearchBar, useSearchHotkeys } from "../components/Toolbar";
import { SecurityBadge, StatusInk } from "../components/RecordChrome";
import { DIVISIONS, division } from "../data/divisions";
import type { RecordKind } from "../data/types";
import { getArchiveStats, searchRecords } from "../lib/archive";
import { stagger, useReveal } from "../lib/motion";
import { useDocumentTitle } from "../lib/useDocumentTitle";

/**
 * Global search across every division.
 *
 * The query lives in the URL so a search is a shareable address, and results
 * always name their division — an id on its own tells you nothing about which
 * register it belongs to.
 */
export default function Search() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const inputRef = useRef<HTMLInputElement>(null);
  const reveal = useReveal();
  const counts = getArchiveStats();

  // Both the query and the division filter live in the URL — a search is only
  // a shareable address if the whole search is in it. Holding the divisions in
  // component state instead let the two drift apart in both directions.
  const kinds = useMemo(() => {
    const valid = new Set<string>(DIVISIONS.map((d) => d.kind));
    return params.getAll("in").filter((k): k is RecordKind => valid.has(k));
  }, [params]);

  useDocumentTitle(
    query ? `“${query}” — InGen Archive search` : "Search — InGen Archive",
    "Search every division of the InGen archive: genetic assets, personnel, locations and paleobotany."
  );

  const setQuery = (value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set("q", value);
    else next.delete("q");
    setParams(next, { replace: true });
  };

  const setKinds = (next: RecordKind[]) => {
    const p = new URLSearchParams(params);
    p.delete("in");
    for (const k of next) p.append("in", k);
    setParams(p, { replace: true });
  };

  useSearchHotkeys(inputRef, () => setQuery(""));

  const results = useMemo(() => searchRecords(query, { kinds }), [query, kinds]);

  const perDivision = useMemo(() => {
    const all = searchRecords(query);
    const map = new Map<RecordKind, number>();
    for (const r of all) map.set(r.kind, (map.get(r.kind) ?? 0) + 1);
    return map;
  }, [query]);

  const toggle = (kind: RecordKind) =>
    setKinds(kinds.includes(kind) ? kinds.filter((k) => k !== kind) : [...kinds, kind]);

  return (
    <Page minHeight>
      <Header />

      <div style={{ padding: "clamp(36px,5vw,52px) clamp(20px,3vw,40px) clamp(20px,3vw,26px)" }}>
        <div
          data-enter
          style={{
            font: "500 11px 'IBM Plex Sans',sans-serif",
            letterSpacing: ".14em",
            color: "#788D9F",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          Master index · Cross-division query
        </div>
        <h1
          data-enter
          style={{
            margin: 0,
            font: "800 clamp(30px,3.6vw,42px) 'Archivo',sans-serif",
            letterSpacing: "-.032em",
            lineHeight: 1.03,
          }}
        >
          Search the archive
        </h1>
        <p
          data-enter
          style={{
            margin: "12px 0 0",
            font: "400 14.5px/1.6 'IBM Plex Sans',sans-serif",
            color: "#7E8C9C",
            maxWidth: "62ch",
            textWrap: "pretty",
          }}
        >
          {counts.total} records across {DIVISIONS.length} divisions. Search by name, record identifier, classification
          or any indexed metadata.
        </p>
      </div>

      <div
        className="ig-sticky"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "#0B0F14",
          borderTop: "1px solid #1A222C",
          borderBottom: "1px solid #1A222C",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 14,
            padding: "14px clamp(20px,3vw,40px)",
          }}
        >
          <SearchBar
            value={query}
            onChange={setQuery}
            label="Search the archive"
            placeholder="Search every division…"
            inputRef={inputRef}
          />
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", flex: 1 }}>
            {DIVISIONS.map((d) => {
              const on = kinds.includes(d.kind);
              const hits = perDivision.get(d.kind) ?? 0;
              return (
                <button
                  key={d.kind}
                  type="button"
                  className="ig-chip"
                  onClick={() => toggle(d.kind)}
                  aria-pressed={on}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "7px 12px",
                    background: on ? "#13202B" : "#0E131A",
                    border: `1px solid ${on ? "#2E5C7A" : "#232D38"}`,
                    color: on ? "#DCE6EF" : "#8895A5",
                    font: "500 12px 'IBM Plex Sans',sans-serif",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {d.label}
                  <span style={{ font: "500 11px 'IBM Plex Mono',monospace", color: on ? "#8FA6BC" : "#788D9F" }}>
                    {query ? hits : counts[d.kind]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "16px clamp(20px,3vw,40px) 0",
        }}
      >
        <div aria-live="polite" style={{ font: "400 13px 'IBM Plex Sans',sans-serif", color: "#7D91A7" }}>
          <span className="ig-count" key={`${results.length}:${query}`}>
            {query
              ? `${results.length} ${results.length === 1 ? "record" : "records"} matching “${query.trim()}”`
              : "Enter a query to search every division"}
          </span>
        </div>
        {kinds.length > 0 && (
          <button
            type="button"
            className="ig-quiet"
            onClick={() => setKinds([])}
            style={{
              background: "none",
              border: 0,
              padding: 0,
              font: "500 12.5px 'IBM Plex Sans',sans-serif",
              cursor: "pointer",
            }}
          >
            Clear divisions
          </button>
        )}
      </div>

      <main id="main" style={{ padding: "18px clamp(20px,3vw,40px) 64px" }}>
        {query && results.length > 0 && (
          <div
            ref={reveal}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: "1px 28px" }}
          >
            {results.map((r, i) => (
              <Link
                key={`${r.kind}:${r.id}`}
                to={r.href}
                className="ig-index-row"
                data-reveal
                style={{
                  ...stagger(i),
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "13px 0",
                  borderBottom: "1px solid #161D26",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <span
                  className="ig-row-marker"
                  style={{ width: 2, alignSelf: "stretch", background: "#3D5568", flex: "none" }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                    <span
                      style={{ font: "500 10.5px 'IBM Plex Mono',monospace", letterSpacing: ".05em", color: "#9FB2C4" }}
                    >
                      {r.fileId}
                    </span>
                    <span
                      style={{
                        font: "500 9.5px 'IBM Plex Sans',sans-serif",
                        letterSpacing: ".13em",
                        color: "#788D9F",
                        textTransform: "uppercase",
                      }}
                    >
                      {division(r.kind).badge}
                    </span>
                  </div>
                  <div
                    style={{
                      font: "600 15px 'IBM Plex Sans',sans-serif",
                      color: "#E4E9EF",
                      marginTop: 4,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {r.name}
                  </div>
                  <div
                    style={{
                      font: "400 12.5px 'IBM Plex Sans',sans-serif",
                      color: "#7D91A7",
                      marginTop: 3,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {r.subtitle}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flex: "none" }}>
                  <SecurityBadge level={r.security} />
                  <StatusInk status={r.status} />
                </div>
              </Link>
            ))}
          </div>
        )}

        {query && results.length === 0 && (
          <EmptyState
            headline={`No record matches “${query.trim()}”`}
            body="No files in any division match your current archive query. Broaden the term, or clear the division filter."
            onReset={() => {
              setQuery("");
              setKinds([]);
            }}
          />
        )}

        {!query && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
              gap: 1,
              background: "#1A222C",
              border: "1px solid #1A222C",
            }}
          >
            {DIVISIONS.map((d, i) => (
              <Link
                key={d.kind}
                to={`/${d.path}`}
                className="ig-screen-tile"
                data-reveal
                style={{
                  ...stagger(i),
                  display: "flex",
                  flexDirection: "column",
                  gap: 9,
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
                      color: "#788D9F",
                      textTransform: "uppercase",
                    }}
                  >
                    {d.badge}
                  </span>
                  <span
                    style={{
                      font: "500 17px 'IBM Plex Mono',monospace",
                      color: "#9FB2C4",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {counts[d.kind]}
                  </span>
                </div>
                <div style={{ font: "700 18px 'Archivo',sans-serif", letterSpacing: "-.02em" }}>{d.label}</div>
                <div style={{ font: "400 13px/1.55 'IBM Plex Sans',sans-serif", color: "#7E8C9C", textWrap: "pretty" }}>
                  {d.blurb}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </Page>
  );
}
