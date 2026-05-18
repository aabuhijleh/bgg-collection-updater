import z from "zod";
import { bggGameDetailSchema } from "~/lib/bgg-api";

export const searchResultEntrySchema = z.object({
  inputName: z.string(),
  status: z.enum([
    "pending",
    "searching",
    "found",
    "ambiguous",
    "not_found",
    "skipped",
  ]),
  bggId: z.number().nullable(),
  matchedName: z.string().nullable(),
  thumbnail: z.string().nullable(),
  yearPublished: z.number().nullable(),
  candidates: z.array(bggGameDetailSchema),
});

export type SearchResultEntry = z.infer<typeof searchResultEntrySchema>;
