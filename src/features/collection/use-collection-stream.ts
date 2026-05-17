import { useState } from "react";
import type {
  CollectionGameEntry,
  CollectionGameStatus,
  CollectionStreamEvent,
} from "./collection.types";

type CollectionPhase =
  | "idle"
  | "connecting"
  | "scanning"
  | "adding"
  | "done"
  | "error";

export function useCollectionStream() {
  const [games, setGames] = useState<CollectionGameEntry[]>([]);
  const [phase, setPhase] = useState<CollectionPhase>("idle");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    added: number;
    failed: number;
  } | null>(null);

  const updateGameStatus = (
    bggId: number,
    status: CollectionGameStatus,
    title?: string,
  ) => {
    setGames((prev) =>
      prev.map((g) =>
        g.bggId === bggId ? { ...g, status, name: title ?? g.name } : g,
      ),
    );
  };

  const startAddToCollection = async (
    gameIds: number[],
    gameNames: Map<number, string>,
    username: string,
    password: string,
  ) => {
    setGames(
      gameIds.map((id) => ({
        bggId: id,
        name: gameNames.get(id) ?? null,
        status: "pending" as const,
      })),
    );
    setPhase("connecting");
    setProgress({ current: 0, total: gameIds.length });
    setError(null);
    setSummary(null);

    try {
      const response = await fetch("/api/add-to-collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameIds, username, password }),
      });

      if (!response.ok || !response.body) {
        setError("Failed to connect");
        setPhase("error");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let processed = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const dataLine = line.trim();
          if (!dataLine.startsWith("data: ")) continue;

          try {
            const event: CollectionStreamEvent = JSON.parse(dataLine.slice(6));

            switch (event.type) {
              case "login":
                setPhase("scanning");
                break;
              case "login_failed":
                setError(event.message ?? "Login failed");
                setPhase("error");
                break;
              case "collection_scanned":
                setPhase("adding");
                break;
              case "game_adding":
                if (event.bggId) updateGameStatus(event.bggId, "adding");
                break;
              case "game_added":
                if (event.bggId) {
                  updateGameStatus(event.bggId, "added", event.title);
                  processed++;
                  setProgress((p) => ({ ...p, current: processed }));
                }
                break;
              case "game_failed":
                if (event.bggId) {
                  updateGameStatus(event.bggId, "failed");
                  processed++;
                  setProgress((p) => ({ ...p, current: processed }));
                }
                break;
              case "game_already_owned":
                if (event.bggId) {
                  updateGameStatus(event.bggId, "already_owned");
                  processed++;
                  setProgress((p) => ({ ...p, current: processed }));
                }
                break;
              case "done":
                setSummary({
                  added: event.totalAdded ?? 0,
                  failed: event.totalFailed ?? 0,
                });
                setPhase("done");
                break;
              case "error":
                setError(event.message ?? "Unknown error");
                setPhase("error");
                break;
            }
          } catch {
            // skip malformed events
          }
        }
      }
    } catch {
      setError("Connection failed");
      setPhase("error");
    }
  };

  const reset = () => {
    setGames([]);
    setPhase("idle");
    setProgress({ current: 0, total: 0 });
    setError(null);
    setSummary(null);
  };

  return {
    games,
    phase,
    progress,
    error,
    summary,
    startAddToCollection,
    reset,
  };
}
