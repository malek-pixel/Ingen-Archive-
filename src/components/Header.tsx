import { NavLink, Link, useLocation } from "react-router-dom";
import { HelixIcon, OverviewIcon, PersonnelIcon } from "./icons";

const NAV = [
  { to: "/dashboard", label: "Overview", Icon: OverviewIcon, owns: ["/dashboard"] },
  { to: "/assets", label: "Genetic assets", Icon: HelixIcon, owns: ["/assets"] },
  { to: "/personnel", label: "Personnel", Icon: PersonnelIcon, owns: ["/personnel"] },
];

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
            color: "#748899",
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
        Restricted session
      </span>
    </div>
  );
}

/**
 * @param descriptor Replaces the primary nav with a single descriptor line
 *                   (used by the index and states screens, matching the mockups).
 * @param icons      Detail screens render the nav without icons.
 */
export function Header({ descriptor, icons = true }: { descriptor?: string; icons?: boolean }) {
  const { pathname } = useLocation();

  return (
    <header
      className="ig-hdr"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 24,
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
        <nav className="ig-nav" style={{ display: "flex", gap: 4, height: "100%", flex: 1 }} aria-label="Primary">
          {NAV.map(({ to, label, Icon, owns }) => {
            const current = owns.some((p) => pathname === p || pathname.startsWith(`${p}/`));
            return (
              <NavLink
                key={to}
                to={to}
                className={current ? "ig-navlink-active" : "ig-navlink"}
                aria-current={current ? "page" : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "0 14px",
                  textDecoration: "none",
                  font: current ? "600 13px 'IBM Plex Sans',sans-serif" : "400 13px 'IBM Plex Sans',sans-serif",
                  color: current ? "#E4E9EF" : "#7E8C9C",
                }}
              >
                {icons && <Icon />}
                {label}
              </NavLink>
            );
          })}
        </nav>
      )}
      <SessionMeta />
    </header>
  );
}
