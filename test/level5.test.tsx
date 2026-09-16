import { describe, expect, it, beforeEach, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../src/App";
import { loadArchive } from "../src/data/ingen";
import { loadClassified, NOT_AVAILABLE } from "../src/level5/data";
import { Level5Provider, useLevel5 } from "../src/level5/session";
import type { AttemptResult } from "../src/level5/session";
import { FREE_ATTEMPTS, THROTTLE_LADDER_MS, holdFor, isConfigured, verifyCode } from "../src/level5/config";

/* ============================================================================
   Level 5.

   Two things are worth pinning here, and they are not the animations.

   The first is the gate: the classified layer must not be in the document
   before a code is accepted, and a wrong code must not open it.

   The second is provenance. Every classified record has to resolve to a record
   the open archive already holds. That is the whole promise of this layer, and
   it is the one thing that could silently rot — a predicate that stops matching
   or a grouping that starts inventing members would still render beautifully.
   ========================================================================== */

/** Matches the fixture in vite.config.ts, not any shipped value. */
const CODE = "test-clearance-code";

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  window.scrollTo = vi.fn();
  sessionStorage.clear();
});

/** Drives the gate to a granted session and waits for the dashboard. */
async function authenticate(code = CODE) {
  const field = await screen.findByLabelText("Enter access code");
  fireEvent.change(field, { target: { value: code } });
  fireEvent.click(screen.getByRole("button", { name: /^AUTHENTICATE/ }));
}

describe("the access rule", () => {
  it("is configured, and accepts only the configured code", () => {
    expect(isConfigured()).toBe(true);
    expect(verifyCode(CODE)).toBe(true);
    expect(verifyCode("not-it")).toBe(false);
    expect(verifyCode("")).toBe(false);
  });

  // A code pasted out of a password manager routinely arrives with a newline.
  it("ignores surrounding whitespace but nothing else", () => {
    expect(verifyCode(`  ${CODE}\n`)).toBe(true);
    expect(verifyCode(CODE.toUpperCase())).toBe(false);
  });
});

