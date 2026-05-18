import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import {
  type BggGameDetail,
  fetchGameDetails,
  RateLimitError,
  searchGame,
} from "~/lib/bgg-api";
import type { SearchResultEntry } from "./search.types";

const searchInputSchema = z.object({
  name: z.string(),
});

export const searchSingleGame = createServerFn({ method: "POST" })
  .inputValidator(searchInputSchema)
  .handler(async ({ data }): Promise<SearchResultEntry> => {
    const match = await searchGame(data.name);

    if (match.status === "found") {
      let thumbnail: string | null = null;
      let yearPublished: number | null = null;
      try {
        const [detail] = await fetchGameDetails([match.id]);
        if (detail) {
          thumbnail = detail.thumbnail;
          yearPublished = detail.yearPublished;
        }
      } catch (err) {
        if (err instanceof RateLimitError) throw err;
      }
      return {
        inputName: data.name,
        status: "found",
        bggId: match.id,
        matchedName: match.name,
        thumbnail,
        yearPublished,
        candidates: [],
      };
    }

    if (match.status === "not_found") {
      return {
        inputName: data.name,
        status: "not_found",
        bggId: null,
        matchedName: null,
        thumbnail: null,
        yearPublished: null,
        candidates: [],
      };
    }

    let candidates: BggGameDetail[] = [];
    try {
      candidates = await fetchGameDetails(match.candidateIds.slice(0, 20));
    } catch (err) {
      if (err instanceof RateLimitError) throw err;
    }

    return {
      inputName: data.name,
      status: "ambiguous",
      bggId: null,
      matchedName: null,
      thumbnail: null,
      yearPublished: null,
      candidates,
    };
  });
