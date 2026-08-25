import { useEffect, useRef, useState } from "react";
import { ClearIcon, SearchIcon } from "./icons";
import type { FilterDef } from "../lib/query";

export function SearchBar({
  value,
  onChange,
  label,
  placeholder,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  placeholder: string;
  inputRef: React.RefObject<HTMLInputElement>;
}) {
  const [focused, setFocused] = useState(false);
  const hasQuery = value !== "";
  return (
    <label
      className="ig-search"
      data-focused={focused}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flex: 1,
        minWidth: 260,
        maxWidth: 420,
        padding: "10px 13px",
        background: "#0E131A",
        border: `1px solid ${focused ? "#2E5C7A" : "#232D38"}`,
      }}
    >
      <SearchIcon stroke={focused ? "#8FA6BC" : "#6F859D"} />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label={label}
        placeholder={placeholder}
        style={{
          flex: 1,
          background: "transparent",
          border: 0,
          outline: 0,
          font: "400 13px 'IBM Plex Sans',sans-serif",
          color: "#E4E9EF",
        }}
      />
      {hasQuery && (
        <button
          type="button"
          className="ig-iconbtn"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 18,
            height: 18,
            padding: 0,
            background: "none",
            border: 0,
            cursor: "pointer",
          }}
        >
          <ClearIcon />
        </button>
      )}
      {!hasQuery && !focused && (
        <kbd
          style={{
            font: "500 11px 'IBM Plex Mono',monospace",
            color: "#748899",
            border: "1px solid #232D38",
            padding: "1px 6px",
          }}
        >
          /
        </kbd>
      )}
    </label>
  );
}

export function FilterChips<T>({
  filters,
  active,
  counts,
  onSelect,
}: {
  filters: FilterDef<T>[];
  active: string;
  counts: Record<string, number>;
  onSelect: (key: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 7, flexWrap: "wrap", flex: 1 }}>
      {filters.map((f) => {
        const on = f.key === active;
        return (
          <button
            key={f.key}
            type="button"
            className="ig-chip"
            onClick={() => onSelect(f.key)}
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
            {f.dotInk && (
              <span className="ig-chip-dot" style={{ width: 6, height: 6, background: f.dotInk, flex: "none" }} />
            )}
            {f.label}{" "}
            <span style={{ font: "500 11px 'IBM Plex Mono',monospace", color: on ? "#8FA6BC" : "#748899" }}>
              {counts[f.key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function SortControl({ label, arrow, onCycle }: { label: string; arrow: string; onCycle: () => void }) {
  return (
    <button
      type="button"
      className="ig-sort"
      onClick={onCycle}
      aria-label={`Change sort order — currently ${label} ${arrow === "↑" ? "ascending" : "descending"}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        flex: "none",
        padding: "8px 13px",
        background: "#0E131A",
        border: "1px solid #232D38",
        color: "#BAC6D2",
        font: "500 12px 'IBM Plex Sans',sans-serif",
        cursor: "pointer",
      }}
    >
      <span style={{ color: "#748899" }}>Sort</span>
      <span>{label}</span>
      <span className="ig-sort-arrow" style={{ font: "500 12px 'IBM Plex Mono',monospace", color: "#8FA6BC" }}>
        {arrow}
      </span>
    </button>
  );
}

/** "/" focuses the search field; Escape inside it clears the query. */
export function useSearchHotkeys(inputRef: React.RefObject<HTMLInputElement>, clear: () => void) {
  const clearRef = useRef(clear);
  clearRef.current = clear;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = inputRef.current;
      if (e.key === "/" && document.activeElement !== el) {
        const target = document.activeElement;
        const typing =
          target instanceof HTMLElement &&
          (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
        if (typing) return;
        e.preventDefault();
        el?.focus();
      } else if (e.key === "Escape" && document.activeElement === el) {
        clearRef.current();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [inputRef]);
}
