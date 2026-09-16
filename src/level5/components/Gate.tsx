import { useCallback, useEffect, useRef, useState } from "react";
import { isConfigured, verifyCode } from "../config";
import { formatHold, useLevel5 } from "../session";
import { Dot, L5_INK, LockGlyph, Panel, Stamp, Tag, useTypeOut } from "./Chrome5";

/* ============================================================================
   The security gate.

   Presentation only: the rule it enforces lives in `config.ts` and the session
   it opens lives in `session.tsx`. The gate asks whether a code would be
   accepted, plays the sequence, and then opens the session — the beat between
   the two is why the check and the grant are separate calls.
   ========================================================================== */

const MONO = "'IBM Plex Mono',monospace";
const SANS = "'IBM Plex Sans',sans-serif";

/** The scan messages, in order. Total run is ~1.5s — felt, not waited on. */
const SEQUENCE = [
  "Establishing secure connection...",
  "Verifying credentials...",
  "Checking clearance level...",
  "Validating authorization...",
  "Access token generated...",
  "Clearance confirmed...",
];
const STEP_MS = 240;
const GRANT_HOLD_MS = 900;

type Phase = "idle" | "running" | "granted" | "denied" | "held";

/**
 * Re-renders once a second while a hold is in force, so the countdown moves.
 * Stops the moment the hold lifts — nothing ticks on an open gate.
 */
function useHoldCountdown(heldUntil: number | null) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (heldUntil == null) return;
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [heldUntil]);
  return heldUntil == null ? null : formatHold(heldUntil - Date.now());
}

