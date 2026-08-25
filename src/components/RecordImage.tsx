import { useState, type CSSProperties } from "react";

/**
 * Record imagery with an explicit failure state.
 *
 * A missing or corrupt plate would otherwise render as a silent empty box, and
 * the dossier would read as complete when it is not. On error the frame is
 * replaced by a labelled placeholder in the archive's own language, so an
 * absent asset is reported rather than hidden — the same rule the record
 * lookup follows.
 */
export function RecordImage({
  src,
  alt,
  className,
  style,
  width,
  height,
  loading = "lazy",
  plate = false,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
  /** Plate imagery sits on the light engineering ground, not a dark panel. */
  plate?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <span
        role="img"
        aria-label={`${alt} — image unavailable`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          padding: 12,
          textAlign: "center",
          background: plate ? "#D8DEE4" : "#0C1117",
          border: plate ? "none" : "1px solid #1A222C",
          font: "500 9px 'IBM Plex Mono',monospace",
          letterSpacing: ".14em",
          color: plate ? "#5A7085" : "#748899",
        }}
      >
        IMAGE UNAVAILABLE
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      width={width}
      height={height}
      loading={loading}
      onError={() => setFailed(true)}
    />
  );
}