describe("the gate", () => {
  it("renders the security screen instead of the classified archive", async () => {
    renderAt("/classified");
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Security clearance required");
    expect(screen.queryByText("Project files")).toBeNull();
    expect(screen.queryByText(/compiled programme files/)).toBeNull();
  });

  it("guards the category and dossier routes too, not just the dashboard", async () => {
    renderAt("/classified/restricted-experiments");
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Security clearance required");
    cleanup();

    renderAt("/classified/project/hybrid-asset-series");
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Security clearance required");
  });

  it("refuses a wrong code, counts the attempt, and clears the field", async () => {
    renderAt("/classified");
    await screen.findByRole("heading", { level: 1 });
    await authenticate("wrong");

    expect(await screen.findByText("ACCESS DENIED", {}, { timeout: 8000 })).toBeTruthy();
    expect(screen.getByText("INVALID AUTHORIZATION CODE")).toBeTruthy();
    expect(screen.getByText("SECURITY EVENT LOGGED")).toBeTruthy();
    expect(screen.getByText("FAILED ATTEMPTS: 01")).toBeTruthy();
    expect(screen.getByLabelText("Enter access code")).toHaveValue("");
    // Still on the gate: a refusal must never leak the layer behind it.
    expect(screen.queryByText("Project files")).toBeNull();
  });

  it("opens the classified archive for the right code", async () => {
    renderAt("/classified");
    await screen.findByRole("heading", { level: 1 });
    await authenticate();

    expect(await screen.findByText("Project files", {}, { timeout: 8000 })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Level 5 // Classified");
  });

  it("masks the code, and the toggle reveals it", async () => {
    renderAt("/classified");
    const field = (await screen.findByLabelText("Enter access code")) as HTMLInputElement;
    expect(field.type).toBe("password");
    fireEvent.click(screen.getByRole("button", { name: "Show access code" }));
    expect((screen.getByLabelText("Enter access code") as HTMLInputElement).type).toBe("text");
  });
});

describe("the throttle", () => {
  /** Fails once and waits for the gate to finish refusing. */
  async function failOnce(n: number) {
    const field = screen.getByLabelText("Enter access code");
    fireEvent.change(field, { target: { value: `wrong-${n}` } });
    fireEvent.click(screen.getByRole("button", { name: /^AUTHENTICATE/ }));
    await screen.findByText(`FAILED ATTEMPTS: ${String(n).padStart(2, "0")}`, {}, { timeout: 8000 });
  }

  it("escalates: the ladder gives a longer hold for each further failure", () => {
    // The policy itself, checked without driving the UI through six sequences.
    expect(holdFor(1)).toBe(0);
    expect(holdFor(FREE_ATTEMPTS)).toBe(0);
    expect(holdFor(FREE_ATTEMPTS + 1)).toBeGreaterThan(0);
    for (let n = FREE_ATTEMPTS + 1; n < THROTTLE_LADDER_MS.length; n++) {
      expect(holdFor(n + 1), `step ${n}`).toBeGreaterThanOrEqual(holdFor(n));
    }
    // Never permanent, however many times you are wrong.
    expect(holdFor(999)).toBe(THROTTLE_LADDER_MS[THROTTLE_LADDER_MS.length - 1]);
    expect(Number.isFinite(holdFor(999))).toBe(true);
  });

  it("suspends the gate once the free attempts are spent", async () => {
    renderAt("/classified");
    await screen.findByRole("heading", { level: 1 });

    for (let n = 1; n <= FREE_ATTEMPTS + 1; n++) await failOnce(n);

    expect(await screen.findByText("SECURITY HOLD")).toBeTruthy();
    expect(screen.getByText("REPEATED FAILURES — AUTHORIZATION SUSPENDED")).toBeTruthy();
    expect(screen.getByRole("button", { name: /AUTHORIZATION SUSPENDED/ })).toBeDisabled();
    expect(screen.getByLabelText("Enter access code")).toBeDisabled();
  });

  // The hold has to apply to the right code too, or it only throttles people
  // who were already going to fail. Driven straight at the session rather than
  // through the form: the form disables itself during a hold, so going through
  // it would only prove the button is disabled, not that the rule holds.
  it("refuses the correct code while a hold is running", () => {
    const results: AttemptResult[] = [];
    function Probe() {
      const { authenticate } = useLevel5();
      return (
        <>
          <button onClick={() => results.push(authenticate("wrong"))}>fail</button>
          <button onClick={() => results.push(authenticate(CODE))}>try the real code</button>
        </>
      );
    }
    render(
      <Level5Provider>
        <Probe />
      </Level5Provider>
    );

    const fail = screen.getByRole("button", { name: "fail" });
    for (let n = 0; n <= FREE_ATTEMPTS; n++) fireEvent.click(fail);
    expect(results.every((r) => r === "denied")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "try the real code" }));
    expect(results.at(-1)).toBe("held");
    expect(sessionStorage.getItem("ingen.l5.session")).toBeNull();
  });

  it("survives a reload — the count is not reset by refreshing", async () => {
    renderAt("/classified");
    await screen.findByRole("heading", { level: 1 });
    for (let n = 1; n <= FREE_ATTEMPTS + 1; n++) await failOnce(n);
    cleanup();

    // A fresh mount reads the persisted attempts, exactly as a reload would.
    renderAt("/classified");
    expect(await screen.findByText(`FAILED ATTEMPTS: 0${FREE_ATTEMPTS + 1}`)).toBeTruthy();
    expect(await screen.findByText("SECURITY HOLD")).toBeTruthy();
  });

  // A successful grant is the only thing that clears the count. Locking must
  // not, or "lock and unlock" would be a way to wipe the throttle.
  it("clears the count on a grant, and locking does not bring it back", async () => {
    renderAt("/classified");
    await screen.findByRole("heading", { level: 1 });
    await failOnce(1);
    await authenticate();
    await screen.findByText("Project files", {}, { timeout: 8000 });

    fireEvent.click(screen.getByRole("button", { name: /LOCK ARCHIVE/ }));
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Archive locked"));
    expect(screen.getByText("FAILED ATTEMPTS: 00")).toBeTruthy();
  });

  it("does not let locking the archive clear an unspent hold", () => {
    const results: AttemptResult[] = [];
    function Probe() {
      const { authenticate, lock, failedAttempts } = useLevel5();
      return (
        <>
          <button onClick={() => results.push(authenticate("wrong"))}>fail</button>
          <button onClick={lock}>lock</button>
          <output>{failedAttempts}</output>
        </>
      );
    }
    render(
      <Level5Provider>
        <Probe />
      </Level5Provider>
    );

    const fail = screen.getByRole("button", { name: "fail" });
    for (let n = 0; n <= FREE_ATTEMPTS; n++) fireEvent.click(fail);
    fireEvent.click(screen.getByRole("button", { name: "lock" }));

    expect(screen.getByRole("status")).toHaveTextContent(String(FREE_ATTEMPTS + 1));
    fireEvent.click(screen.getByRole("button", { name: "fail" }));
    expect(results.at(-1)).toBe("held");
  });
});

describe("the session", () => {
  it("keeps the archive open across classified screens", async () => {
    renderAt("/classified");
    await screen.findByRole("heading", { level: 1 });
    await authenticate();
    await screen.findByText("Project files", {}, { timeout: 8000 });

    fireEvent.click(screen.getByRole("link", { name: /Restricted experiments/ }));
    // No second gate: the register renders straight away.
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Restricted experiments"));
  });

  it("returns to the gate when the archive is locked", async () => {
    renderAt("/classified");
    await screen.findByRole("heading", { level: 1 });
    await authenticate();
    await screen.findByText("Project files", {}, { timeout: 8000 });

    fireEvent.click(screen.getByRole("button", { name: /LOCK ARCHIVE/ }));
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Archive locked"));
    expect(screen.queryByText("Project files")).toBeNull();
    expect(sessionStorage.getItem("ingen.l5.session")).toBeNull();
  });
});

