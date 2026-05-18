/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import type { CollectionGameEntry } from "./collection.types";
import { CollectionProgress } from "./collection-progress";

const gameNames = [
  "7 Wonders (Second Edition)",
  "Arcs",
  "Ark Nova",
  "Azul",
  "Brass: Birmingham",
  "Carcassonne",
  "Codenames",
  "Cosmic Encounter",
  "Cyclades",
  "Decrypto",
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

const collectionStatuses: CollectionGameEntry["status"][] = [
  "added",
  "failed",
  "already_owned",
  "pending",
  "skipped",
];

function makeGames(count: number): CollectionGameEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    bggId: 100000 + i,
    name: gameNames[i % gameNames.length],
    status: collectionStatuses[i % collectionStatuses.length],
  }));
}

describe("CollectionProgress", () => {
  afterEach(() => cleanup());

  const defaultProps = {
    phase: "done",
    progress: { current: 0, total: 0 },
    error: null,
    summary: null,
  };

  it("renders without crashing with 200 entries", () => {
    const games = makeGames(200);
    render(<CollectionProgress {...defaultProps} games={games} />);
    expect(screen.getByText("Results")).toBeDefined();
  });

  it("shows first page of 50 rows by default", () => {
    const games = makeGames(120);
    render(<CollectionProgress {...defaultProps} games={games} />);
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBe(51);
    expect(screen.getByText("Page 1 of 3")).toBeDefined();
  });

  it("filters by text search on game name", async () => {
    const user = userEvent.setup();
    const games = makeGames(100);
    render(<CollectionProgress {...defaultProps} games={games} />);

    const searchInput = screen.getByPlaceholderText("Search games...");
    await user.type(searchInput, "Pandemic");

    const rows = screen.getAllByRole("row");
    for (const row of rows.slice(1)) {
      const text = row.textContent?.toLowerCase() ?? "";
      expect(text).toContain("pandemic");
    }
  });

  it("searches by BGG ID", async () => {
    const user = userEvent.setup();
    const games: CollectionGameEntry[] = [
      { bggId: 99999, name: "Unique ID Game", status: "added" },
      { bggId: 11111, name: "Other Game", status: "added" },
    ];
    render(<CollectionProgress {...defaultProps} games={games} />);

    const searchInput = screen.getByPlaceholderText("Search games...");
    await user.type(searchInput, "99999");

    const rows = screen.getAllByRole("row");
    expect(rows.length).toBe(2);
    expect(screen.getByText("Unique ID Game")).toBeDefined();
  });

  it("shows empty state when search matches nothing", async () => {
    const user = userEvent.setup();
    const games: CollectionGameEntry[] = [
      { bggId: 1, name: "Catan", status: "added" },
    ];
    render(<CollectionProgress {...defaultProps} games={games} />);

    const searchInput = screen.getByPlaceholderText("Search games...");
    await user.type(searchInput, "zzzznonexistent");

    expect(screen.getByText("No results.")).toBeDefined();
  });

  it("renders search input and status select", () => {
    const games = makeGames(5);
    render(<CollectionProgress {...defaultProps} games={games} />);

    expect(screen.getByPlaceholderText("Search games...")).toBeDefined();
    expect(screen.getByRole("combobox")).toBeDefined();
    expect(screen.getByText("All statuses")).toBeDefined();
  });

  it("handles large dataset without error", () => {
    const games = makeGames(500);
    render(<CollectionProgress {...defaultProps} games={games} />);
    expect(screen.getByText("Page 1 of 10")).toBeDefined();
    expect(screen.getAllByRole("row").length).toBe(51);
  });

  it("displays progress bar when adding", () => {
    const games = makeGames(10);
    render(
      <CollectionProgress
        games={games}
        phase="adding"
        progress={{ current: 5, total: 10 }}
        error={null}
        summary={null}
      />,
    );
    expect(screen.getByText("Adding games (5/10)")).toBeDefined();
    expect(screen.getByText("50%")).toBeDefined();
  });
});
