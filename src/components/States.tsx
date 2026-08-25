import { Link } from "react-router-dom";
import { NoResultsIcon } from "./icons";
import { Watermark } from "./Chrome";
import { stagger } from "../lib/motion";

export function CardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div style={{ ...stagger(index), background: "#0E131A", border: "1px solid #1A222C" }}>
      <div className="ig-skl" style={{ height: 184 }} />
      <div style={{ padding: 16 }}>
        <div className="ig-skl" style={{ height: 20, width: "64%", marginBottom: 10 }} />
        <div className="ig-skl" style={{ height: 12, width: "42%", marginBottom: 20 }} />
        <div className="ig-skl" style={{ height: 12, width: "56%", marginBottom: 16 }} />
        <div className="ig-skl" style={{ height: 3, width: 74, marginBottom: 20 }} />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            paddingTop: 14,
            borderTop: "1px solid #161D26",
          }}
        >
          <div className="ig-skl" style={{ height: 11, width: 64 }} />
          <div className="ig-skl" style={{ height: 11, width: 70 }} />
        </div>
      </div>
    </div>
  );
}

export function IndexingBanner({ node = "07", detail }: { node?: string; detail: string }) {
  return (
    <div
      role="status"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        marginBottom: 16,
        padding: "15px 20px",
        border: "1px solid #1A222C",
        background: "#0C1117",
      }}
    >
      <div style={{ position: "relative", width: 34, height: 35, flex: "none", overflow: "hidden" }}>
        <img
          src="/assets/ingen-mark.png"
          alt=""
          aria-hidden="true"
          style={{ width: "100%", height: "100%", display: "block" }}
        />
        <span
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: "42%",
            background: "linear-gradient(180deg,transparent,rgba(59,167,224,.55),transparent)",
            animation: "ig-scan 1.8s linear infinite",
          }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: "600 12px 'IBM Plex Mono',monospace", letterSpacing: ".1em", color: "#9FB2C4" }}>
          INDEXING ARCHIVE NODE {node}
        </div>
        <div style={{ font: "400 12px 'IBM Plex Sans',sans-serif", color: "#788BA0", marginTop: 3 }}>{detail}</div>
      </div>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          flex: "none",
          font: "500 11px 'IBM Plex Mono',monospace",
          letterSpacing: ".08em",
          color: "#7ACB9A",
        }}
      >
        <span style={{ width: 6, height: 6, background: "#7ACB9A", animation: "ig-pulse 1.6s ease-in-out infinite" }} />
        ONLINE
      </span>
    </div>
  );
}

export function EmptyState({
  headline,
  body,
  onReset,
  margin,
}: {
  headline: string;
  body: string;
  onReset?: () => void;
  margin?: string;
}) {
  return (
    <div
      data-enter
      style={{ margin, padding: "clamp(56px,8vw,84px) 40px", textAlign: "center", border: "1px solid #1A222C" }}
    >
      <NoResultsIcon />
      <div style={{ font: "700 22px 'Archivo',sans-serif", letterSpacing: "-.02em", marginBottom: 10 }}>{headline}</div>
      <p
        style={{
          margin: "0 auto 24px",
          maxWidth: "44ch",
          font: "400 13.5px/1.65 'IBM Plex Sans',sans-serif",
          color: "#7E8C9C",
          textWrap: "pretty",
        }}
      >
        {body}
      </p>
      <button
        type="button"
        className="ig-btn-primary"
        onClick={onReset}
        style={{
          padding: "10px 18px",
          background: "#0E131A",
          border: "1px solid #2E5C7A",
          color: "#9FCDEA",
          font: "600 12.5px 'IBM Plex Sans',sans-serif",
          cursor: "pointer",
        }}
      >
        Clear filters and search
      </button>
    </div>
  );
}

export function NotFoundBlock({
  eyebrow,
  headline,
  body,
  actionLabel,
  actionTo,
  watermark,
  margin,
  padding,
}: {
  eyebrow: string;
  headline: string;
  body: string;
  actionLabel: string;
  actionTo: string;
  watermark?: boolean;
  margin?: string;
  padding?: string;
}) {
  return (
    <div
      data-enter
      style={{
        position: "relative",
        isolation: "isolate",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        gap: 44,
        margin,
        padding: padding ?? "52px 44px",
        border: "1px solid #1A222C",
        flexWrap: "wrap",
      }}
    >
      {watermark && <Watermark right="2%" opacity={0.04} />}
      <div
        style={{
          font: "800 84px 'Archivo',sans-serif",
          letterSpacing: "-.05em",
          color: "#28323D",
          lineHeight: 0.9,
          flex: "none",
        }}
      >
        404
      </div>
      <div style={{ flex: 1, minWidth: 260 }}>
        <div
          style={{
            font: "500 11px 'IBM Plex Sans',sans-serif",
            letterSpacing: ".13em",
            color: "#748899",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          {eyebrow}
        </div>
        <div style={{ font: "700 24px 'Archivo',sans-serif", letterSpacing: "-.02em", marginBottom: 10 }}>
          {headline}
        </div>
        <p
          style={{
            margin: "0 0 20px",
            maxWidth: "60ch",
            font: "400 14px/1.65 'IBM Plex Sans',sans-serif",
            color: "#8895A5",
            textWrap: "pretty",
          }}
        >
          {body}
        </p>
        <Link
          to={actionTo}
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
          {actionLabel}
        </Link>
      </div>
    </div>
  );
}
