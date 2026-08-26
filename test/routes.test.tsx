import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../src/App";
import { loadArchive } from "../src/data/ingen";

// Counts come from the archive, never from a literal: a written-down total
// turns every added record into a test edit, and the number in the test stops
// proving anything about the number on the screen.
const { specimens, personnel, counts } = loadArchive();
const nSpec = specimens.length;
const nPers = personnel.length;

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );

beforeEach(() => {
  // jsdom has no layout engine; scrollIntoView / scrollTo are unimplemented.
  Element.prototype.scrollIntoView = vi.fn();
  window.scrollTo = vi.fn();
});

describe("route smoke tests", () => {
  it("renders the archive index", async () => {
    renderAt("/");
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "Central biological and operations record."
    );
    expect(screen.getByText(`${nSpec} indexed specimens`)).toBeTruthy();
    expect(screen.getByText(`${nPers} files on record`)).toBeTruthy();
  });

  it("renders the dashboard with derived metrics", async () => {
    renderAt("/dashboard");
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "Master index of the InGen record system."
    );
    expect(screen.getByText("Incident chronology")).toBeTruthy();
    expect(screen.getByText(`${counts.total} records indexed`)).toBeTruthy();
  });

  it("renders the genetic asset index with every card", async () => {
    renderAt("/assets");
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Genetic assets");
    expect(screen.getByText(`Showing all ${nSpec} records`)).toBeTruthy();
    expect(screen.getAllByText("Open record")).toHaveLength(nSpec);
  });

  it("renders the personnel index", async () => {
    renderAt("/personnel");
    expect(await screen.findByText(`Showing all ${nPers} files`)).toBeTruthy();
    expect(screen.getAllByText("Open file")).toHaveLength(nPers);
  });

  it("renders an asset dossier by deep link", async () => {
    renderAt("/assets/indominus-rex");
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Indominus rex");
    expect(screen.getByText("Field notes")).toBeTruthy();
    expect(screen.getAllByText("ING-HYB-001").length).toBeGreaterThan(0);
    expect(screen.getByText("ARCHIVED · L5")).toBeTruthy();
  });

  it("renders a personnel file by deep link", async () => {
    renderAt("/personnel/owen-grady");
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Owen Grady");
    expect(screen.getByText("Psychological profile")).toBeTruthy();
  });

  it("surfaces the designed 404 for an unknown asset id", async () => {
    renderAt("/assets/raptor-omega");
    expect(await screen.findByText("No asset record for “raptor-omega”")).toBeTruthy();
    expect(screen.getByText("404")).toBeTruthy();
  });

  it("surfaces the designed 404 for an unknown personnel id", async () => {
    renderAt("/personnel/nobody");
    expect(await screen.findByText("No personnel file for “nobody”")).toBeTruthy();
  });

  it("surfaces the designed 404 for an unknown route", async () => {
    renderAt("/does/not/exist");
    expect(await screen.findByText("No record at /does/not/exist")).toBeTruthy();
  });

  it("renders the states reference", async () => {
    renderAt("/states");
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("System states");
    expect(screen.getByText(/INDEXING ARCHIVE NODE/)).toBeTruthy();
    expect(screen.getByText(/Access denied/)).toBeTruthy();
  });

  // The full runs mount every dossier in the division at once — the whole point
  // of the screen. In jsdom that is several thousand nodes with no layout
  // engine to help, so these two get a wider budget than the 5s default. The
  // assertion is unchanged: every record still has to render.
  it("renders the full asset run with every dossier", { timeout: 20000 }, async () => {
    renderAt("/assets/all");
    await screen.findByText(`${nSpec} records`, undefined, { timeout: 15000 });
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(nSpec);
  });

  it("renders the full personnel run", { timeout: 20000 }, async () => {
    renderAt("/personnel/all");
    await screen.findByText(`${nPers} files`, undefined, { timeout: 15000 });
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(nPers);
  });
});

describe("accessibility landmarks", () => {
  it("marks the active nav item and exposes landmarks", async () => {
    renderAt("/assets");
    await screen.findByRole("heading", { level: 1 });
    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(within(nav).getByRole("link", { current: "page" })).toHaveTextContent("Genetic assets");
    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByRole("main")).toBeTruthy();
  });

  it("moves focus to the new route on navigation, but not on first paint", async () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/assets"]}>
        <App />
      </MemoryRouter>
    );
    await screen.findByText(`Showing all ${nSpec} records`);
    // First paint must leave the browser's own starting point alone.
    expect(document.activeElement).toBe(document.body);

    // Navigating hands focus to the route wrapper so assistive tech follows the
    // page change instead of staying parked on the link that was activated.
    fireEvent.click(screen.getByRole("link", { name: /Personnel/ }));
    await screen.findByText(`Showing all ${nPers} files`);
    await waitFor(() => {
      expect(document.activeElement).toBe(container.querySelector("#ig-route-root"));
    });
  });

  it("gives every route its own title and description", async () => {
    renderAt("/assets/blue");
    await screen.findByRole("heading", { level: 1 });
    await waitFor(() => expect(document.title).toContain("Blue"));
    const meta = document.head.querySelector('meta[name="description"]');
    expect(meta?.getAttribute("content")).toContain("ING-DIN-007");
  });

  it("labels the search field and the filter chips", async () => {
    renderAt("/assets");
    expect(await screen.findByLabelText("Search genetic assets")).toBeTruthy();
    expect(screen.getByRole("button", { pressed: true })).toHaveTextContent("All");
  });
});
