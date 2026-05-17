import { createFileRoute } from "@tanstack/react-router";
import { searchSingleGame } from "~/features/search/search.api";
import type { SearchStreamEvent } from "~/features/search/search.types";
import { delay, RateLimitError } from "~/lib/bgg-api";

export const Route = createFileRoute("/api/search")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json();
        const { names, token, includeExpansions } = body as {
          names: string[];
          token: string;
          includeExpansions: boolean;
        };

        const stream = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();
            const send = (event: SearchStreamEvent) => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
              );
            };

            for (let i = 0; i < names.length; i++) {
              let retries = 0;
              const maxRetries = 3;

              while (retries <= maxRetries) {
                try {
                  const entry = await searchSingleGame({
                    data: { name: names[i], token, includeExpansions },
                  });
                  send({ type: "result", index: i, entry });
                  break;
                } catch (err) {
                  if (err instanceof RateLimitError && retries < maxRetries) {
                    send({ type: "rate_limited", retryIn: 30 });
                    await delay(30_000);
                    retries++;
                  } else {
                    send({
                      type: "result",
                      index: i,
                      entry: {
                        inputName: names[i],
                        status: "not_found",
                        bggId: null,
                        matchedName: null,
                        candidates: [],
                      },
                    });
                    break;
                  }
                }
              }

              if (i < names.length - 1) {
                await delay(750);
              }
            }

            send({ type: "done" });
            controller.close();
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
