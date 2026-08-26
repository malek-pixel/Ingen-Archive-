import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { loadArchive } from "../src/data/ingen";

// Derived, not written down — see routes.test.tsx.
const nSpec = loadArchive().specimens.length;

/**
 * The motion layer is allowed to fail; the archive is not. These tests pin the
 * three ways it can fail — no observer, reduced motion, frames that never
 * advance — and assert that content is readable in every one of them.
 */

const setMatchMedia = (reduced: boolean) => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduced && query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

/** Minimal IntersectionObserver that can be told when (or whether) to fire. */
class FakeIO {
  static instances: FakeIO[] = [];
  elements: Element[] = [];
  constructor(private cb: IntersectionObserverCallback) {
    FakeIO.instances.push(this);
  }
  observe(el: Element) {
    this.elements.push(el);
  }
  unobserve(el: Element) {
    this.elements = this.elements.filter((e) => e !== el);
  }
  disconnect() {
    this.elements = [];
  }
  takeRecords() {
    return [];
  }
  fire() {
    const entries = this.elements.map((target) => ({
      target,
      isIntersecting: true,
    })) as unknown as IntersectionObserverEntry[];
    this.cb(entries, this as unknown as IntersectionObserver);
  }
  static fireAll() {
    FakeIO.instances.forEach((i) => i.fire());
  }
  static reset() {
    FakeIO.instances = [];
  }
}

beforeEach(() => {
  // Real timers by default: the route tests await dynamic imports, which need
  // real macrotasks. Tests that assert on the watchdog install fake timers
  // themselves and advance them synchronously, so a watchdog still pending
  // from an earlier test can never interleave with their assertions.
  vi.resetModules();
  FakeIO.reset();
  document.documentElement.className = "";
  Element.prototype.scrollIntoView = vi.fn();
  window.scrollTo = vi.fn();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("motion runtime gating", () => {
  it("enables motion only when an observer exists and motion is not reduced", async () => {
    setMatchMedia(false);
    vi.stubGlobal("IntersectionObserver", FakeIO);
    await import("../src/lib/motion");
    expect(document.documentElement.classList.contains("ig-motion")).toBe(true);
  });

  it("does not hide anything when reduced motion is requested", async () => {
    setMatchMedia(true);
    vi.stubGlobal("IntersectionObserver", FakeIO);
    await import("../src/lib/motion");
    // Without ig-motion the CSS never applies the hidden start state.
    expect(document.documentElement.classList.contains("ig-motion")).toBe(false);
  });

  it("does not hide anything when IntersectionObserver is unavailable", async () => {
    setMatchMedia(false);
    vi.stubGlobal("IntersectionObserver", undefined);
    await import("../src/lib/motion");
    expect(document.documentElement.classList.contains("ig-motion")).toBe(false);
  });

  it("releases everything if frames never advance", async () => {
    vi.useFakeTimers();
    setMatchMedia(false);
    vi.stubGlobal("IntersectionObserver", FakeIO);
    await import("../src/lib/motion");

    // Drop anything a previously scheduled watchdog may have left behind, then
    // assert the freshly imported module's own timer across the boundary.
    const html = document.documentElement;
    html.classList.remove("ig-motion-timeout");

    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(html.classList.contains("ig-motion-timeout")).toBe(false);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(html.classList.contains("ig-motion-timeout")).toBe(true);
  });
});

describe("count-up never withholds a figure", () => {
  it("shows the real value immediately under reduced motion", async () => {
    setMatchMedia(true);
    vi.stubGlobal("IntersectionObserver", FakeIO);
    const { useCountUp } = await import("../src/lib/motion");

    function Probe() {
      const [value, ref] = useCountUp(43);
      return <span ref={ref}>{value}</span>;
    }
    render(<Probe />);
    expect(screen.getByText("43")).toBeTruthy();
  });

  it("falls back to the real value if the observer never fires", async () => {
    vi.useFakeTimers();
    setMatchMedia(false);
    vi.stubGlobal("IntersectionObserver", FakeIO);
    const { useCountUp } = await import("../src/lib/motion");

    function Probe() {
      const [value, ref] = useCountUp(43);
      return (
        <span data-testid="n" ref={ref}>
          {value}
        </span>
      );
    }
    render(<Probe />);
    expect(screen.getByTestId("n").textContent).toBe("0");
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByTestId("n").textContent).toBe("43");
  });
});

describe("revealed content stays reachable", () => {
  it("marks a grid revealed once it intersects, and only once", async () => {
    setMatchMedia(false);
    vi.stubGlobal("IntersectionObserver", FakeIO);
    const App = (await import("../src/App")).default;

    render(
      <MemoryRouter initialEntries={["/assets"]}>
        <App />
      </MemoryRouter>
    );
    await screen.findByText(`Showing all ${nSpec} records`);

    // The grid registers with the observer in a passive effect, which may not
    // have flushed when the text query resolves. Retry firing until it has,
    // rather than assuming a particular flush order.
    await waitFor(() => {
      act(() => {
        FakeIO.fireAll();
      });
      expect(screen.getByRole("main").classList.contains("is-in")).toBe(true);
    });

    // Unobserved after revealing — scrolling back must not replay it.
    const grid = screen.getByRole("main");
    expect(FakeIO.instances.filter((i) => i.elements.includes(grid))).toHaveLength(0);
  });

  it("renders every card even if the observer never fires", async () => {
    setMatchMedia(false);
    vi.stubGlobal("IntersectionObserver", FakeIO);
    const App = (await import("../src/App")).default;

    render(
      <MemoryRouter initialEntries={["/assets"]}>
        <App />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getAllByText("Open record")).toHaveLength(nSpec));
  });
});