export function Gate({ locked = false }: { locked?: boolean }) {
  const { authenticate, failedAttempts, heldUntil, note } = useLevel5();
  const [code, setCode] = useState("");
  const [reveal, setReveal] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);
  const configured = isConfigured();

  // Every timer this component starts is tracked so a navigation mid-sequence
  // cannot leave one running against an unmounted tree.
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    },
    []
  );

  useEffect(() => {
    note(locked ? "ARCHIVE LOCKED — AUTHORIZATION REQUIRED" : "SESSION INITIALIZED");
    // One line per mount; the log is appended to by the session, not by renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = () => {
    if (phase === "running" || !configured) return;

    // Checked before the sequence, not after: a hold has to bite on a correct
    // code too, or it is only a throttle on people who are already wrong.
    if (heldUntil != null) {
      setPhase("held");
      inputRef.current?.focus();
      return;
    }

    const candidate = code;
    setPhase("running");
    setStepIndex(0);

    // The sequence runs to the same length whichever way it resolves, so its
    // duration never hints at whether the code was right.
    SEQUENCE.forEach((_, i) => later(() => setStepIndex(i), i * STEP_MS));

    later(() => {
      if (verifyCode(candidate)) {
        setPhase("granted");
        // The session opens after the confirmation beat, so ACCESS GRANTED is
        // actually seen rather than replaced by the archive mid-frame.
        later(() => authenticate(candidate), GRANT_HOLD_MS);
      } else {
        // Records the attempt, logs it, and applies the next rung of the
        // throttle. "held" comes back if one was already running.
        const result = authenticate(candidate);
        setPhase(result === "held" ? "held" : "denied");
        setCode("");
        setReveal(false);
        inputRef.current?.focus();
      }
    }, SEQUENCE.length * STEP_MS);
  };

  const countdown = useHoldCountdown(heldUntil);
  const onHold = heldUntil != null;

  const statusLine = onHold
    ? `SECURITY HOLD — RETRY IN ${countdown}`
    : phase === "running"
      ? SEQUENCE[stepIndex]
      : phase === "granted"
        ? "CLEARANCE CONFIRMED"
        : phase === "denied"
          ? "AUTHORIZATION REJECTED"
          : configured
            ? "AWAITING AUTHORIZATION"
            : "ACCESS CONTROL NOT CONFIGURED";

  const typed = useTypeOut(phase === "idle" && !onHold ? statusLine : "");
  const busy = phase === "running" || phase === "granted";
  const disabled = busy || onHold || !configured;

  return (
    <div
      className="ig-l5-seq"
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "calc(100vh - 56px)",
        padding: "clamp(24px,5vw,64px) clamp(16px,4vw,40px)",
      }}
    >
      <div
        className={
          phase === "denied" || phase === "held" ? "ig-l5-deny" : phase === "granted" ? "ig-l5-grant" : undefined
        }
        data-seq=""
        style={{ width: "100%", maxWidth: 560, display: "grid", gap: 16 }}
      >
        {/* ---------------------------------------------------- identity */}
        <div style={{ display: "grid", gap: 10, justifyItems: "center", textAlign: "center" }}>
          <img src="/assets/ingen-mark.png" alt="" aria-hidden="true" width={38} height={39} />
          <Tag ink="#9FB2C4">INGEN INTERNAL ARCHIVE</Tag>
          <h1 style={{ margin: 0, font: "800 clamp(22px,4vw,30px) 'Archivo',sans-serif", letterSpacing: "-.03em" }}>
            {locked ? "Archive locked" : "Security clearance required"}
          </h1>
          <p style={{ margin: 0, font: `400 13px ${SANS}`, color: "#8895A5", maxWidth: "46ch" }}>
            {locked
              ? "The classified layer was locked by the operator. Level 5 authorization is required to open it again."
              : "This layer of the archive is closed. Authorized personnel only — unauthorized access will be logged."}
          </p>
        </div>

        {/* ------------------------------------------------- clearance row */}
        <div
          className="ig-l5-panel ig-l5-ticked"
          data-seq=""
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "10px 20px",
            padding: "12px 16px",
          }}
        >
          <div style={{ display: "grid", gap: 5 }}>
            <Tag>CLEARANCE LEVEL</Tag>
            <span style={{ display: "flex", alignItems: "center", gap: 8, font: `600 13px ${MONO}`, color: L5_INK }}>
              <LockGlyph size={12} />
              LEVEL 5
            </span>
          </div>
          <span style={{ width: 1, height: 26, background: "#232D38" }} aria-hidden="true" />
          <div style={{ display: "grid", gap: 5 }}>
            <Tag>ACCESS</Tag>
            <span style={{ font: `500 12.5px ${MONO}`, color: "#E0B36A" }}>RESTRICTED</span>
          </div>
          <span style={{ flex: 1 }} />
          <Stamp text="LEVEL 5 // CLASSIFIED" />
        </div>

        {/* ------------------------------------------------------- the form */}
        <Panel title="AUTHORIZATION" seq={2}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            style={{ display: "grid", gap: 14, padding: "16px" }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="l5-code" style={{ font: `500 11.5px ${SANS}`, letterSpacing: ".08em", color: "#9FB2C4" }}>
                Enter access code
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#0E131A",
                  border: `1px solid ${phase === "denied" || onHold ? "#5E2F30" : "#232D38"}`,
                  opacity: onHold ? 0.55 : 1,
                }}
              >
                <input
                  id="l5-code"
                  ref={inputRef}
                  type={reveal ? "text" : "password"}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  // Explicit rather than relying on the form's implicit
                  // submission: the field is the only control most people will
                  // touch, and Enter has to work from it every time.
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    submit();
                  }}
                  disabled={disabled}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-describedby="l5-status l5-attempts"
                  aria-invalid={phase === "denied"}
                  placeholder="••••••••"
                  style={{
                    flex: 1,
                    minHeight: 44,
                    padding: "0 13px",
                    background: "transparent",
                    border: 0,
                    outline: 0,
                    font: `500 14px ${MONO}`,
                    letterSpacing: ".2em",
                    color: "#E4E9EF",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setReveal((v) => !v)}
                  aria-pressed={reveal}
                  aria-label={reveal ? "Hide access code" : "Show access code"}
                  className="ig-btn-ghost"
                  style={{
                    minHeight: 44,
                    minWidth: 44,
                    padding: "0 12px",
                    background: "none",
                    border: 0,
                    borderLeft: "1px solid #232D38",
                    color: "#8895A5",
                    font: `600 9.5px ${MONO}`,
                    letterSpacing: ".14em",
                    cursor: "pointer",
                  }}
                >
                  {reveal ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={disabled}
              className="ig-btn-primary"
              style={{
                minHeight: 46,
                width: "100%",
                background: phase === "granted" ? "#12181A" : onHold ? "#12141A" : "#13202B",
                border: `1px solid ${phase === "granted" ? "#2F5E45" : onHold ? "#5E2F30" : "#2E5C7A"}`,
                color: phase === "granted" ? "#7ACB9A" : onHold ? L5_INK : "#DCE6EF",
                font: `600 12px ${MONO}`,
                letterSpacing: ".16em",
                // The disabled cursor matters here: the control is not broken,
                // it is refusing, and "not-allowed" is the one that says so.
                cursor: phase === "running" ? "progress" : onHold ? "not-allowed" : "pointer",
                opacity: onHold ? 0.9 : 1,
              }}
            >
              {onHold
                ? `AUTHORIZATION SUSPENDED — ${countdown}`
                : phase === "running"
                  ? "AUTHENTICATING..."
                  : phase === "granted"
                    ? "ACCESS GRANTED"
                    : locked
                      ? "AUTHENTICATE AGAIN"
                      : "AUTHENTICATE"}
            </button>

            {phase === "running" ? <div className="ig-l5-rail" aria-hidden="true" /> : null}

            {/* -------------------------------------------------- status */}
            <div style={{ display: "grid", gap: 8, borderTop: "1px solid #1E2732", paddingTop: 13 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <Tag>STATUS</Tag>
                <span
                  id="l5-attempts"
                  style={{ font: `500 10.5px ${MONO}`, color: failedAttempts ? "#E08A84" : "#6B8297" }}
                >
                  FAILED ATTEMPTS: {String(failedAttempts).padStart(2, "0")}
                </span>
              </div>
              <p
                id="l5-status"
                aria-live="polite"
                className={phase === "idle" && !onHold ? "ig-l5-caret" : undefined}
                style={{
                  margin: 0,
                  font: `500 12.5px ${MONO}`,
                  color:
                    phase === "granted"
                      ? "#7ACB9A"
                      : phase === "denied" || onHold
                        ? L5_INK
                        : configured
                          ? "#9FB2C4"
                          : "#E0B36A",
                  minHeight: 18,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {phase === "idle" ? typed : statusLine}
              </p>

              {phase === "granted" ? (
                <div style={{ display: "grid", gap: 4 }}>
                  <span style={{ font: `600 11px ${MONO}`, letterSpacing: ".14em", color: "#7ACB9A" }}>
                    CLEARANCE VERIFIED
                  </span>
                  <span style={{ font: `600 11px ${MONO}`, letterSpacing: ".14em", color: "#7ACB9A" }}>
                    LEVEL 5 AUTHORIZATION CONFIRMED
                  </span>
                </div>
              ) : null}

              {phase === "denied" ? (
                <div role="alert" style={{ display: "grid", gap: 4 }}>
                  <span style={{ font: `700 12px ${MONO}`, letterSpacing: ".14em", color: L5_INK }}>ACCESS DENIED</span>
                  <span style={{ font: `500 11px ${MONO}`, letterSpacing: ".1em", color: "#B7ABA9" }}>
                    INVALID AUTHORIZATION CODE
                  </span>
                  <span style={{ font: `500 11px ${MONO}`, letterSpacing: ".1em", color: "#8895A5" }}>
                    SECURITY EVENT LOGGED
                  </span>
                </div>
              ) : null}

              {/* The hold. Stated as a rate limit rather than as a verdict on
                  the last code — the gate stopped reading, it did not decide. */}
              {onHold ? (
                <div role="alert" className="ig-l5-panel" style={{ display: "grid", gap: 7, padding: "11px 13px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <LockGlyph size={12} />
                    <span style={{ font: `700 12px ${MONO}`, letterSpacing: ".14em", color: L5_INK }}>
                      SECURITY HOLD
                    </span>
                  </span>
                  <span style={{ font: `500 11px ${MONO}`, letterSpacing: ".1em", color: "#B7ABA9" }}>
                    REPEATED FAILURES — AUTHORIZATION SUSPENDED
                  </span>
                  <span
                    style={{
                      font: `500 11px ${MONO}`,
                      letterSpacing: ".1em",
                      color: "#8895A5",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    GATE REOPENS IN {countdown} · HOLD LENGTHENS WITH EACH FAILURE
                  </span>
                </div>
              ) : null}

              {!configured ? (
                <p style={{ margin: 0, font: `400 12px ${SANS}`, color: "#E0B36A", lineHeight: 1.6 }}>
                  No authorization code is configured for this build. Set{" "}
                  <code style={{ font: `500 11.5px ${MONO}` }}>VITE_INGEN_LEVEL5_PASSWORD</code> in a local{" "}
                  <code style={{ font: `500 11.5px ${MONO}` }}>.env.local</code> file and restart the dev server.
                </p>
              ) : null}
            </div>
          </form>
        </Panel>

        {/* --------------------------------------------------------- footer */}
        <div
          data-seq=""
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "6px 14px",
            font: `400 11px ${SANS}`,
            color: "#6B8297",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Dot ink="#E0B36A" still={phase !== "idle"} />
            Access is monitored
          </span>
          <span style={{ width: 1, height: 10, background: "#28323D" }} aria-hidden="true" />
          <span>Unauthorized access will be logged</span>
        </div>
      </div>

      {phase === "granted" ? <span className="ig-l5-wipe" aria-hidden="true" /> : null}
    </div>
  );
}
