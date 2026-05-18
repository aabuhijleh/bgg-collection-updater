import z from "zod";

export const bggGameDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  thumbnail: z.string(),
  yearPublished: z.number().nullable(),
  alternateNames: z.array(z.string()),
  totalVotes: z.number(),
});

export type BggGameDetail = z.infer<typeof bggGameDetailSchema>;

const matchResultSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("found"), id: z.number(), name: z.string() }),
  z.object({ status: z.literal("not_found") }),
  z.object({
    status: z.literal("ambiguous"),
    candidateIds: z.array(z.number()),
  }),
]);

export type MatchResult = z.infer<typeof matchResultSchema>;

const BGG_SCAN_API = "https://bgg-scan.aabuhijleh.com/api/bgg";

export class RateLimitError extends Error {
  constructor() {
    super("Rate limited by BGG API");
    this.name = "RateLimitError";
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function searchGame(name: string): Promise<MatchResult> {
  const params = new URLSearchParams({ name });
  const response = await fetch(`${BGG_SCAN_API}/search?${params}`);

  if (response.status === 429) throw new RateLimitError();
  if (!response.ok) throw new Error(`BGG search failed: ${response.status}`);

  return matchResultSchema.parse(await response.json());
}

export async function fetchGameDetails(
  ids: number[],
): Promise<BggGameDetail[]> {
  const params = new URLSearchParams({ ids: ids.join(",") });
  const response = await fetch(`${BGG_SCAN_API}/details?${params}`);

  if (response.status === 429) throw new RateLimitError();
  if (!response.ok) throw new Error(`BGG details failed: ${response.status}`);

  return z.array(bggGameDetailSchema).parse(await response.json());
}
