/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SearchResultEntry } from "./search.types";
import { SearchResultsTable } from "./search-results-table";

const gameNames = [
  "7 Wonders (Second Edition)",
  "7 Wonders Duel",
  "878 Vikings: Invasions of England",
  "Air, Land, & Sea",
  "Android: Netrunner",
  "Arcs",
  "Ark Nova",
  "Arkham Horror: The Card Game",
  "Azul",
  "Betrayal at House on the Hill",
  "Brass: Birmingham",
  "Carcassonne",
  "Clank!: A Deck-Building Adventure",
  "Cockroach Poker",
  "Codenames",
  "Cosmic Encounter",
  "Coup",
  "Cyclades",
  "Decrypto",
  "Deep Sea Adventure",
  "Dixit",
  "Dominion",
  "Dune: Imperium",
  "Earth",
  "Everdell",
  "Hanabi",
  "Heat: Pedal to the Metal",
  "Inis",
  "Just One",
  "Kemet",
  "King of Tokyo",
  "KLASK",
  "Lisboa",
  "Lost Ruins of Arnak",
  "Love Letter",
  "Nemesis",
  "Oath",
  "Pandemic",
  "Patchwork",
  "Planet Unknown",
  "Power Grid",
  "Ra",
  "Radlands",
  "Root",
  "SCOUT",
  "Scythe",
  "Secret Hitler",
  "Skull",
  "Sky Team",
  "Spirit Island",
  "Star Realms",
  "Terraforming Mars",
  "Ticket to Ride: Europe",
  "Trio",
  "Viticulture",
  "Watergate",
  "Wavelength",
  "Wyrmspan",
];

const statuses: SearchResultEntry["status"][] = [
  "found",
  "not_found",
  "ambiguous",
  "skipped",
];

function makeResults(count: number): SearchResultEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    inputName: gameNames[i % gameNames.length],
    status: statuses[i % statuses.length],
    bggId: i % statuses.length === 0 ? 100000 + i : null,
    matchedName:
      i % statuses.length === 0 ? gameNames[i % gameNames.length] : null,
    candidates: [],
  }));
}

describe("SearchResultsTable", () => {
  afterEach(() => cleanup());

  const defaultProps = {
    onResolve: vi.fn(),
    onSkip: vi.fn(),
    onAddToCollection: vi.fn(),
    isSearching: false,
  };

  it("renders without crashing with 200 entries", () => {
    const results = makeResults(200);
    render(<SearchResultsTable {...defaultProps} results={results} />);
    expect(screen.getByText("Search Results")).toBeDefined();
  });

  it("shows first page of 50 rows by default", () => {
    const results = makeResults(120);
    render(<SearchResultsTable {...defaultProps} results={results} />);
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBe(51);
    expect(screen.getByText("Page 1 of 3")).toBeDefined();
  });

  it("filters by text search on input name", async () => {
    const user = userEvent.setup();
    const results = makeResults(100);
    render(<SearchResultsTable {...defaultProps} results={results} />);

    const searchInput = screen.getByPlaceholderText("Search games...");
    await user.type(searchInput, "Pandemic");

    const rows = screen.getAllByRole("row");
    for (const row of rows.slice(1)) {
      const text = row.textContent?.toLowerCase() ?? "";
      expect(text).toContain("pandemic");
    }
  });

  it("searches across matched name too", async () => {
    const user = userEvent.setup();
    const results: SearchResultEntry[] = [
      {
        inputName: "Settlers",
        status: "found",
        bggId: 13,
        matchedName: "Catan",
        candidates: [],
      },
    ];
    render(<SearchResultsTable {...defaultProps} results={results} />);

    const searchInput = screen.getByPlaceholderText("Search games...");
    await user.type(searchInput, "Catan");

    expect(screen.getAllByRole("row").length).toBe(2);
    expect(screen.getByText("Settlers")).toBeDefined();
  });

  it("shows empty state when search matches nothing", async () => {
    const user = userEvent.setup();
    const results: SearchResultEntry[] = [
      {
        inputName: "Catan",
        status: "found",
        bggId: 13,
        matchedName: "Catan",
        candidates: [],
      },
    ];
    render(<SearchResultsTable {...defaultProps} results={results} />);

    const searchInput = screen.getByPlaceholderText("Search games...");
    await user.type(searchInput, "zzzznonexistent");

    expect(screen.getByText("No results.")).toBeDefined();
  });

  it("renders search input and status select", () => {
    const results = makeResults(5);
    render(<SearchResultsTable {...defaultProps} results={results} />);

    expect(screen.getByPlaceholderText("Search games...")).toBeDefined();
    expect(screen.getByRole("combobox")).toBeDefined();
    expect(screen.getByText("All statuses")).toBeDefined();
  });

  it("shows correct status counts in summary", () => {
    const results: SearchResultEntry[] = [
      {
        inputName: "A",
        status: "found",
        bggId: 1000,
        matchedName: "A",
        candidates: [],
      },
      {
        inputName: "B",
        status: "found",
        bggId: 2000,
        matchedName: "B",
        candidates: [],
      },
      {
        inputName: "C",
        status: "not_found",
        bggId: null,
        matchedName: null,
        candidates: [],
      },
      {
        inputName: "D",
        status: "ambiguous",
        bggId: null,
        matchedName: null,
        candidates: [],
      },
    ];
    render(<SearchResultsTable {...defaultProps} results={results} />);

    expect(
      screen.getByText((_, el) => el?.textContent === "2 found"),
    ).toBeDefined();
    expect(screen.getByText("Add to Collection (2)")).toBeDefined();
  });

  it("handles large dataset without error", () => {
    const results = makeResults(500);
    render(<SearchResultsTable {...defaultProps} results={results} />);
    expect(screen.getByText("Page 1 of 10")).toBeDefined();
    expect(screen.getAllByRole("row").length).toBe(51);
  });
});
