import z from "zod";

export const collectionGameStatusSchema = z.literal([
  "pending",
  "adding",
  "added",
  "failed",
  "already_owned",
  "skipped",
]);

export type CollectionGameStatus = z.infer<typeof collectionGameStatusSchema>;

export const collectionGameEntrySchema = z.object({
  bggId: z.number(),
  name: z.string().nullable(),
  status: collectionGameStatusSchema,
});

export type CollectionGameEntry = z.infer<typeof collectionGameEntrySchema>;

export const collectionStreamEventSchema = z.object({
  type: z.literal([
    "login",
    "login_failed",
    "collection_scanned",
    "game_adding",
    "game_added",
    "game_failed",
    "game_already_owned",
    "done",
    "error",
  ]),
  bggId: z.number().optional(),
  title: z.string().optional(),
  message: z.string().optional(),
  existingCount: z.number().optional(),
  newCount: z.number().optional(),
  totalAdded: z.number().optional(),
  totalFailed: z.number().optional(),
});

export type CollectionStreamEvent = z.infer<typeof collectionStreamEventSchema>;
