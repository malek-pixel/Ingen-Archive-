import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../src/App";
import { loadArchive } from "../src/data/ingen";

const { specimens, personnel } = loadArchive();
const nSpec = specimens.length;
const nPers = personnel.length;

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  window.scrollTo = vi.fn();
});

describe("search, filter and sort wiring", () => {
  it("filters the grid live as the query changes", async () => {
    renderAt("/assets");
    const input = await screen.findByLabelText("Search genetic assets");
    fireEvent.change(input, { target: { value: "blue" } });
    await waitFor(() => expect(screen.getByText(`Showing 1 of ${nSpec} records`)).toBeTruthy());
    expect(screen.getAllByText("Open record")).toHaveLength(1);
  });

  it("shows the designed empty state and recovers via Clear filters", async () => {
    renderAt("/assets");
    const input = await screen.findByLabelText("Search genetic assets");
    fireEvent.change(input, { target: { value: "raptor-omega" } });
    expect(await screen.findByText("No asset matches “raptor-omega”")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters and search" }));
    await waitFor(() => expect(screen.getByText(`Showing all ${nSpec} records`)).toBeTruthy());
  });

  it("applies a status filter chip", async () => {
    renderAt("/assets");
    await screen.findByText(`Showing all ${nSpec} records`);
    fireEvent.click(screen.getByRole("button", { name: /Breached/ }));
    await waitFor(() => expect(screen.getByText(new RegExp(`Showing \\d+ of ${nSpec} records`))).toBeTruthy());
    expect(screen.getByRole("button", { name: /Breached/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("cycles the sort control", async () => {
    renderAt("/assets");
    await screen.findByText(`Showing all ${nSpec} records`);
    const sort = screen.getByRole("button", { name: /Change sort order/ });
    expect(sort).toHaveTextContent("Record ID");
    fireEvent.click(sort);
    await waitFor(() => expect(sort).toHaveTextContent("Threat"));
    fireEvent.click(sort);
    await waitFor(() => expect(sort).toHaveTextContent("Name"));
    fireEvent.click(sort);
    fireEvent.click(sort);
    await waitFor(() => expect(sort).toHaveTextContent("Record ID"));
  });

  it("focuses search on / and clears on Escape", async () => {
    renderAt("/assets");
    const input = (await screen.findByLabelText("Search genetic assets")) as HTMLInputElement;
    fireEvent.keyDown(document, { key: "/" });
    expect(document.activeElement).toBe(input);
    fireEvent.change(input, { target: { value: "blue" } });
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(input.value).toBe(""));
  });

  it("clears the query via the inline clear button", async () => {
    renderAt("/personnel");
    const input = (await screen.findByLabelText("Search personnel")) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "grady" } });
    await waitFor(() => expect(screen.getByText(`Showing 1 of ${nPers} files`)).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    await waitFor(() => expect(screen.getByText(`Showing all ${nPers} files`)).toBeTruthy());
  });

  it("hides the / hint once a query is present", async () => {
    renderAt("/assets");
    const input = await screen.findByLabelText("Search genetic assets");
    expect(screen.getByText("/")).toBeTruthy();
    fireEvent.change(input, { target: { value: "b" } });
    await waitFor(() => expect(screen.queryByText("/")).toBeNull());
  });
});
