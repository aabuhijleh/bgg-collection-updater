/**
 * @vitest-environment happy-dom
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
    thumbnail: null,
    yearPublished: null,
    candidates: [],
  }));
}

function makeEntry(
  overrides: Partial<SearchResultEntry> & { inputName: string },
): SearchResultEntry {
  return {
    status: "pending",
    bggId: null,
    matchedName: null,
    thumbnail: null,
    yearPublished: null,
    candidates: [],
    ...overrides,
  };
}

describe("SearchResultsTable", () => {
  afterEach(() => cleanup());

  const defaultProps = {
    onResolve: vi.fn(),
    onSkip: vi.fn(),
    onRemove: vi.fn(),
    onAddToCollection: vi.fn(),
    onCancelSearch: vi.fn(),
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

    const searchInput = screen.getByPlaceholderText(
      "Search names, BGG matches...",
    );
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
      makeEntry({
        inputName: "Settlers",
        status: "found",
        bggId: 13,
        matchedName: "Catan",
      }),
    ];
    render(<SearchResultsTable {...defaultProps} results={results} />);

    const searchInput = screen.getByPlaceholderText(
      "Search names, BGG matches...",
    );
    await user.type(searchInput, "Catan");

    expect(screen.getAllByRole("row").length).toBe(2);
    expect(screen.getByText("Settlers")).toBeDefined();
  });

  it("shows empty state when search matches nothing", async () => {
    const user = userEvent.setup();
    const results: SearchResultEntry[] = [
      makeEntry({
        inputName: "Catan",
        status: "found",
        bggId: 13,
        matchedName: "Catan",
      }),
    ];
    render(<SearchResultsTable {...defaultProps} results={results} />);

    const searchInput = screen.getByPlaceholderText(
      "Search names, BGG matches...",
    );
    await user.type(searchInput, "zzzznonexistent");

    expect(screen.getByText("No results.")).toBeDefined();
  });

  it("renders search input and status select", () => {
    const results = makeResults(5);
    render(<SearchResultsTable {...defaultProps} results={results} />);

    expect(
      screen.getByPlaceholderText("Search names, BGG matches..."),
    ).toBeDefined();
    expect(screen.getByRole("combobox")).toBeDefined();
    expect(screen.getByText("All")).toBeDefined();
  });

  it("shows correct status counts in badges", () => {
    const results: SearchResultEntry[] = [
      makeEntry({
        inputName: "A",
        status: "found",
        bggId: 1000,
        matchedName: "A",
      }),
      makeEntry({
        inputName: "B",
        status: "found",
        bggId: 2000,
        matchedName: "B",
      }),
      makeEntry({
        inputName: "C",
        status: "not_found",
      }),
      makeEntry({
        inputName: "D",
        status: "ambiguous",
      }),
    ];
    render(<SearchResultsTable {...defaultProps} results={results} />);

    expect(
      screen.getByText((_, el) => el?.textContent === "2 found"),
    ).toBeDefined();
    expect(screen.getByText("Add to Collection (2)")).toBeDefined();
    expect(
      screen.getByText((_, el) => el?.textContent === "4 scanned"),
    ).toBeDefined();
  });

  it("handles large dataset without error", () => {
    const results = makeResults(500);
    render(<SearchResultsTable {...defaultProps} results={results} />);
    expect(screen.getByText("Page 1 of 10")).toBeDefined();
    expect(screen.getAllByRole("row").length).toBe(51);
  });

  describe("pagination stability on data updates", () => {
    it("stays on page 2 when a row status updates", async () => {
      const user = userEvent.setup();
      const results = makeResults(120);
      const { rerender } = render(
        <SearchResultsTable {...defaultProps} results={results} isSearching />,
      );

      const nextButton = screen.getByRole("button", { name: "Next page" });
      await user.click(nextButton);
      expect(screen.getByText("Page 2 of 3")).toBeDefined();

      const updated = results.map((r, i) =>
        i === 60
          ? {
              ...r,
              status: "found" as const,
              bggId: 99999,
              matchedName: "Updated Game",
            }
          : r,
      );
      rerender(
        <SearchResultsTable {...defaultProps} results={updated} isSearching />,
      );

      expect(screen.getByText("Page 2 of 3")).toBeDefined();
    });

    it("stays on page 2 across multiple rapid status updates", async () => {
      const user = userEvent.setup();
      const results = makeResults(120);
      const { rerender } = render(
        <SearchResultsTable {...defaultProps} results={results} isSearching />,
      );

      const nextButton = screen.getByRole("button", { name: "Next page" });
      await user.click(nextButton);
      expect(screen.getByText("Page 2 of 3")).toBeDefined();

      for (let update = 0; update < 5; update++) {
        const updated = results.map((r, i) =>
          i === update
            ? {
                ...r,
                status: "found" as const,
                bggId: 90000 + update,
                matchedName: `Game ${update}`,
              }
            : r,
        );
        rerender(
          <SearchResultsTable
            {...defaultProps}
            results={updated}
            isSearching
          />,
        );
      }

      expect(screen.getByText("Page 2 of 3")).toBeDefined();
    });
  });

  it("filters the entire dataset when searching from page 2", async () => {
    const user = userEvent.setup();
    const results = makeResults(120);
    render(<SearchResultsTable {...defaultProps} results={results} />);

    const nextButton = screen.getByRole("button", { name: "Next page" });
    await user.click(nextButton);
    expect(screen.getByText("Page 2 of 3")).toBeDefined();

    const searchInput = screen.getByPlaceholderText(
      "Search names, BGG matches...",
    );
    await user.type(searchInput, "Azul");

    const dataRows = screen.getAllByRole("row").slice(1);
    expect(dataRows.length).toBeGreaterThan(0);
    for (const row of dataRows) {
      expect(row.textContent?.toLowerCase()).toContain("azul");
    }
  });

  describe("search progress bar", () => {
    it("shows progress bar when isSearching is true", () => {
      const results: SearchResultEntry[] = [
        makeEntry({
          inputName: "Catan",
          status: "found",
          bggId: 13,
          matchedName: "Catan",
        }),
        makeEntry({
          inputName: "Pandemic",
          status: "pending",
        }),
      ];
      render(
        <SearchResultsTable {...defaultProps} results={results} isSearching />,
      );

      expect(screen.getByText("50%")).toBeDefined();
      expect(screen.getByRole("progressbar")).toBeDefined();
    });

    it("hides progress bar when isSearching is false", () => {
      const results: SearchResultEntry[] = [
        makeEntry({
          inputName: "Catan",
          status: "found",
          bggId: 13,
          matchedName: "Catan",
        }),
      ];
      render(
        <SearchResultsTable
          {...defaultProps}
          results={results}
          isSearching={false}
        />,
      );

      expect(screen.queryByRole("progressbar")).toBeNull();
    });

    it("counts only fully resolved results as completed", () => {
      const results: SearchResultEntry[] = [
        makeEntry({
          inputName: "A",
          status: "found",
          bggId: 1,
          matchedName: "A",
        }),
        makeEntry({ inputName: "B", status: "not_found" }),
        makeEntry({ inputName: "C", status: "searching" }),
        makeEntry({ inputName: "D", status: "pending" }),
      ];
      render(
        <SearchResultsTable {...defaultProps} results={results} isSearching />,
      );

      expect(screen.getByText("50%")).toBeDefined();
    });

    it("shows 100% when all results are resolved while still searching", () => {
      const results: SearchResultEntry[] = [
        makeEntry({
          inputName: "A",
          status: "found",
          bggId: 1,
          matchedName: "A",
        }),
        makeEntry({ inputName: "B", status: "ambiguous" }),
        makeEntry({ inputName: "C", status: "not_found" }),
      ];
      render(
        <SearchResultsTable {...defaultProps} results={results} isSearching />,
      );

      expect(screen.getByText("100%")).toBeDefined();
    });
  });
});
