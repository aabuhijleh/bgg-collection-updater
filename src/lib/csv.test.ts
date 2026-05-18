import { describe, expect, it } from "vitest";
import {
  generateCollectionCsv,
  generateCsv,
  parseIds,
  parseInput,
} from "~/lib/csv";

describe("parseInput", () => {
  it("parses semicolon-separated values", () => {
    expect(parseInput("Catan; Wingspan; Azul")).toEqual([
      "Catan",
      "Wingspan",
      "Azul",
    ]);
  });

  it("parses newline-separated values", () => {
    expect(parseInput("Catan\nWingspan\nAzul")).toEqual([
      "Catan",
      "Wingspan",
      "Azul",
    ]);
  });

  it("parses comma-separated values", () => {
    expect(parseInput("Catan, Wingspan, Azul")).toEqual([
      "Catan",
      "Wingspan",
      "Azul",
    ]);
  });

  it("deduplicates entries", () => {
    expect(parseInput("Catan; Catan; Azul")).toEqual(["Catan", "Azul"]);
  });

  it("trims whitespace and removes empty entries", () => {
    expect(parseInput("  Catan ;; Azul ; ")).toEqual(["Catan", "Azul"]);
  });

  it("strips surrounding quotes", () => {
    expect(parseInput('"Catan"; "Wingspan"')).toEqual(["Catan", "Wingspan"]);
  });

  it("handles mixed delimiters by choosing the most common", () => {
    expect(parseInput("Catan; Wingspan; Azul; Root")).toEqual([
      "Catan",
      "Wingspan",
      "Azul",
      "Root",
    ]);
  });

  it("returns empty array for empty input", () => {
    expect(parseInput("")).toEqual([]);
    expect(parseInput("   ")).toEqual([]);
  });
});

describe("parseIds", () => {
  it("extracts IDs from CSV with header", () => {
    expect(parseIds("name,bgg_id\nDecrypto,225694\nSky Team,373106")).toEqual([
      225694, 373106,
    ]);
  });

  it("extracts plain semicolon-separated IDs", () => {
    expect(parseIds("225694; 373106; 13")).toEqual([225694, 373106, 13]);
  });

  it("extracts newline-separated IDs", () => {
    expect(parseIds("225694\n373106")).toEqual([225694, 373106]);
  });

  it("ignores non-numeric values", () => {
    expect(parseIds("name,bgg_id\nDecrypto,225694")).toEqual([225694]);
  });

  it("deduplicates IDs", () => {
    expect(parseIds("225694; 225694; 13")).toEqual([225694, 13]);
  });

  it("extracts only BGG ID column from multi-column CSV with header", () => {
    expect(
      parseIds(
        "Barcode,Product Title,BGG ID,BGG Name,Year Published,BGG URL\n3558380020400,SKULL,92415,Skull,2011,https://boardgamegeek.com/boardgame/92415",
      ),
    ).toEqual([92415]);
  });

  it("extracts bgg_id column from search phase CSV output", () => {
    expect(parseIds("name,bgg_id\nDecrypto,225694\nSky Team,373106")).toEqual([
      225694, 373106,
    ]);
  });

  it("extracts only bgg_id column when other numeric columns exist", () => {
    expect(
      parseIds("rank,name,bgg_id,year\n1,Brass Birmingham,224517,2018"),
    ).toEqual([224517]);
  });

  it("returns empty for empty input", () => {
    expect(parseIds("")).toEqual([]);
  });
});

describe("generateCsv", () => {
  it("generates CSV with name and bgg_id columns", () => {
    const rows = [
      { name: "Catan", bggId: 13 },
      { name: "Wingspan", bggId: 266192 },
    ];
    expect(generateCsv(rows)).toBe("name,bgg_id\nCatan,13\nWingspan,266192");
  });

  it("handles empty array", () => {
    expect(generateCsv([])).toBe("name,bgg_id");
  });

  it("escapes commas in names", () => {
    const rows = [{ name: "Catan: Seafarers, Expansion", bggId: 325 }];
    expect(generateCsv(rows)).toBe(
      'name,bgg_id\n"Catan: Seafarers, Expansion",325',
    );
  });
});

describe("generateCollectionCsv", () => {
  it("generates CSV with name, bgg_id, and status columns", () => {
    const rows = [
      { name: "Catan", bggId: 13, status: "added" },
      { name: "Wingspan", bggId: 266192, status: "failed" },
    ];
    expect(generateCollectionCsv(rows)).toBe(
      "name,bgg_id,status\nCatan,13,added\nWingspan,266192,failed",
    );
  });

  it("handles null names", () => {
    const rows = [{ name: null, bggId: 13, status: "added" }];
    expect(generateCollectionCsv(rows)).toBe("name,bgg_id,status\n,13,added");
  });

  it("handles empty array", () => {
    expect(generateCollectionCsv([])).toBe("name,bgg_id,status");
  });

  it("escapes commas in names", () => {
    const rows = [
      {
        name: "Catan: Seafarers, Expansion",
        bggId: 325,
        status: "already_owned",
      },
    ];
    expect(generateCollectionCsv(rows)).toBe(
      'name,bgg_id,status\n"Catan: Seafarers, Expansion",325,already_owned',
    );
  });
});
