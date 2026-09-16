import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ATTEMPTS_KEY, SESSION_KEY, SESSION_TTL_MS, holdFor, verifyCode } from "./config";

/* ============================================================================
   Level 5 session.

   Authorisation state lives here and only here; every Level 5 screen reads it
   through `useLevel5()` and none of them know how it is stored or checked.
   Presentation stays in the components, the rule stays in `config.ts`.

   Storage is `sessionStorage`, which matches how the rest of the archive
   behaves: a reload keeps you where you were, closing the tab does not. A
   granted session also carries an expiry, so a tab left open overnight asks
   again rather than staying open forever.
   ========================================================================== */

export type SessionState = "locked" | "authorized" | "expired";

/** One line of the in-session activity trace shown by the access log panel. */
export interface AccessEvent {
  /** Wall-clock stamp, formatted once at creation so the list never re-renders. */
  time: string;
  message: string;
  tone?: "normal" | "warn";
}

/**
 * What an attempt did.
 *
 * "held" means the gate refused to look at the code at all — it is not a
 * verdict on the code, and the gate must not present it as one.
 */
export type AttemptResult = "granted" | "denied" | "held";

interface Level5Context {
  state: SessionState;
  /** Epoch ms the current grant lapses at, or null when not authorized. */
  expiresAt: number | null;
  failedAttempts: number;
  /** Epoch ms the security hold lifts, or null when the gate is open to tries. */
  heldUntil: number | null;
  /** True once a grant has been opened in this tab — the lock screen wording. */
  previouslyOpened: boolean;
  log: AccessEvent[];
  /** Verifies a code, subject to the throttle. Opens the session on a match. */
  authenticate: (code: string) => AttemptResult;
  lock: () => void;
  /** Appends a line to the session trace. */
  note: (message: string, tone?: AccessEvent["tone"]) => void;
}

const Context = createContext<Level5Context | null>(null);

const stamp = () =>
  new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

/** Reads a stored grant, treating anything unparseable or lapsed as absent. */
function readStored(): number | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { expiresAt?: unknown };
    const expiresAt = typeof parsed.expiresAt === "number" ? parsed.expiresAt : 0;
    return expiresAt > Date.now() ? expiresAt : null;
  } catch {
    // A corrupt or unavailable store is not an error worth surfacing — it just
    // means there is no session, which is the safe reading of "unknown".
    return null;
  }
}

function writeStored(expiresAt: number | null) {
  try {
    if (expiresAt == null) sessionStorage.removeItem(SESSION_KEY);
    else sessionStorage.setItem(SESSION_KEY, JSON.stringify({ expiresAt }));
  } catch {
    // Private-mode storage failures degrade to a session that lasts as long as
    // the page does. The archive still works; it just forgets on reload.
  }
}

/* ---------------------------------------------------------------- throttle */

interface Attempts {
  failures: number;
  heldUntil: number;
}

/**
 * The failure count is persisted, and that is the point.
 *
 * Holding it in component state meant a reload cleared it, so the throttle
 * could be stepped around by pressing F5 — which is not a throttle, it is a
 * pause. Session storage keeps it for as long as the tab that earned it lives.
 */
function readAttempts(): Attempts {
  try {
    const raw = sessionStorage.getItem(ATTEMPTS_KEY);
    if (!raw) return { failures: 0, heldUntil: 0 };
    const parsed = JSON.parse(raw) as { failures?: unknown; heldUntil?: unknown };
    return {
      failures: typeof parsed.failures === "number" && parsed.failures > 0 ? Math.floor(parsed.failures) : 0,
      heldUntil: typeof parsed.heldUntil === "number" ? parsed.heldUntil : 0,
    };
  } catch {
    return { failures: 0, heldUntil: 0 };
  }
}

function writeAttempts(attempts: Attempts) {
  try {
    if (attempts.failures === 0) sessionStorage.removeItem(ATTEMPTS_KEY);
    else sessionStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
  } catch {
    // As above: without storage the throttle lasts only as long as the page.
  }
}

/** mm:ss for the hold countdown. */
export const formatHold = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

