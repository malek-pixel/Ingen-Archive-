/* ============================================================================
   Level 5 access control — configuration.

   HONEST SCOPE NOTE, read this before treating any of it as security:

   This is a *fictional* in-universe gate. The archive is a static single-page
   application with no server, so the authorisation code is compiled into the
   client bundle by Vite like any other `VITE_` variable and can be read out of
   the shipped JavaScript by anyone who looks. It keeps the classified layer
   behind a deliberate act, and nothing more. Do not put a real secret here,
   and do not describe the Level 5 area as encrypted or access-controlled in
   any sense that would survive contact with a determined reader.

   The code itself is never written down in this repository. It is read from
   `VITE_INGEN_LEVEL5_PASSWORD` at build time (see `.env.example`), so changing
   it is an environment change, not a code change.
   ========================================================================== */

/** How long a granted session stays valid, in milliseconds. */
export const SESSION_TTL_MS = 30 * 60 * 1000;

/** sessionStorage key. Per-tab by design: closing the tab ends the session. */
export const SESSION_KEY = "ingen.l5.session";

/** Where the failed-attempt count and any active hold are kept. */
export const ATTEMPTS_KEY = "ingen.l5.attempts";

/**
 * The throttle ladder: how long the gate refuses to look at another code, by
 * the number of consecutive failures. Index 0 is the first failure.
 *
 * Escalating rather than flat, and never permanent — a lockout you cannot come
 * back from is a support ticket, not a security control, and the archive has
 * nobody to raise one with. The last step repeats for every failure past it.
 *
 * Honest about what this is: the hold lives in this tab's sessionStorage, so
 * anyone who knows to clear it can. It exists to make guessing tedious and to
 * make the refusal legible, not to withstand an attacker. Real rate limiting
 * needs a server, and this application does not have one.
 */
export const THROTTLE_LADDER_MS = [0, 0, 15_000, 30_000, 60_000, 120_000, 300_000];

/** Failures tolerated before the first hold. */
export const FREE_ATTEMPTS = THROTTLE_LADDER_MS.filter((ms) => ms === 0).length;

/** How long the gate holds after `failures` consecutive failed attempts. */
export function holdFor(failures: number): number {
  if (failures <= 0) return 0;
  const i = Math.min(failures - 1, THROTTLE_LADDER_MS.length - 1);
  return THROTTLE_LADDER_MS[i];
}

const configured = (import.meta.env.VITE_INGEN_LEVEL5_PASSWORD ?? "").trim();

/**
 * Whether an authorisation code has been configured at all.
 *
 * With no code set there is nothing to check against, and a gate that accepts
 * everything is worse than one that says it is not configured. The gate renders
 * a distinct state for this rather than silently failing every attempt.
 */
export const isConfigured = (): boolean => configured.length > 0;

/**
 * Verifies a submitted code.
 *
 * Surrounding whitespace is stripped from both sides — a code pasted with a
 * trailing newline is the user's intent, not a failed attempt. Everything else,
 * casing included, must match exactly.
 */
export function verifyCode(input: string): boolean {
  if (!isConfigured()) return false;
  return input.trim() === configured;
}
