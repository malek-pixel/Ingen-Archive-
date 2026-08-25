/** Inline SVG icons, transcribed from the mockups. Always decorative — paired with a text label. */
const base = {
  width: 15,
  height: 15,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  "aria-hidden": true,
  style: { flex: "none", marginRight: 9 },
} as const;

export const OverviewIcon = () => (
  <svg {...base}>
    <rect x="3" y="3" width="7" height="8" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="15" width="7" height="6" rx="1" />
  </svg>
);

export const HelixIcon = () => (
  <svg {...base} strokeLinecap="round">
    <path d="M5 4c0 5 14 5 14 12" />
    <path d="M19 4c0 5-14 5-14 12" />
    <path d="M7.5 6h9" />
    <path d="M9 9.5h6" />
    <path d="M9 14.5h6" />
    <path d="M7.5 18h9" />
  </svg>
);

export const PersonnelIcon = () => (
  <svg {...base} strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="3.2" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.3a4 4 0 0 1 0 7.4" />
  </svg>
);

export const SearchIcon = ({ stroke }: { stroke: string }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </svg>
);

export const ClearIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const NoResultsIcon = () => (
  <svg
    width="30"
    height="30"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#3D5568"
    strokeWidth="1.4"
    style={{ marginBottom: 18 }}
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
    <path d="M8 11h6" strokeDasharray="2 2" />
  </svg>
);

export const LockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C8524B" strokeWidth="2" aria-hidden="true">
    <rect x="4" y="10" width="16" height="10" rx="1" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);
