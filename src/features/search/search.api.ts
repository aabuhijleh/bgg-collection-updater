import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import {
  type BggGameDetail,
  fetchGameDetails,
  fetchSearchResults,
  findBestMatch,
  parseSearchXml,
  parseThingXml,
  RateLimitError,
} from "~/lib/bgg-api";
import type { SearchResultEntry } from "./search.types";

const searchInputSchema = z.object({
  name: z.string(),
  token: z.string(),
  includeExpansions: z.boolean(),
});

export const searchSingleGame = createServerFn({ method: "POST" })
  .inputValidator(searchInputSchema)
  .handler(async ({ data }): Promise<SearchResultEntry> => {
    const xml = await fetchSearchResults(
      data.name,
      data.token,
      data.includeExpansions,
    );
    const items = parseSearchXml(xml);
    const match = findBestMatch(data.name, items);

    if (match.status === "found") {
      return {
        inputName: data.name,
        status: "found",
        bggId: match.id,
        matchedName: match.name,
        candidates: [],
      };
    }

    if (match.status === "not_found") {
      return {
        inputName: data.name,
        status: "not_found",
        bggId: null,
        matchedName: null,
        candidates: [],
      };
    }

    let candidates: BggGameDetail[] = [];
    try {
      const detailXml = await fetchGameDetails(
        match.candidateIds.slice(0, 20),
        data.token,
      );
      candidates = parseThingXml(detailXml);
      candidates.sort((a, b) => b.totalVotes - a.totalVotes);
    } catch (err) {
      if (err instanceof RateLimitError) throw err;
    }

    return {
      inputName: data.name,
      status: "ambiguous",
      bggId: null,
      matchedName: null,
      candidates,
    };
  });
