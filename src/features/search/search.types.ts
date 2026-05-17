import z from "zod";
import { bggGameDetailSchema } from "~/lib/bgg-api";

export const searchStatusSchema = z.literal([
  "pending",
  "searching",
  "found",
  "ambiguous",
  "not_found",
  "skipped",
]);

export type SearchStatus = z.infer<typeof searchStatusSchema>;

export const searchResultEntrySchema = z.object({
  inputName: z.string(),
  status: searchStatusSchema,
  bggId: z.number().nullable(),
  matchedName: z.string().nullable(),
  candidates: z.array(bggGameDetailSchema),
});

export type SearchResultEntry = z.infer<typeof searchResultEntrySchema>;

export const searchStreamEventSchema = z.object({
  type: z.literal(["result", "rate_limited", "error", "done"]),
  index: z.number().optional(),
  entry: searchResultEntrySchema.optional(),
  retryIn: z.number().optional(),
  message: z.string().optional(),
});

export type SearchStreamEvent = z.infer<typeof searchStreamEventSchema>;
