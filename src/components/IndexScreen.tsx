import { useMemo, useRef, useState, type ReactNode } from "react";
import { Header } from "./Header";
import { Page } from "./Chrome";
import { EmptyState } from "./States";
import { FilterChips, SearchBar, SortControl, useSearchHotkeys } from "./Toolbar";
import { runQuery, type FilterDef, type SortDef } from "../lib/query";
import { step, useReveal, useScrolled } from "../lib/motion";

export interface IndexScreenProps<T> {
  eyebrow: string;
  title: string;
  intro: string;
  summary: { label: string; value: number; ink: string }[];
  records: T[];
  filters: FilterDef<T>[];
  sorts: SortDef<T>[];
  haystack: (record: T) => string;
  searchLabel: string;
  searchPlaceholder: string;
  /** minmax() lower bound for the card grid. */
  gridMin: number;
  /**
   * Must attach a stable React key — cards are direct grid children.
   * `index` drives the entrance stagger.
   */
  renderCard: (record: T, index: number) => ReactNode;
  countLabel: (shown: number, total: number) => string;
  emptyHeadline: (query: string) => string;
  emptyBody: string;
}

export function IndexScreen<T>(props: IndexScreenProps<T>) {
  const { records, filters, sorts, haystack } = props;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortIndex, setSortIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrolled = useScrolled(64);
  const gridReveal = useReveal();

  useSearchHotkeys(inputRef, () => setQuery(""));

  const { results, sort, isFiltered } = useMemo(
    () => runQuery({ records, query, filter, sortIndex, filters, sorts, haystack }),
    [records, query, filter, sortIndex, filters, sorts, haystack]
  );

  const counts = useMemo(
    () => Object.fromEntries(filters.map((f) => [f.key, records.filter(f.match).length])),
    [filters, records]
  );

  const resetAll = () => {
    setQuery("");
    setFilter("all");
  };

  return (
    <Page minHeight>
      <Header />

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 32,
          padding: "clamp(36px,5vw,52px) clamp(20px,3vw,40px) clamp(26px,3vw,32px)",
        }}
      >
        <div>
          <div
            data-enter
            style={{
              ...step(0),
              font: "500 11px 'IBM Plex Sans',sans-serif",
              letterSpacing: ".14em",
              color: "#748899",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            {props.eyebrow}
          </div>
          <h1
            data-enter
            style={{
              ...step(1),
              margin: 0,
              font: "800 clamp(30px,3.6vw,42px) 'Archivo',sans-serif",
              letterSpacing: "-.032em",
              lineHeight: 1.03,
            }}
          >
            {props.title}
          </h1>
          <p
            data-enter
            style={{
              ...step(2),
              margin: "12px 0 0",
              font: "400 14.5px/1.6 'IBM Plex Sans',sans-serif",
              color: "#7E8C9C",
              maxWidth: "62ch",
              textWrap: "pretty",
            }}
          >
            {props.intro}
          </p>
        </div>
        <div data-enter style={{ ...step(3), display: "flex", alignItems: "baseline", gap: "clamp(20px,3vw,36px)" }}>
          {props.summary.map((m) => (
            <div key={m.label}>
              <div
                style={{
                  font: "700 clamp(22px,2.6vw,30px) 'Archivo',sans-serif",
                  letterSpacing: "-.025em",
                  color: m.ink,
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                }}
              >
                {m.value}
              </div>
              <div
                style={{
                  font: "500 10.5px 'IBM Plex Sans',sans-serif",
                  letterSpacing: ".12em",
                  color: "#748899",
                  textTransform: "uppercase",
                  marginTop: 8,
                }}
              >
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="ig-sticky"
        data-scrolled={scrolled}
        data-enter
        style={{
          ...step(4),
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
            label={props.searchLabel}
            placeholder={props.searchPlaceholder}
            inputRef={inputRef}
          />
          <FilterChips filters={filters} active={filter} counts={counts} onSelect={setFilter} />
          <SortControl
            label={sort.label}
            arrow={sort.dir}
            onCycle={() => setSortIndex((i) => (i + 1) % sorts.length)}
          />
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
        <div aria-live="polite" style={{ font: "400 13px 'IBM Plex Sans',sans-serif", color: "#788BA0" }}>
          {/* Keyed on the count so the label re-enters instead of snapping. */}
          <span className="ig-count" key={results.length}>
            {props.countLabel(results.length, records.length)}
          </span>
        </div>
        {isFiltered && (
          <button
            type="button"
            className="ig-quiet"
            onClick={resetAll}
            style={{
              background: "none",
              border: 0,
              padding: 0,
              font: "500 12.5px 'IBM Plex Sans',sans-serif",
              cursor: "pointer",
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* One reveal unit. Cards carry their own data-reveal + --i, so they
          stagger on first paint and any card that appears later (a filter being
          cleared) animates in on its own without re-running the whole grid. */}
      <main
        id="main"
        ref={gridReveal}
        style={{
          padding: `18px clamp(20px,3vw,40px) 48px`,
          display: "grid",
          gridTemplateColumns: `repeat(auto-fill,minmax(${props.gridMin}px,1fr))`,
          gap: 16,
        }}
      >
        {results.map((r, i) => props.renderCard(r, i))}
      </main>

      {results.length === 0 && (
        <EmptyState
          margin="8px clamp(20px,3vw,40px) 64px"
          headline={props.emptyHeadline(query.trim())}
          body={props.emptyBody}
          onReset={resetAll}
        />
      )}
    </Page>
  );
}
