import { useCallback, useEffect, useRef, useState } from "react";

/* ============================================================================
   Motion runtime.

   Three primitives, deliberately small:
     useReveal      — viewport-triggered entrance, one observer for the whole app
     useCountUp     — numeric roll-up, driven by a single rAF loop
     useScrolled    — header scroll state, one passive listener for the whole app

   Everything else in the motion system is pure CSS (see styles/motion.css).
   ========================================================================== */

const canObserve = typeof IntersectionObserver !== "undefined";
const canMatch = typeof window !== "undefined" && typeof window.matchMedia === "function";

/*
 * Motion is opt-in at runtime, never assumed.
 *
 * The CSS only hides entering/revealable content under `html.ig-motion`, which
 * is added here — so if this module never runs, or the browser has no
 * IntersectionObserver, content renders normally instead of waiting on an
 * animation that will never play.
 *
 * `ig-motion-timeout` is the backstop for the harder case: the class is set,
 * but frames never advance (a tab that is never composited, a stalled
 * compositor) so neither the animations nor the observer callbacks run. After
 * the grace period everything is forced visible. Motion may fail; the archive
 * may not.
 */
const MOTION_GRACE_MS = 3000;

if (typeof document !== "undefined" && canObserve) {
  const query = canMatch ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  const html = document.documentElement;

  const apply = () => html.classList.toggle("ig-motion", !(query?.matches ?? false));
  apply();

  // Track the setting live. Someone turning "reduce motion" on mid-session
  // should not have to reload to be taken seriously — and turning it back off
  // should restore the sequence without one either.
  query?.addEventListener?.("change", apply);

  if (typeof window !== "undefined") {
    window.setTimeout(() => html.classList.add("ig-motion-timeout"), MOTION_GRACE_MS);
  }
}

export const prefersReducedMotion = () => canMatch && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------ reveal */

/**
 * One IntersectionObserver serves every revealable element in the app.
 * Elements are unobserved the moment they reveal, so the callback cost is
 * bounded by the number of elements that have not yet been seen, and content
 * never re-animates when it scrolls back into view.
 */
let observer: IntersectionObserver | null = null;

function sharedObserver(): IntersectionObserver | null {
  if (!canObserve) return null;
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        obs.unobserve(entry.target);
      }
    },
    // Fire a little before the element edge so content is settled by the time
    // it is actually read, and require a sliver of the element to be visible
    // so tall panels do not wait until they are fully on screen.
    { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
  );
  return observer;
}

/**
 * Ref callback that reveals a group when it enters the viewport.
 *
 * Attach to the animation *unit* — a card grid, a dossier section, a metric
 * row — not to every individual node. Children stagger off `--i` in CSS.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const held = useRef<T | null>(null);

  useEffect(() => {
    const el = held.current;
    const obs = sharedObserver();
    if (!el || !obs) return;
    // Already on screen at mount (above the fold): reveal without waiting for
    // a scroll, but still through the observer so the class is applied once.
    obs.observe(el);
    return () => obs.unobserve(el);
  }, []);

  return useCallback((node: T | null) => {
    held.current = node;
    if (node && !canObserve) node.classList.add("is-in");
  }, []);
}

/* ----------------------------------------------------------------- count-up */

/**
 * Rolls a number up once, when its section reveals. Returns the display value
 * and a ref to attach to the element that gates the animation.
 *
 * Honours reduced motion and environments without rAF/IntersectionObserver by
 * returning the final value immediately — the number is never withheld.
 */
export function useCountUp(target: number, durationMs = 620) {
  const instant = !canObserve || prefersReducedMotion() || typeof requestAnimationFrame === "undefined";
  const [value, setValue] = useState(() => (instant ? target : 0));
  const node = useRef<HTMLElement | null>(null);
  const done = useRef(instant);

  useEffect(() => {
    if (done.current) {
      setValue(target);
      return;
    }
    const el = node.current;
    if (!el) {
      setValue(target);
      return;
    }

    let frame = 0;
    let start = 0;

    const step = (now: number) => {
      if (!start) start = now;
      const t = Math.min((now - start) / durationMs, 1);
      // Same deceleration as the CSS entrance, so numbers land with the panel.
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(step);
    };

    const gate = new IntersectionObserver(
      (entries, obs) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        obs.disconnect();
        done.current = true;
        frame = requestAnimationFrame(step);
      },
      { threshold: 0.15 }
    );

    gate.observe(el);

    // Backstop, matching the reveal watchdog: if the gate never fires or frames
    // never advance, show the real figure rather than leaving a 0 on screen.
    // A number the reader cannot trust is worse than one that did not animate.
    const bail = window.setTimeout(() => {
      gate.disconnect();
      cancelAnimationFrame(frame);
      done.current = true;
      setValue(target);
    }, MOTION_GRACE_MS);

    return () => {
      gate.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(bail);
    };
  }, [target, durationMs]);

  const ref = useCallback((el: HTMLElement | null) => {
    node.current = el;
  }, []);
  return [value, ref] as const;
}

/* ---------------------------------------------------------------- scrolled */

/**
 * True once the page has scrolled past `offset`. A single passive listener,
 * rAF-coalesced, shared by every consumer via React state — no per-component
 * scroll handlers and no layout reads outside the frame callback.
 */
export function useScrolled(offset = 8) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let ticking = false;

    const read = () => {
      ticking = false;
      setScrolled(window.scrollY > offset);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [offset]);

  return scrolled;
}

/* ------------------------------------------------------------------- utils */

/** Inline custom properties for stagger index and meter cell index. */
export const stagger = (i: number) => ({ "--i": i }) as React.CSSProperties;
export const cellDelay = (i: number) => ({ "--c": i }) as React.CSSProperties;
/** Page-entry step, used with data-enter. */
export const step = (n: number) => ({ "--ig-step": n }) as React.CSSProperties;