describe("classified data is derived, never authored", () => {
  const classified = loadClassified();
  const archive = loadArchive();

  const exists = (kind: string, id: string) =>
    kind === "specimen"
      ? archive.specimenById.has(id)
      : kind === "person"
        ? archive.personById.has(id)
        : kind === "location"
          ? archive.locationById.has(id)
          : archive.floraById.has(id);

  // The guard that matters. If this ever fails, something in the classified
  // layer is showing a record the archive cannot account for.
  it("resolves every classified record to a record in the open archive", () => {
    const orphans: string[] = [];
    for (const category of classified.categories) {
      for (const record of category.records) {
        if (!exists(record.kind, record.id)) orphans.push(`${category.id}/${record.fileId}`);
      }
    }
    for (const project of classified.projects) {
      for (const member of project.members) {
        if (!exists(member.kind, member.id)) orphans.push(`${project.fileId}/${member.fileId}`);
      }
    }
    expect(orphans, `records with no source: ${orphans.join(", ")}`).toHaveLength(0);
  });

  it("carries the record's own file id, name and status unchanged", () => {
    for (const record of classified.all) {
      if (record.kind !== "specimen") continue;
      const source = archive.specimenById.get(record.id)!;
      expect(record.fileId).toBe(source.fileId);
      expect(record.name).toBe(source.name);
      expect(record.status).toBe(source.status);
    }
  });

  it("fills nothing in: an absent field is marked, not invented", () => {
    const noGenome = classified.categories
      .flatMap((c) => c.records)
      .filter((r) => r.kind === "specimen")
      .filter((r) => archive.specimenById.get(r.id)?.genome == null);

    for (const record of noGenome) {
      expect(record.meta.find((m) => m.label === "Genome")?.value).toBe(NOT_AVAILABLE);
    }
  });

  it("gives every category and programme a non-empty set of real records", () => {
    for (const category of classified.categories) {
      expect(category.records.length, category.label).toBeGreaterThan(0);
    }
    for (const project of classified.projects) {
      expect(project.members.length, project.name).toBeGreaterThan(0);
    }
  });

  it("states its own status from the member records rather than assigning one", () => {
    for (const project of classified.projects) {
      expect(["ACTIVE", "ARCHIVED", "TERMINATED", NOT_AVAILABLE]).toContain(project.status);
    }
  });

  it("links every classified record back to its dossier in the open archive", () => {
    for (const record of classified.all) {
      expect(record.href, record.fileId).toMatch(/^\/(assets|personnel|locations|paleobotany)\/[a-z0-9-]+$/);
    }
  });
});

describe("the classified screens", () => {
  it("filters a register without leaving the classified layer", async () => {
    renderAt("/classified/restricted-experiments");
    await screen.findByRole("heading", { level: 1 });
    await authenticate();
    await screen.findByText(/RECORDS SHOWN/, {}, { timeout: 8000 });

    const total = loadClassified().categoryById.get("restricted-experiments")!.records.length;
    expect(screen.getByText(`${total} OF ${total} RECORDS SHOWN`)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "CRITICAL" }));
    await waitFor(() => expect(screen.getByText(new RegExp(`OF ${total} RECORDS SHOWN`))).toBeTruthy());
  });

  it("says so plainly where the archive holds nothing for a dossier section", async () => {
    renderAt("/classified/project/hybrid-asset-series");
    await screen.findByRole("heading", { level: 1 });
    await authenticate();
    await screen.findByRole("tablist", {}, { timeout: 8000 });

    fireEvent.click(screen.getByRole("tab", { name: "Operations" }));
    const panel = await screen.findByRole("tabpanel");
    expect(within(panel).getByText(NOT_AVAILABLE)).toBeTruthy();
  });

  it("shows the designed empty state rather than nothing at all", async () => {
    renderAt("/classified/no-such-register");
    await screen.findByRole("heading", { level: 1 });
    await authenticate();
    expect(await screen.findByText("No records found", {}, { timeout: 8000 })).toBeTruthy();
    expect(screen.getByText("ACCESS LEVEL: LEVEL 5")).toBeTruthy();
  });
});

describe("the open archive is untouched", () => {
  it("still renders its divisions, with Level 5 alongside them", async () => {
    renderAt("/dashboard");
    const nav = await screen.findByRole("navigation", { name: "Primary" });
    for (const label of ["Genetic assets", "Paleobotany", "Personnel", "Locations"]) {
      expect(within(nav).getByRole("link", { name: new RegExp(label, "i") })).toBeTruthy();
    }
    const level5 = within(nav).getByRole("link", { name: /Level 5/i });
    expect(level5.getAttribute("href")).toBe("/classified");
  });
});
