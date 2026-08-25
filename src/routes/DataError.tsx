import { Header } from "../components/Header";
import { Page } from "../components/Chrome";
import { LockIcon } from "../components/icons";

/**
 * Shown when the dataset fails validation. Uses the frozen "clearance denied"
 * language rather than a browser error page — the archive never fails silently.
 */
export default function DataError({ issues }: { issues?: string[] }) {
  return (
    <Page minHeight>
      <Header descriptor="Archive unavailable" />
      <main id="main" style={{ padding: "40px clamp(20px,3vw,40px) 64px" }}>
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
              Index integrity failure · master record unavailable
            </span>
          </div>
          <div style={{ padding: "30px 24px 32px" }}>
            <div style={{ font: "700 24px 'Archivo',sans-serif", letterSpacing: "-.02em", marginBottom: 10 }}>
              The archive index did not validate
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
              The master record set failed structural verification and cannot be served. No partial index is shown —
              report the failure to records infrastructure.
            </p>
            {issues?.length ? (
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 20,
                  font: "400 12.5px/1.7 'IBM Plex Mono',monospace",
                  color: "#B7ABA9",
                }}
              >
                {issues.slice(0, 12).map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </main>
    </Page>
  );
}
