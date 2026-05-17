import { createFileRoute } from "@tanstack/react-router";
import type { Browser } from "playwright";
import {
  addGameToCollection,
  createBggSession,
  getExistingCollectionIds,
} from "~/features/collection/collection.server";
import type { CollectionStreamEvent } from "~/features/collection/collection.types";

export const Route = createFileRoute("/api/add-to-collection")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json();
        const { gameIds, username, password } = body as {
          gameIds: number[];
          username: string;
          password: string;
        };

        const stream = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();
            const send = (event: CollectionStreamEvent) => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
              );
            };

            let browser: Browser | undefined;
            try {
              const session = await createBggSession(username, password);
              browser = session.browser;
              const page = session.page;
              send({ type: "login" });

              const existingIds = await getExistingCollectionIds(
                page,
                username,
              );
              const newIds = gameIds.filter((id) => !existingIds.includes(id));
              const alreadyOwnedIds = gameIds.filter((id) =>
                existingIds.includes(id),
              );

              send({
                type: "collection_scanned",
                existingCount: existingIds.length,
                newCount: newIds.length,
              });

              for (const id of alreadyOwnedIds) {
                send({ type: "game_already_owned", bggId: id });
              }

              let totalAdded = 0;
              let totalFailed = 0;

              for (const id of newIds) {
                send({ type: "game_adding", bggId: id });

                try {
                  await page.title();
                } catch {
                  send({
                    type: "error",
                    message: "Browser session closed unexpectedly",
                  });
                  break;
                }

                try {
                  const title = await addGameToCollection(page, id);
                  totalAdded++;
                  send({ type: "game_added", bggId: id, title });
                } catch {
                  totalFailed++;
                  send({ type: "game_failed", bggId: id });
                }
              }

              send({ type: "done", totalAdded, totalFailed });
            } catch (err) {
              send({
                type: "login_failed",
                message: err instanceof Error ? err.message : "Login failed",
              });
            } finally {
              if (browser) await browser.close().catch(() => {});
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      },
    },
  },
});