export function Level5Provider({ children }: { children: ReactNode }) {
  const [expiresAt, setExpiresAt] = useState<number | null>(readStored);
  const [state, setState] = useState<SessionState>(() => (readStored() ? "authorized" : "locked"));
  const [attempts, setAttempts] = useState<Attempts>(readAttempts);
  const [log, setLog] = useState<AccessEvent[]>([]);
  const opened = useRef(readStored() != null);

  // A hold that has already lapsed is not a hold. Reading it through this
  // rather than off state means a stale timestamp can never gate anything.
  const heldUntil = attempts.heldUntil > Date.now() ? attempts.heldUntil : null;

  // The log is capped: it is a session trace, not a data store, and an
  // unbounded array behind a re-rendering list is a slow leak.
  const note = useCallback((message: string, tone: AccessEvent["tone"] = "normal") => {
    setLog((prev) => [...prev, { time: stamp(), message, tone }].slice(-40));
  }, []);

  const noteRef = useRef(note);
  noteRef.current = note;

  // Resuming an existing grant (a reload inside the same tab) should read as a
  // continuation rather than a fresh authentication.
  useEffect(() => {
    if (state === "authorized") noteRef.current("SESSION RESUMED — CLEARANCE STILL VALID");
    // Runs once for the initial state only; later transitions log themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Expiry is driven by one timer for the whole session rather than a ticking
  // interval: nothing needs to know the remaining time except the readout,
  // which computes it itself.
  useEffect(() => {
    if (state !== "authorized" || expiresAt == null) return;
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      setState("expired");
      return;
    }
    const timer = window.setTimeout(() => {
      writeStored(null);
      setExpiresAt(null);
      setState("expired");
      noteRef.current("SESSION EXPIRED — RE-AUTHORIZATION REQUIRED", "warn");
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [state, expiresAt]);

  const authenticate = useCallback((code: string): AttemptResult => {
    // Read the hold from storage, not from the closure: this callback is
    // stable, and a hold set by a previous attempt must still bite.
    const current = readAttempts();
    if (current.heldUntil > Date.now()) {
      setAttempts(current);
      noteRef.current("ATTEMPT REFUSED — SECURITY HOLD IN EFFECT", "warn");
      return "held";
    }

    if (!verifyCode(code)) {
      const failures = current.failures + 1;
      const hold = holdFor(failures);
      const next = { failures, heldUntil: hold ? Date.now() + hold : 0 };
      writeAttempts(next);
      setAttempts(next);
      noteRef.current(`AUTHORIZATION REJECTED — ATTEMPT ${String(failures).padStart(2, "0")} LOGGED`, "warn");
      if (hold) noteRef.current(`SECURITY HOLD APPLIED — ${Math.round(hold / 1000)}s`, "warn");
      return "denied";
    }

    const until = Date.now() + SESSION_TTL_MS;
    writeStored(until);
    setExpiresAt(until);
    setState("authorized");
    writeAttempts({ failures: 0, heldUntil: 0 });
    setAttempts({ failures: 0, heldUntil: 0 });
    opened.current = true;
    noteRef.current("CREDENTIALS VERIFIED");
    noteRef.current("LEVEL 5 CLEARANCE CONFIRMED");
    noteRef.current("ARCHIVE ACCESS GRANTED");
    return "granted";
  }, []);

  // One timer per hold, so the gate reopens on its own rather than waiting for
  // the next keystroke to notice. The failure count survives — the hold is
  // what lapses, not the record of how many attempts earned it.
  useEffect(() => {
    if (heldUntil == null) return;
    const timer = window.setTimeout(() => {
      setAttempts((prev) => {
        const next = { failures: prev.failures, heldUntil: 0 };
        writeAttempts(next);
        return next;
      });
      noteRef.current("SECURITY HOLD LIFTED — GATE OPEN");
    }, heldUntil - Date.now());
    return () => window.clearTimeout(timer);
  }, [heldUntil]);

  const lock = useCallback(() => {
    writeStored(null);
    setExpiresAt(null);
    setState("locked");
    // Locking deliberately does not clear the failure count: an operator
    // locking the archive should not be a way to wipe the throttle.
    noteRef.current("ARCHIVE LOCKED BY OPERATOR", "warn");
  }, []);

  const value = useMemo<Level5Context>(
    () => ({
      state,
      expiresAt,
      failedAttempts: attempts.failures,
      heldUntil,
      previouslyOpened: opened.current,
      log,
      authenticate,
      lock,
      note,
    }),
    [state, expiresAt, attempts.failures, heldUntil, log, authenticate, lock, note]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useLevel5(): Level5Context {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useLevel5 must be used inside <Level5Provider>");
  return ctx;
}
