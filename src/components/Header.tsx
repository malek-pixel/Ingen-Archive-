import { NavLink, Link, useLocation } from "react-router-dom";
import {
  EventIcon,
  HelixIcon,
  LeafIcon,
  OverviewIcon,
  PersonnelIcon,
  SearchIcon,
  SiteIcon,
  StructureIcon,
} from "./icons";
import { DIVISIONS, NAV_GROUPS } from "../data/divisions";
import type { RecordKind } from "../data/types";

const ICONS: Record<RecordKind, () => JSX.Element> = {
  specimen: HelixIcon,
  flora: LeafIcon,
  person: PersonnelIcon,
  location: SiteIcon,
  facility: StructureIcon,
  incident: EventIcon,
};

export function BrandLockup() {
  return (
    <Link
      to="/"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        flex: "none",
        textDecoration: "none",
        color: "inherit",
        animation: "ig-rise 420ms ease both",
      }}
    >
      <img
        src="/assets/ingen-mark.png"
        alt="InGen — International Genetic Technologies"
        width={26}
        height={27}
        style={{ display: "block", flex: "none" }}
      />
      <span style={{ display: "flex", flexDirection: "column", gap: 3, lineHeight: 1 }}>
        <span style={{ font: "700 13px 'Archivo',sans-serif", letterSpacing: ".005em", color: "#E4E9EF" }}>
          InGen Archive
        </span>
        <span
          className="ig-sub"
          style={{
            font: "500 8px 'IBM Plex Mono',monospace",
            letterSpacing: ".17em",
            color: "#788D9F",
            whiteSpace: "nowrap",
          }}
        >
          INTERNATIONAL GENETIC TECHNOLOGIES
        </span>
      </span>
    </Link>
  );
}

export function SessionMeta() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        flex: "none",
        font: "400 12px 'IBM Plex Sans',sans-serif",
        color: "#7E8C9C",
      }}
    >
      <span style={{ font: "500 11.5px 'IBM Plex Mono',monospace", color: "#9FB2C4" }}>L5</span>
      <span style={{ width: 1, height: 11, background: "#28323D" }} />
      <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span
          style={{
            width: 6,
            height: 6,
            background: "#7ACB9A",
            animation: "ig-pulse 2s ease-in-out infinite",
            flex: "none",
          }}
        />
        <span className="ig-session-label">Restricted session</span>
      </span>
    </div>
  );
}

/**
 * Primary navigation.
 *
 * One flat row of tabs, exactly as the frozen design draws it — the archive
 * grew from three registers to seven, but the bar did not change shape.
 * Grouping is carried by a hairline between taxonomy groups rather than by
 * stacked text labels: the labels cost a second row of header height, pushed
 * the bar to 141px, and clipped the last division off the end.
 *
 * @param descriptor Replaces the nav with a single descriptor line.
 * @param icons      Detail screens render the nav without icons.
 */
export function Header({ descriptor, icons = true }: { descriptor?: string; icons?: boolean }) {
  const { pathname } = useLocation();
  const isCurrent = (path: string) => pathname === `/${path}` || pathname.startsWith(`/${path}/`);
  const onOverview = pathname === "/dashboard";
  const onSearch = pathname === "/search";

  const tab = (current: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    padding: "0 10px",
    whiteSpace: "nowrap",
    textDecoration: "none",
    flex: "none",
    font: current ? "600 13px 'IBM Plex Sans',sans-serif" : "400 13px 'IBM Plex Sans',sans-serif",
    color: current ? "#E4E9EF" : "#7E8C9C",
  });

  return (
    <header
      className="ig-hdr"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "0 clamp(20px,3vw,40px)",
        height: 56,
        borderBottom: "1px solid #1A222C",
      }}
    >
      <BrandLockup />

      {descriptor ? (
        <span className="ig-meta" style={{ font: "400 12.5px 'IBM Plex Sans',sans-serif", color: "#7E8C9C", flex: 1 }}>
          {descriptor}
        </span>
      ) : (
        <nav
          className="ig-nav"
          style={{ display: "flex", alignItems: "stretch", flex: 1, minWidth: 0, height: "100%" }}
          aria-label="Primary"
        >
          <NavLink
            to="/dashboard"
            className={onOverview ? "ig-navlink-active" : "ig-navlink"}
            aria-current={onOverview ? "page" : undefined}
            style={tab(onOverview)}
          >
            {icons && <OverviewIcon />}
            Overview
          </NavLink>

          {NAV_GROUPS.map((group) => {
            const items = DIVISIONS.filter((d) => d.group === group.key);
            if (!items.length) return null;
            return (
              <span key={group.key} className="ig-nav-group" role="group" aria-label={group.label}>
                {items.map((d) => {
                  const current = isCurrent(d.path);
                  const Icon = ICONS[d.kind];
                  return (
                    <NavLink
                      key={d.kind}
                      to={`/${d.path}`}
                      className={current ? "ig-navlink-active" : "ig-navlink"}
                      aria-current={current ? "page" : undefined}
                      style={tab(current)}
                    >
                      {icons && <Icon />}
                      {d.label}
                    </NavLink>
                  );
                })}
              </span>
            );
          })}
        </nav>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 14, flex: "none" }}>
        <NavLink
          to="/search"
          aria-label="Search the archive"
          className={`ig-btn-ghost ig-searchlink${onSearch ? " is-current" : ""}`}
          aria-current={onSearch ? "page" : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "7px 9px",
            border: "1px solid #232D38",
            textDecoration: "none",
            font: "400 12px 'IBM Plex Sans',sans-serif",
            color: onSearch ? "#E4E9EF" : "#7E8C9C",
          }}
        >
          <SearchIcon stroke="currentColor" />
        </NavLink>
        <SessionMeta />
      </div>
    </header>
  );
}
