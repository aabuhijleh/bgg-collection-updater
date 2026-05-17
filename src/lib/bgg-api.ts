import z from "zod";

export const bggSearchItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  yearPublished: z.number().nullable(),
});

export type BggSearchItem = z.infer<typeof bggSearchItemSchema>;

export const bggGameDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  thumbnail: z.string(),
  yearPublished: z.number().nullable(),
  alternateNames: z.array(z.string()),
  totalVotes: z.number(),
});

export type BggGameDetail = z.infer<typeof bggGameDetailSchema>;

export const matchResultSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("found"), id: z.number(), name: z.string() }),
  z.object({ status: z.literal("not_found") }),
  z.object({
    status: z.literal("ambiguous"),
    candidateIds: z.array(z.number()),
  }),
]);

export type MatchResult = z.infer<typeof matchResultSchema>;

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function getAttr(tag: string, attr: string): string | null {
  const re = new RegExp(`${attr}="([^"]*)"`, "i");
  const match = tag.match(re);
  return match ? decodeXmlEntities(match[1]) : null;
}

function getTextContent(xml: string, tagName: string): string {
  const re = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, "i");
  const match = xml.match(re);
  return match ? decodeXmlEntities(match[1].trim()) : "";
}

export function parseSearchXml(xml: string): BggSearchItem[] {
  const itemRegex = /<item\s[^>]*type="boardgame[^"]*"[^>]*>[\s\S]*?<\/item>/gi;
  const matches = [...xml.matchAll(itemRegex)];

  return matches.flatMap((m) => {
    const itemTag = m[0];
    const idMatch = itemTag.match(/id="(\d+)"/);
    if (!idMatch) return [];

    const id = Number(idMatch[1]);
    const nameValue = getAttr(itemTag.match(/<name[^>]*>/)?.[0] ?? "", "value");
    const yearValue = getAttr(
      itemTag.match(/<yearpublished[^>]*\/?>/)?.[0] ?? "",
      "value",
    );

    return [
      {
        id,
        name: nameValue ?? "",
        yearPublished: yearValue ? Number(yearValue) : null,
      },
    ];
  });
}

export function parseThingXml(xml: string): BggGameDetail[] {
  const itemRegex = /<item\s[^>]*type="boardgame[^"]*"[^>]*>[\s\S]*?<\/item>/gi;
  const matches = [...xml.matchAll(itemRegex)];

  return matches.flatMap((m) => {
    const itemTag = m[0];
    const idMatch = itemTag.match(/id="(\d+)"/);
    if (!idMatch) return [];

    const id = Number(idMatch[1]);

    const primaryNameMatch = itemTag.match(
      /<name\s+type="primary"[^>]*value="([^"]*)"[^>]*\/?>/,
    );
    const primaryName = primaryNameMatch
      ? decodeXmlEntities(primaryNameMatch[1])
      : "";

    const thumbnail = getTextContent(itemTag, "thumbnail");

    const yearMatch = itemTag.match(
      /<yearpublished[^>]*value="([^"]*)"[^>]*\/?>/,
    );
    const yearPublished = yearMatch ? Number(yearMatch[1]) : null;

    const altNameRegex =
      /<name\s+type="alternate"[^>]*value="([^"]*)"[^>]*\/?>/gi;
    const alternateNames = [...itemTag.matchAll(altNameRegex)].map((alt) =>
      decodeXmlEntities(alt[1]),
    );

    const pollMatch = itemTag.match(
      /<poll\s+name="suggested_numplayers"[^>]*totalvotes="(\d+)"/,
    );
    const totalVotes = pollMatch ? Number(pollMatch[1]) : 0;

    return [
      {
        id,
        name: primaryName,
        thumbnail,
        yearPublished,
        alternateNames,
        totalVotes,
      },
    ];
  });
}

export function findBestMatch(
  searchName: string,
  items: BggSearchItem[],
): MatchResult {
  if (items.length === 0) return { status: "not_found" };
  if (items.length === 1)
    return { status: "found", id: items[0].id, name: items[0].name };

  const exactMatches = items.filter(
    (item) => item.name.toLowerCase() === searchName.toLowerCase(),
  );

  if (exactMatches.length === 1) {
    return {
      status: "found",
      id: exactMatches[0].id,
      name: exactMatches[0].name,
    };
  }

  const candidateIds =
    exactMatches.length > 0
      ? exactMatches.map((item) => item.id)
      : items.slice(0, 20).map((item) => item.id);

  return { status: "ambiguous", candidateIds };
}

const BGG_API_BASE = "https://boardgamegeek.com/xmlapi2";

export async function fetchSearchResults(
  query: string,
  token: string,
  includeExpansions: boolean,
): Promise<string> {
  const type = includeExpansions ? "boardgame,boardgameexpansion" : "boardgame";
  const params = new URLSearchParams({ query, type });
  const response = await fetch(`${BGG_API_BASE}/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 429) {
    throw new RateLimitError();
  }
  if (!response.ok) {
    throw new Error(`BGG API error: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

export async function fetchGameDetails(
  ids: number[],
  token: string,
): Promise<string> {
  const type = "boardgame,boardgameexpansion";
  const params = new URLSearchParams({ id: ids.join(","), type });
  const response = await fetch(`${BGG_API_BASE}/thing?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 429) {
    throw new RateLimitError();
  }
  if (!response.ok) {
    throw new Error(`BGG API error: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

export class RateLimitError extends Error {
  constructor() {
    super("Rate limited by BGG API (429)");
    this.name = "RateLimitError";
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
