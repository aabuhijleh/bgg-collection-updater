import { describe, expect, it } from "vitest";
import {
  type BggSearchItem,
  findBestMatch,
  parseSearchXml,
  parseThingXml,
} from "~/lib/bgg-api";

const SEARCH_XML_SINGLE = `<?xml version="1.0" encoding="utf-8"?>
<items total="1">
  <item type="boardgame" id="13">
    <name type="primary" value="Catan"/>
    <yearpublished value="1995"/>
  </item>
</items>`;

const SEARCH_XML_MULTIPLE = `<?xml version="1.0" encoding="utf-8"?>
<items total="3">
  <item type="boardgame" id="13">
    <name type="primary" value="Catan"/>
    <yearpublished value="1995"/>
  </item>
  <item type="boardgame" id="27710">
    <name type="primary" value="Catan: Cities &amp; Knights"/>
    <yearpublished value="1998"/>
  </item>
  <item type="boardgame" id="926">
    <name type="primary" value="Catan Card Game"/>
    <yearpublished value="1996"/>
  </item>
</items>`;

const SEARCH_XML_EMPTY = `<?xml version="1.0" encoding="utf-8"?>
<items total="0"></items>`;

const THING_XML = `<?xml version="1.0" encoding="utf-8"?>
<items>
  <item type="boardgame" id="13">
    <thumbnail>https://cf.geekdo-images.com/thumb.jpg</thumbnail>
    <name type="primary" sortindex="1" value="Catan"/>
    <name type="alternate" sortindex="1" value="Settlers of Catan"/>
    <yearpublished value="1995"/>
    <poll name="suggested_numplayers" totalvotes="2345">
    </poll>
  </item>
</items>`;

describe("parseSearchXml", () => {
  it("parses single result", () => {
    const items = parseSearchXml(SEARCH_XML_SINGLE);
    expect(items).toEqual([{ id: 13, name: "Catan", yearPublished: 1995 }]);
  });

  it("parses multiple results", () => {
    const items = parseSearchXml(SEARCH_XML_MULTIPLE);
    expect(items).toHaveLength(3);
    expect(items[0]).toEqual({ id: 13, name: "Catan", yearPublished: 1995 });
  });

  it("parses empty results", () => {
    const items = parseSearchXml(SEARCH_XML_EMPTY);
    expect(items).toEqual([]);
  });
});

describe("parseThingXml", () => {
  it("parses game details", () => {
    const items = parseThingXml(THING_XML);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: 13,
      name: "Catan",
      thumbnail: "https://cf.geekdo-images.com/thumb.jpg",
      yearPublished: 1995,
      alternateNames: ["Settlers of Catan"],
      totalVotes: 2345,
    });
  });
});

describe("findBestMatch", () => {
  it("returns found for single result", () => {
    const items: BggSearchItem[] = [
      { id: 13, name: "Catan", yearPublished: 1995 },
    ];
    const result = findBestMatch("Catan", items);
    expect(result).toEqual({ status: "found", id: 13, name: "Catan" });
  });

  it("returns not_found for empty results", () => {
    const result = findBestMatch("xyznonexistent", []);
    expect(result).toEqual({ status: "not_found" });
  });

  it("returns found for single exact case-insensitive match among many", () => {
    const items: BggSearchItem[] = [
      { id: 13, name: "Catan", yearPublished: 1995 },
      { id: 27710, name: "Catan: Cities & Knights", yearPublished: 1998 },
      { id: 926, name: "Catan Card Game", yearPublished: 1996 },
    ];
    const result = findBestMatch("catan", items);
    expect(result).toEqual({ status: "found", id: 13, name: "Catan" });
  });

  it("returns ambiguous when multiple exact matches exist", () => {
    const items: BggSearchItem[] = [
      { id: 13, name: "Catan", yearPublished: 1995 },
      { id: 99, name: "Catan", yearPublished: 2020 },
    ];
    const result = findBestMatch("Catan", items);
    expect(result.status).toBe("ambiguous");
    if (result.status === "ambiguous") {
      expect(result.candidateIds).toEqual([13, 99]);
    }
  });

  it("returns ambiguous when no exact match among multiple results", () => {
    const items: BggSearchItem[] = [
      { id: 27710, name: "Catan: Cities & Knights", yearPublished: 1998 },
      { id: 926, name: "Catan Card Game", yearPublished: 1996 },
    ];
    const result = findBestMatch("Catan", items);
    expect(result.status).toBe("ambiguous");
    if (result.status === "ambiguous") {
      expect(result.candidateIds).toEqual([27710, 926]);
    }
  });
});
